import { beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { parseWords, type VocabAi } from '../src/ai.js';
import type { BillingVerifier, SubInfo } from '../src/billing.js';
import { loadConfig } from '../src/config.js';
import { openDb } from '../src/db.js';
import type { Mailer } from '../src/mailer.js';

const wordJson = (n: number, prefix = 'w') =>
  JSON.stringify({
    words: Array.from({ length: n }, (_, i) => ({
      word: `${prefix}${i}`, ipa: '/x/', pos: 'noun', meaning_vi: 'nghĩa', definition_en: 'def',
      example_en: 'An example.', example_vi: 'Ví dụ.', collocations: ['a b'],
    })),
  });

let aiCalls = 0;
const ai: VocabAi = {
  async generate(_l, _t, count, exclude) {
    aiCalls++;
    return '```json\n' + wordJson(count, exclude.length ? 'x' : 'w') + '\n```';
  },
};

let nextSub: SubInfo;
const billing: BillingVerifier = {
  google: async () => nextSub,
  apple: async () => nextSub,
};

const mails: { to: string; text: string }[] = [];
const mailer: Mailer = { send: async (to, _s, text) => void mails.push({ to, text }) };
const lastCode = (to: string) => mails.filter((m) => m.to === to).at(-1)!.text.match(/\d{6}/)![0];

function setup() {
  aiCalls = 0;
  mails.length = 0;
  const cfg = { ...loadConfig({}), googleRtdnSecret: 's3cret' };
  const app = buildApp({ cfg, db: openDb(':memory:'), ai, billing, mailer });
  let n = 0;
  const register = async (verify = true) => {
    const email = `u${++n}@x.com`;
    const res = await app.inject({ method: 'POST', url: '/auth/register', payload: { email, password: 'password123' } });
    const headers = { Authorization: `Bearer ${res.json().access_token}` };
    if (verify) await app.inject({ method: 'POST', url: '/auth/verify-email', headers, payload: { code: lastCode(email) } });
    return headers;
  };
  return { app, register };
}

describe('parseWords', () => {
  it('drops invalid and duplicate items', () => {
    const raw = JSON.stringify({ words: [{ word: 'a', meaning_vi: 'x', example_en: 'e' }, { word: 'A', meaning_vi: 'x', example_en: 'e' }, { word: 'b' }] });
    expect(parseWords(raw).map((w) => w.word)).toEqual(['a']);
  });
  it('returns [] for garbage', () => expect(parseWords('nope')).toEqual([]));
});

describe('auth', () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(() => (ctx = setup()));

  it('registers, logs in, rejects bad password and duplicate email', async () => {
    const { app } = ctx;
    const r = await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'a@b.com', password: 'password123' } });
    expect(r.statusCode).toBe(201);
    expect((await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'a@b.com', password: 'password123' } })).statusCode).toBe(409);
    expect((await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'a@b.com', password: 'wrongpass1' } })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'a@b.com', password: 'password123' } })).statusCode).toBe(200);
  });

  it('refresh token cannot be used as access token', async () => {
    const { app } = ctx;
    const r = (await app.inject({ method: 'POST', url: '/auth/register', payload: { email: 'a@b.com', password: 'password123' } })).json();
    expect((await app.inject({ method: 'GET', url: '/me', headers: { Authorization: `Bearer ${r.refresh_token}` } })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/auth/refresh', payload: { refresh_token: r.refresh_token } })).statusCode).toBe(200);
  });
});

describe('email verification and password reset', () => {
  it('blocks AI until the emailed code is verified; wrong code is rejected', async () => {
    const { app, register } = setup();
    const h = await register(false);
    const gen = () => app.inject({ method: 'POST', url: '/vocab/generate', headers: h, payload: { level: 'B2', topic: 'Technology' } });
    expect((await gen()).json().error).toBe('email_not_verified');
    const code = lastCode('u1@x.com');
    const wrong = code === '000000' ? '111111' : '000000';
    expect((await app.inject({ method: 'POST', url: '/auth/verify-email', headers: h, payload: { code: wrong } })).statusCode).toBe(400);
    expect((await app.inject({ method: 'POST', url: '/auth/verify-email', headers: h, payload: { code } })).statusCode).toBe(200);
    expect((await gen()).statusCode).toBe(200);
  });

  it('locks a code after 5 wrong attempts', async () => {
    const { app, register } = setup();
    const h = await register(false);
    const code = lastCode('u1@x.com');
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) await app.inject({ method: 'POST', url: '/auth/verify-email', headers: h, payload: { code: wrong } });
    expect((await app.inject({ method: 'POST', url: '/auth/verify-email', headers: h, payload: { code } })).statusCode).toBe(400);
  });

  it('resets the password with an emailed code; unknown emails get the same 200', async () => {
    const { app, register } = setup();
    await register();
    expect((await app.inject({ method: 'POST', url: '/auth/forgot-password', payload: { email: 'nobody@x.com' } })).statusCode).toBe(200);
    expect(mails.some((m) => m.to === 'nobody@x.com')).toBe(false);
    await app.inject({ method: 'POST', url: '/auth/forgot-password', payload: { email: 'u1@x.com' } });
    const code = lastCode('u1@x.com');
    const r = await app.inject({ method: 'POST', url: '/auth/reset-password', payload: { email: 'u1@x.com', code, new_password: 'newpassword1' } });
    expect(r.statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'u1@x.com', password: 'newpassword1' } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'POST', url: '/auth/reset-password', payload: { email: 'u1@x.com', code, new_password: 'another123' } })).statusCode).toBe(400);
  });
});

describe('free tier limits', () => {
  it('enforces level, topic, word count, stripped cards and daily quota', async () => {
    const { app, register } = setup();
    const h = await register();
    const gen = (payload: object) => app.inject({ method: 'POST', url: '/vocab/generate', headers: h, payload });

    expect((await gen({ level: 'C1', topic: 'Technology' })).statusCode).toBe(403);
    expect((await gen({ level: 'B2', topic: 'Quantum cooking' })).statusCode).toBe(403);

    const ok = await gen({ level: 'B2', topic: 'Technology', count: 20 });
    expect(ok.statusCode).toBe(200);
    const body = ok.json();
    expect(body.words).toHaveLength(8);
    expect(body.words[0].ipa).toBe('');
    expect(body.remaining).toBe(2);

    await gen({ level: 'B2', topic: 'Technology', count: 20 }); // cache hit
    expect(aiCalls).toBe(1);
    await gen({ level: 'B2', topic: 'Technology', count: 20 });
    const over = await gen({ level: 'B2', topic: 'Technology', count: 20 });
    expect(over.statusCode).toBe(429);
    expect(over.json().error).toBe('quota_exceeded');
  });

  it('blocks sync for free users', async () => {
    const { app, register } = setup();
    const h = await register();
    expect((await app.inject({ method: 'POST', url: '/sync', headers: h, payload: {} })).statusCode).toBe(403);
  });
});

describe('billing + premium', () => {
  it('upgrades on verified purchase and unlocks premium features and sync', async () => {
    const { app, register } = setup();
    const h = await register();
    nextSub = { source: 'google', productId: 'premium_monthly', originalTransactionId: 'g:tok1', active: true, expiresAt: Date.now() + 86400_000 };
    const v = await app.inject({ method: 'POST', url: '/billing/google/verify', headers: h, payload: { product_id: 'premium_monthly', purchase_token: 'tok1' } });
    expect(v.json().plan).toBe('premium');

    const g = await app.inject({ method: 'POST', url: '/vocab/generate', headers: h, payload: { level: 'C1', topic: 'Quantum cooking', count: 15 } });
    expect(g.statusCode).toBe(200);
    expect(g.json().words).toHaveLength(15);
    expect(g.json().words[0].ipa).toBe('/x/');

    const s1 = await app.inject({ method: 'POST', url: '/sync', headers: h, payload: { since: 0, changes: [{ id: 'a', data: { w: 1 }, updated_at: 10 }] } });
    expect(s1.json().changes).toHaveLength(1);
    // older write loses, newer wins, delete propagates
    await app.inject({ method: 'POST', url: '/sync', headers: h, payload: { changes: [{ id: 'a', data: { w: 0 }, updated_at: 5 }] } });
    const s2 = await app.inject({ method: 'POST', url: '/sync', headers: h, payload: { since: 0, changes: [{ id: 'a', data: { w: 2 }, updated_at: 20, deleted: true }] } });
    expect(s2.json().changes[0]).toMatchObject({ id: 'a', data: { w: 2 }, deleted: true });
    const s3 = await app.inject({ method: 'POST', url: '/sync', headers: h, payload: { since: s2.json().cursor } });
    expect(s3.json().changes).toHaveLength(0);
  });

  it('refuses a purchase already linked to another account', async () => {
    const { app, register } = setup();
    const h1 = await register();
    const h2 = await register();
    nextSub = { source: 'apple', productId: 'p', originalTransactionId: 'a:1', active: true, expiresAt: Date.now() + 1e6 };
    await app.inject({ method: 'POST', url: '/billing/apple/verify', headers: h1, payload: { transaction_id: '1' } });
    const r = await app.inject({ method: 'POST', url: '/billing/apple/verify', headers: h2, payload: { transaction_id: '1' } });
    expect(r.statusCode).toBe(409);
  });

  it('RTDN requires the secret and downgrades expired subscriptions', async () => {
    const { app, register } = setup();
    const h = await register();
    nextSub = { source: 'google', productId: 'p', originalTransactionId: 'g:t', active: true, expiresAt: Date.now() + 1e6 };
    await app.inject({ method: 'POST', url: '/billing/google/verify', headers: h, payload: { product_id: 'p', purchase_token: 't' } });

    const data = Buffer.from(JSON.stringify({ subscriptionNotification: { purchaseToken: 't', subscriptionId: 'p' } })).toString('base64');
    expect((await app.inject({ method: 'POST', url: '/billing/google/rtdn?token=bad', payload: { message: { data } } })).statusCode).toBe(401);

    nextSub = { ...nextSub, active: false, expiresAt: Date.now() - 1000 };
    expect((await app.inject({ method: 'POST', url: '/billing/google/rtdn?token=s3cret', payload: { message: { data } } })).statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: '/me', headers: h })).json().plan).toBe('free');
  });
});
