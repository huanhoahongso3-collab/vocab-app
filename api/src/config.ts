export interface Config {
  port: number;
  jwtSecret: string;
  dbPath: string;
  aiUrl: string;
  aiModel: string;
  aiKey: string;
  googlePackage: string;
  googleServiceAccountFile: string;
  googleRtdnSecret: string;
  appleBundleId: string;
  appleIssuerId: string;
  appleKeyId: string;
  applePrivateKeyFile: string;
  appleEnv: 'sandbox' | 'production';
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  mailFrom: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    port: Number(env.PORT ?? 3000),
    jwtSecret: env.JWT_SECRET ?? 'dev-secret-change-me',
    dbPath: env.DB_PATH ?? './vocab.db',
    aiUrl: env.AI_URL ?? 'https://chat-api.chuyenbienhoa.com/v1/chat/completions',
    aiModel: env.AI_MODEL ?? 'gemini-auto',
    aiKey: env.CYO_AI_API ?? '',
    googlePackage: env.GOOGLE_PACKAGE_NAME ?? 'dhp.fatties.vocab',
    googleServiceAccountFile: env.GOOGLE_SERVICE_ACCOUNT_FILE ?? './service-account.json',
    googleRtdnSecret: env.GOOGLE_RTDN_SECRET ?? '',
    appleBundleId: env.APPLE_BUNDLE_ID ?? 'dhp.fatties.vocab',
    appleIssuerId: env.APPLE_ISSUER_ID ?? '',
    appleKeyId: env.APPLE_KEY_ID ?? '',
    applePrivateKeyFile: env.APPLE_PRIVATE_KEY_FILE ?? './AuthKey.p8',
    appleEnv: env.APPLE_ENV === 'production' ? 'production' : 'sandbox',
    smtpHost: env.SMTP_HOST ?? '',
    smtpPort: Number(env.SMTP_PORT ?? 587),
    smtpUser: env.SMTP_USER ?? '',
    smtpPass: env.SMTP_PASS ?? '',
    mailFrom: env.MAIL_FROM ?? 'Vocab <no-reply@localhost>',
  };
}
