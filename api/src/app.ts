import { createHash, randomInt, randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import bcrypt from 'bcryptjs';
import { decodeJwt } from 'jose';
import { z } from 'zod';
import { generateWords, type VocabAi, type VocabWord } from './ai.js';
import type { BillingVerifier, SubInfo } from './billing.js';
import type { Config } from './config.js';
import type { DB } from './db.js';
import type { Mailer } from './mailer.js';
import { LIMITS, PRESET_TOPICS, dayKey, type Level, type Plan } from './limits.js';

export interface Deps {
  cfg: Config;
  db: DB;
  ai: VocabAi;
  billing: BillingVerifier;
  mailer: Mailer;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; typ: 'access' | 'refresh' };
    user: { sub: string; typ: 'access' | 'refresh' };
  }
}

const fail = (reply: FastifyReply, status: number, error: string, message: string, extra: object = {}) =>
  reply.status(status).send({ error, message, ...extra });

export function buildApp({ cfg, db, ai, billing, mailer }: Deps): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(jwt, { secret: cfg.jwtSecret });
  app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

  const issue = (sub: string) => ({
    access_token: app.jwt.sign({ sub, typ: 'access' }, { expiresIn: '15m' }),
    refresh_token: app.jwt.sign({ sub, typ: 'refresh' }, { expiresIn: '30d' }),
  });

  const auth = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify();
      if (req.user.typ !== 'access') throw new Error('wrong token type');
    } catch {
      return fail(reply, 401, 'unauthorized', 'Invalid or expired token');
    }
  };

  // ---------- email codes (6 digits, 15 min, 5 attempts) ----------
  const hashCode = (email: string, code: string) => createHash('sha256').update(`${email}:${code}:${cfg.jwtSecret}`).digest('hex');

  const sendCode = async (email: string, purpose: 'verify' | 'reset') => {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    db.prepare('INSERT OR REPLACE INTO email_codes (email, purpose, code_hash, expires_at, attempts) VALUES (?, ?, ?, ?, 0)').run(
      email, purpose, hashCode(email, code), Date.now() + 15 * 60_000,
    );
    const subject = purpose === 'verify' ? 'Mã xác minh email' : 'Mã đặt lại mật khẩu';
    await mailer.send(email, subject, `Mã của bạn là: ${code}\nMã có hiệu lực trong 15 phút. Nếu không phải bạn yêu cầu, hãy bỏ qua email này.`);
  };

  const checkCode = (email: string, purpose: 'verify' | 'reset', code: string): boolean => {
    const row = db.prepare('SELECT * FROM email_codes WHERE email = ? AND purpose = ?').get(email, purpose) as any;
    if (!row || row.expires_at < Date.now() || row.attempts >= 5) return false;
    if (row.code_hash !== hashCode(email, code)) {
      db.prepare('UPDATE email_codes SET attempts = attempts + 1 WHERE email = ? AND purpose = ?').run(email, purpose);
      return false;
    }
    db.prepare('DELETE FROM email_codes WHERE email = ? AND purpose = ?').run(email, purpose);
    return true;
  };

  const verified = async (req: FastifyRequest, reply: FastifyReply) => {
    await auth(req, reply);
    if (reply.sent) return;
    const u = db.prepare('SELECT email_verified FROM users WHERE id = ?').get(req.user.sub) as any;
    if (!u?.email_verified) return fail(reply, 403, 'email_not_verified', 'Please verify your email first');
  };

  const planOf = (userId: string): { plan: Plan; expiresAt: number | null; source: string | null } => {
    const row = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId) as any;
    if (row && row.status === 'active' && row.expires_at > Date.now())
      return { plan: 'premium', expiresAt: row.expires_at, source: row.source };
    return { plan: 'free', expiresAt: row?.expires_at ?? null, source: row?.source ?? null };
  };

  const usedToday = (userId: string): number =>
    ((db.prepare('SELECT count FROM usage_daily WHERE user_id = ? AND day = ?').get(userId, dayKey()) as any)?.count ?? 0);

  const applySub = (userId: string, info: SubInfo): boolean => {
    const owner = db
      .prepare('SELECT user_id FROM subscriptions WHERE original_transaction_id = ?')
      .get(info.originalTransactionId) as any;
    if (owner && owner.user_id !== userId) return false;
    db.prepare(
      `INSERT INTO subscriptions (user_id, source, product_id, original_transaction_id, status, expires_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET source = excluded.source, product_id = excluded.product_id,
         original_transaction_id = excluded.original_transaction_id, status = excluded.status,
         expires_at = excluded.expires_at, updated_at = excluded.updated_at`,
    ).run(userId, info.source, info.productId, info.originalTransactionId, info.active ? 'active' : 'expired', info.expiresAt, Date.now());
    return true;
  };

  const refreshByOriginalId = (info: SubInfo) => {
    db.prepare(
      'UPDATE subscriptions SET status = ?, expires_at = ?, product_id = ?, updated_at = ? WHERE original_transaction_id = ?',
    ).run(info.active ? 'active' : 'expired', info.expiresAt, info.productId, Date.now(), info.originalTransactionId);
  };

  // ---------- health ----------
  app.get('/health', async () => ({ ok: true }));

  // ---------- auth ----------
  const creds = z.object({ email: z.string().email().max(200), password: z.string().min(8).max(200) });

  app.post('/auth/register', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    const body = creds.extend({ name: z.string().max(100).optional() }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'invalid_input', 'Email or password invalid (password min 8 chars)');
    const email = body.data.email.toLowerCase();
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) return fail(reply, 409, 'email_taken', 'Email already registered');
    const id = randomUUID();
    db.prepare('INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)').run(
      id, email, await bcrypt.hash(body.data.password, 10), body.data.name ?? '', Date.now(),
    );
    await sendCode(email, 'verify').catch((e) => app.log.error(e));
    return reply.status(201).send(issue(id));
  });

  app.post('/auth/login', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    const body = creds.safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'invalid_input', 'Email or password invalid');
    const u = db.prepare('SELECT * FROM users WHERE email = ?').get(body.data.email.toLowerCase()) as any;
    if (!u || !(await bcrypt.compare(body.data.password, u.password_hash)))
      return fail(reply, 401, 'bad_credentials', 'Wrong email or password');
    return issue(u.id);
  });

  app.post('/auth/refresh', async (req, reply) => {
    const body = z.object({ refresh_token: z.string() }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'invalid_input', 'refresh_token required');
    try {
      const p = app.jwt.verify<{ sub: string; typ: string }>(body.data.refresh_token);
      if (p.typ !== 'refresh' || !db.prepare('SELECT 1 FROM users WHERE id = ?').get(p.sub)) throw new Error();
      return issue(p.sub);
    } catch {
      return fail(reply, 401, 'unauthorized', 'Invalid refresh token');
    }
  });

  app.post('/auth/verify-email', { preHandler: auth }, async (req, reply) => {
    const body = z.object({ code: z.string().regex(/^\d{6}$/) }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'invalid_input', 'Code must be 6 digits');
    const u = db.prepare('SELECT email FROM users WHERE id = ?').get(req.user.sub) as any;
    if (!checkCode(u.email, 'verify', body.data.code)) return fail(reply, 400, 'bad_code', 'Invalid or expired code');
    db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(req.user.sub);
    return { ok: true };
  });

  app.post('/auth/resend-verification', { preHandler: auth, config: { rateLimit: { max: 3, timeWindow: '1 minute' } } }, async (req) => {
    const u = db.prepare('SELECT email, email_verified FROM users WHERE id = ?').get(req.user.sub) as any;
    if (!u.email_verified) await sendCode(u.email, 'verify');
    return { ok: true };
  });

  // Always answers 200 so the endpoint cannot be used to discover which emails are registered.
  app.post('/auth/forgot-password', { config: { rateLimit: { max: 3, timeWindow: '1 minute' } } }, async (req, reply) => {
    const body = z.object({ email: z.string().email() }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'invalid_input', 'Valid email required');
    const email = body.data.email.toLowerCase();
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) await sendCode(email, 'reset').catch((e) => app.log.error(e));
    return { ok: true };
  });

  app.post('/auth/reset-password', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    const body = z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/), new_password: z.string().min(8).max(200) }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'invalid_input', 'email, 6-digit code and new_password (min 8) required');
    const email = body.data.email.toLowerCase();
    if (!checkCode(email, 'reset', body.data.code)) return fail(reply, 400, 'bad_code', 'Invalid or expired code');
    // A valid reset code also proves ownership of the mailbox.
    db.prepare('UPDATE users SET password_hash = ?, email_verified = 1 WHERE email = ?').run(await bcrypt.hash(body.data.new_password, 10), email);
    return { ok: true };
  });

  // ---------- profile ----------
  const meView = (userId: string) => {
    const u = db.prepare('SELECT id, email, name, target_level, email_verified FROM users WHERE id = ?').get(userId) as any;
    const p = planOf(userId);
    const lim = LIMITS[p.plan];
    const used = usedToday(userId);
    return {
      user: { id: u.id, email: u.email, name: u.name, target_level: u.target_level, email_verified: !!u.email_verified },
      plan: p.plan,
      expires_at: p.expiresAt,
      limits: lim,
      quota: { used, limit: lim.gensPerDay, remaining: Math.max(0, lim.gensPerDay - used) },
    };
  };

  app.get('/me', { preHandler: auth }, async (req) => meView(req.user.sub));

  app.patch('/me', { preHandler: auth }, async (req, reply) => {
    const body = z.object({ name: z.string().max(100).optional(), target_level: z.enum(['B2', 'C1']).optional() }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'invalid_input', 'Invalid profile data');
    db.prepare('UPDATE users SET name = COALESCE(?, name), target_level = COALESCE(?, target_level) WHERE id = ?').run(
      body.data.name ?? null, body.data.target_level ?? null, req.user.sub,
    );
    return meView(req.user.sub);
  });

  // ---------- vocab ----------
  app.get('/vocab/topics', async () => ({ topics: PRESET_TOPICS }));

  const genBody = z.object({
    level: z.enum(['B2', 'C1']),
    topic: z.string().trim().min(2).max(60).regex(/^[\p{L}\p{N} .,'&()\/-]+$/u),
    count: z.number().int().min(1).max(50).optional(),
    fresh: z.boolean().optional(),
  });

  app.post('/vocab/generate', { preHandler: verified, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (req, reply) => {
    const body = genBody.safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'invalid_input', 'level must be B2|C1 and topic 2-60 plain characters');
    const userId = req.user.sub;
    const { plan } = planOf(userId);
    const lim = LIMITS[plan];
    const level = body.data.level as Level;
    const topic = body.data.topic.replace(/\s+/g, ' ');

    if (!lim.levels.includes(level)) return fail(reply, 403, 'premium_required', `Level ${level} requires Premium`);
    if (!lim.customTopics && !PRESET_TOPICS.some((t) => t.toLowerCase() === topic.toLowerCase()))
      return fail(reply, 403, 'premium_required', 'Custom topics require Premium');
    const used = usedToday(userId);
    if (used >= lim.gensPerDay)
      return fail(reply, 429, 'quota_exceeded', 'Daily generation limit reached', { limit: lim.gensPerDay, remaining: 0 });

    const count = Math.min(body.data.count ?? lim.maxWordsPerGen, lim.maxWordsPerGen);
    const key = `${level}|${topic.toLowerCase()}|${count}`;
    let words: VocabWord[] | undefined;
    const cached = body.data.fresh && plan === 'premium' ? undefined : (db.prepare('SELECT payload FROM generation_cache WHERE key = ?').get(key) as any);
    if (cached) words = JSON.parse(cached.payload);
    if (!words) {
      try {
        words = await generateWords(ai, level, topic, count);
      } catch (e) {
        app.log.error(e);
        return fail(reply, 503, 'ai_unavailable', 'AI generation failed, please try again');
      }
      db.prepare('INSERT OR REPLACE INTO generation_cache (key, payload, created_at) VALUES (?, ?, ?)').run(key, JSON.stringify(words), Date.now());
    }

    db.prepare(
      `INSERT INTO usage_daily (user_id, day, count) VALUES (?, ?, 1) ON CONFLICT(user_id, day) DO UPDATE SET count = count + 1`,
    ).run(userId, dayKey());

    const out = lim.fullCards
      ? words
      : words.map((w) => ({ ...w, ipa: '', example_vi: '', collocations: [], definition_en: '' }));
    return { level, topic, words: out, remaining: Math.max(0, lim.gensPerDay - used - 1), limit: lim.gensPerDay };
  });

  // ---------- sync (premium) ----------
  const syncBody = z.object({
    since: z.number().int().min(0).default(0),
    changes: z
      .array(
        z.object({
          id: z.string().min(1).max(100),
          data: z.record(z.unknown()),
          updated_at: z.number().int(),
          deleted: z.boolean().default(false),
        }),
      )
      .max(500)
      .default([]),
  });

  app.post('/sync', { preHandler: verified }, async (req, reply) => {
    const userId = req.user.sub;
    if (!LIMITS[planOf(userId).plan].sync) return fail(reply, 403, 'premium_required', 'Sync requires Premium');
    const body = syncBody.safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'invalid_input', 'Invalid sync payload');

    const tx = db.transaction(() => {
      const nextSeq = db.prepare('SELECT COALESCE(MAX(seq), 0) + 1 AS n FROM words WHERE user_id = ?').pluck();
      const get = db.prepare('SELECT updated_at FROM words WHERE user_id = ? AND id = ?');
      const upsert = db.prepare(
        `INSERT INTO words (user_id, id, data, updated_at, deleted, seq) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at,
           deleted = excluded.deleted, seq = excluded.seq`,
      );
      for (const c of body.data.changes) {
        const existing = get.get(userId, c.id) as any;
        if (existing && existing.updated_at >= c.updated_at) continue; // last-write-wins
        upsert.run(userId, c.id, JSON.stringify(c.data), c.updated_at, c.deleted ? 1 : 0, nextSeq.get(userId));
      }
      return db.prepare('SELECT id, data, updated_at, deleted, seq FROM words WHERE user_id = ? AND seq > ? ORDER BY seq').all(userId, body.data.since) as any[];
    });
    const rows = tx();
    return {
      cursor: rows.length ? rows[rows.length - 1].seq : body.data.since,
      changes: rows.map((r) => ({ id: r.id, data: JSON.parse(r.data), updated_at: r.updated_at, deleted: !!r.deleted })),
    };
  });

  // ---------- billing ----------
  const respondSub = (reply: FastifyReply, userId: string, info: SubInfo) =>
    applySub(userId, info)
      ? { ...meView(userId), verified: info.active }
      : fail(reply, 409, 'subscription_in_use', 'This purchase is linked to another account');

  app.post('/billing/google/verify', { preHandler: verified }, async (req, reply) => {
    const body = z.object({ product_id: z.string().max(200), purchase_token: z.string().max(2000) }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'invalid_input', 'product_id and purchase_token required');
    try {
      return respondSub(reply, req.user.sub, await billing.google(body.data.product_id, body.data.purchase_token));
    } catch (e) {
      app.log.error(e);
      return fail(reply, 502, 'verification_failed', 'Could not verify purchase with Google Play');
    }
  });

  app.post('/billing/apple/verify', { preHandler: verified }, async (req, reply) => {
    const body = z.object({ transaction_id: z.string().max(100) }).safeParse(req.body);
    if (!body.success) return fail(reply, 422, 'invalid_input', 'transaction_id required');
    try {
      return respondSub(reply, req.user.sub, await billing.apple(body.data.transaction_id));
    } catch (e) {
      app.log.error(e);
      return fail(reply, 502, 'verification_failed', 'Could not verify purchase with the App Store');
    }
  });

  // Google Pub/Sub push (Real-time developer notifications). Authenticated by shared secret in the URL.
  app.post('/billing/google/rtdn', async (req, reply) => {
    const secret = (req.query as any)?.token;
    if (!cfg.googleRtdnSecret || secret !== cfg.googleRtdnSecret) return fail(reply, 401, 'unauthorized', 'Bad token');
    try {
      const data = JSON.parse(Buffer.from((req.body as any)?.message?.data ?? '', 'base64').toString('utf8'));
      const n = data.subscriptionNotification;
      if (n?.purchaseToken) refreshByOriginalId(await billing.google(n.subscriptionId ?? '', n.purchaseToken));
      return { ok: true };
    } catch (e) {
      app.log.error(e);
      return fail(reply, 500, 'rtdn_failed', 'Failed'); // non-2xx makes Pub/Sub retry
    }
  });

  // App Store Server Notifications v2. The payload is only used to find the transaction id;
  // the real state is re-fetched from Apple with our own key, so a forged payload changes nothing.
  app.post('/billing/apple/notifications', async (req, reply) => {
    try {
      const signed = (req.body as any)?.signedPayload;
      const notification: any = decodeJwt(signed);
      const tx = decodeJwt(notification.data.signedTransactionInfo);
      if (tx.transactionId) refreshByOriginalId(await billing.apple(String(tx.transactionId)));
      return { ok: true };
    } catch (e) {
      app.log.error(e);
      return fail(reply, 500, 'notification_failed', 'Failed');
    }
  });

  return app;
}
