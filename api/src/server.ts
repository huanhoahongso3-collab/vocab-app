import { buildApp } from './app.js';
import { createAi } from './ai.js';
import { createBilling } from './billing.js';
import { loadConfig } from './config.js';
import { openDb } from './db.js';
import { createMailer } from './mailer.js';

const cfg = loadConfig();
if (cfg.jwtSecret === 'dev-secret-change-me' && process.env.NODE_ENV === 'production')
  throw new Error('JWT_SECRET must be set in production');

const app = buildApp({ cfg, db: openDb(cfg.dbPath), ai: createAi(cfg), billing: createBilling(cfg), mailer: createMailer(cfg) });
app.listen({ port: cfg.port, host: '0.0.0.0' }).then(() => console.log(`vocab-api on :${cfg.port}`));
