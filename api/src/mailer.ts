import nodemailer from 'nodemailer';
import type { Config } from './config.js';

export interface Mailer {
  send(to: string, subject: string, text: string): Promise<void>;
}

/** SMTP mailer. Without SMTP_HOST it just logs (development only). */
export function createMailer(cfg: Config): Mailer {
  if (!cfg.smtpHost) {
    return { send: async (to, subject, text) => console.log(`[mail:dev] to=${to} subject=${subject}\n${text}`) };
  }
  const transport = nodemailer.createTransport({
    host: cfg.smtpHost,
    port: cfg.smtpPort,
    secure: cfg.smtpPort === 465,
    auth: cfg.smtpUser ? { user: cfg.smtpUser, pass: cfg.smtpPass } : undefined,
  });
  return { send: (to, subject, text) => transport.sendMail({ from: cfg.mailFrom, to, subject, text }).then(() => {}) };
}
