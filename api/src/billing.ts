import { readFileSync } from 'node:fs';
import { GoogleAuth } from 'google-auth-library';
import { SignJWT, importPKCS8, decodeJwt } from 'jose';
import type { Config } from './config.js';

export interface SubInfo {
  source: 'google' | 'apple';
  productId: string;
  originalTransactionId: string;
  active: boolean;
  expiresAt: number; // ms
}

export interface BillingVerifier {
  google(productId: string, purchaseToken: string): Promise<SubInfo>;
  apple(transactionId: string): Promise<SubInfo>;
}

const GOOGLE_ACTIVE = new Set(['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD']);

/**
 * Verifies purchases server-to-server: Google Play Developer API (subscriptionsv2) and
 * App Store Server API. Both are fetched directly from the store with our own credentials,
 * so the response is authoritative; client/webhook payloads are never trusted by themselves.
 */
export function createBilling(cfg: Config): BillingVerifier {
  let auth: GoogleAuth | undefined;
  const googleClient = () =>
    (auth ??= new GoogleAuth({
      keyFile: cfg.googleServiceAccountFile,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    }));

  return {
    async google(productId, purchaseToken) {
      const client = await googleClient().getClient();
      const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${cfg.googlePackage}`;
      const res = await client.request<any>({
        url: `${base}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`,
      });
      const data = res.data;
      const line = data.lineItems?.[0];
      if (!line) throw new Error('Google: no line items');
      const pid = line.productId ?? productId;
      if (data.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING') {
        await client.request({
          url: `${base}/purchases/subscriptions/${encodeURIComponent(pid)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`,
          method: 'POST',
          data: {},
        });
      }
      const expiresAt = Date.parse(line.expiryTime);
      return {
        source: 'google',
        productId: pid,
        originalTransactionId: `g:${data.linkedPurchaseToken ?? purchaseToken}`,
        active: GOOGLE_ACTIVE.has(data.subscriptionState) && expiresAt > Date.now(),
        expiresAt,
      };
    },

    async apple(transactionId) {
      const pem = readFileSync(cfg.applePrivateKeyFile, 'utf8');
      const key = await importPKCS8(pem, 'ES256');
      const now = Math.floor(Date.now() / 1000);
      const jwt = await new SignJWT({ bid: cfg.appleBundleId })
        .setProtectedHeader({ alg: 'ES256', kid: cfg.appleKeyId, typ: 'JWT' })
        .setIssuer(cfg.appleIssuerId)
        .setIssuedAt(now)
        .setExpirationTime(now + 300)
        .setAudience('appstoreconnect-v1')
        .sign(key);
      const host =
        cfg.appleEnv === 'production' ? 'api.storekit.itunes.apple.com' : 'api.storekit-sandbox.itunes.apple.com';
      const res = await fetch(`https://${host}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`, {
        headers: { authorization: `Bearer ${jwt}` },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`Apple HTTP ${res.status}`);
      const tx: any = decodeJwt(((await res.json()) as any).signedTransactionInfo);
      if (tx.bundleId !== cfg.appleBundleId) throw new Error('Apple: bundle mismatch');
      const expiresAt = Number(tx.expiresDate ?? 0);
      return {
        source: 'apple',
        productId: String(tx.productId ?? ''),
        originalTransactionId: `a:${tx.originalTransactionId}`,
        active: expiresAt > Date.now() && !tx.revocationDate,
        expiresAt,
      };
    },
  };
}
