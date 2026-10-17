import AsyncStorage from '@react-native-async-storage/async-storage';
import { demoGenerate, demoTopics } from './demoData';
import { demoMe, meFromApi, wordFromApi, wordFromChange, wordToChange, type Me, type VocabWord } from './models';

/** Demo build: EXPO_PUBLIC_DEMO=true. No login, no server, sample data only. */
export const DEMO = process.env.EXPO_PUBLIC_DEMO === 'true';
/** Use an https URL for real builds. 10.0.2.2 is the host machine seen from the Android emulator. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000';

export class ApiError extends Error {
  constructor(public code: string, message: string, public status?: number) {
    super(message);
  }
}

let access: string | null = null;
let refresh: string | null = null;

export async function loadSession(): Promise<boolean> {
  if (DEMO) return true;
  access = await AsyncStorage.getItem('access');
  refresh = await AsyncStorage.getItem('refresh');
  return refresh != null;
}

export const isLoggedIn = () => DEMO || refresh != null;

async function setTokens(j: any) {
  access = j.access_token;
  refresh = j.refresh_token;
  await AsyncStorage.multiSet([['access', access!], ['refresh', refresh!]]);
}

export async function logout() {
  access = refresh = null;
  await AsyncStorage.multiRemove(['access', 'refresh']);
}

async function raw(method: string, path: string, body?: unknown, withAuth = true): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 90_000);
  try {
    return await fetch(API_URL + path, {
      method,
      headers: { 'content-type': 'application/json', ...(withAuth && access ? { authorization: `Bearer ${access}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl.signal,
    });
  } catch {
    throw new ApiError('network', 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
  } finally {
    clearTimeout(timer);
  }
}

async function call<T = any>(method: string, path: string, body?: unknown, withAuth = true): Promise<T> {
  let res = await raw(method, path, body, withAuth);
  if (res.status === 401 && withAuth && refresh && !path.startsWith('/auth/')) {
    const r = await raw('POST', '/auth/refresh', { refresh_token: refresh }, false);
    if (r.ok) {
      await setTokens(await r.json());
      res = await raw(method, path, body, withAuth);
    } else {
      await logout();
    }
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? 'error', data.message ?? 'Có lỗi xảy ra', res.status);
  return data as T;
}

export const api = {
  async register(email: string, password: string, name: string) {
    await setTokens(await call('POST', '/auth/register', { email, password, name }, false));
  },
  async login(email: string, password: string) {
    await setTokens(await call('POST', '/auth/login', { email, password }, false));
  },
  verifyEmail: (code: string) => call('POST', '/auth/verify-email', { code }),
  resendVerification: () => call('POST', '/auth/resend-verification'),
  forgotPassword: (email: string) => call('POST', '/auth/forgot-password', { email }, false),
  resetPassword: (email: string, code: string, newPassword: string) =>
    call('POST', '/auth/reset-password', { email, code, new_password: newPassword }, false),

  async me(): Promise<Me> {
    return DEMO ? demoMe : meFromApi(await call('GET', '/me'));
  },
  async topics(): Promise<string[]> {
    return DEMO ? demoTopics : (await call('GET', '/vocab/topics')).topics;
  },
  async generate(level: string, topic: string, count: number): Promise<VocabWord[]> {
    if (DEMO) {
      await new Promise((r) => setTimeout(r, 900)); // feel like a real request
      return demoGenerate(level, topic, count);
    }
    const d = await call('POST', '/vocab/generate', { level, topic, count });
    return d.words.map((w: any) => wordFromApi(w, level, topic));
  },
  async sync(since: number, changes: VocabWord[]) {
    const d = await call('POST', '/sync', { since, changes: changes.map(wordToChange) });
    return { cursor: d.cursor as number, changes: (d.changes as any[]).map(wordFromChange) };
  },
  async verifyGoogle(productId: string, purchaseToken: string): Promise<Me> {
    return meFromApi(await call('POST', '/billing/google/verify', { product_id: productId, purchase_token: purchaseToken }));
  },
  async verifyApple(transactionId: string): Promise<Me> {
    return meFromApi(await call('POST', '/billing/apple/verify', { transaction_id: transactionId }));
  },
};
