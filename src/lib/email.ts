/**
 * SMTP transport via Nodemailer.
 *
 * Defaults target the Google Workspace SMTP relay (fixed for everyone):
 *   host smtp-relay.gmail.com · port 587 (STARTTLS) · user g3@g3dc.com
 * The relay must be enabled in Workspace Admin (Apps → Google Workspace →
 * Gmail → Routing → SMTP relay service) with SMTP authentication allowed.
 * Authenticate with an App Password on SMTP_USER: enable 2-Step Verification,
 * then Security → App passwords → generate one and set it as SMTP_PASS.
 */
import nodemailer, { type Transporter } from 'nodemailer';
import { env } from './env';

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  bcc?: string;
}

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error('SMTP_USER / SMTP_PASS are not set — cannot send email.');
  }
  if (!_transporter) {
    const port = Number(env.SMTP_PORT) || 587;
    const secure = env.SMTP_SECURE != null ? env.SMTP_SECURE === 'true' : port === 465;
    _transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure, // true for 465 (SSL); false for 587 (STARTTLS)
      requireTLS: !secure, // enforce STARTTLS on 587 — never send AUTH in cleartext
      // Bound every phase so a stuck/unreachable relay can't hang the serverless
      // function until Vercel's timeout — it fails fast and the form falls back.
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 15000,
      // Google App Passwords are 16 chars with no spaces; the console shows them
      // grouped as "xxxx xxxx xxxx xxxx" — strip any whitespace that got copied in.
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS?.replace(/\s+/g, '') },
    });
  }
  return _transporter;
}

/** Validate the SMTP connection + credentials without sending a message. */
export async function verifyTransport(): Promise<true> {
  await getTransporter().verify();
  return true;
}

export async function sendMail(msg: MailMessage) {
  const transporter = getTransporter();
  const from = env.CONTACT_FROM || env.SMTP_USER!;
  return transporter.sendMail({
    from,
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
    replyTo: msg.replyTo,
    bcc: msg.bcc,
  });
}
