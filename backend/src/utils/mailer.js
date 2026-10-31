import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export async function sendMail({ to, subject, text, html }) {
  if (!env.smtp.host) {
    console.info(`[Brightloop mail fallback]\nTo: ${to}\nSubject: ${subject}\n${text || html || ''}`);
    return { messageId: 'console-fallback' };
  }
  const transport = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
  return transport.sendMail({ from: env.smtp.from, to, subject, text, html });
}
