/**
 * POST /api/contact
 *
 * Handles the hero contact-modal form. It:
 *   1. validates the payload,
 *   2. logs the submission to Postgres (so a lead is never lost, even if mail fails),
 *   3. emails the G3 team a styled notification AND auto-replies to the submitter,
 *   4. records the email outcome back on the row.
 *
 * Runs on-demand (serverless) while the rest of the site stays static.
 */
import type { APIRoute } from 'astro';
import { insertSubmission, setEmailStatus } from '../../lib/db';
import { sendMail } from '../../lib/email';
import { notificationEmail, autoReplyEmail, type EmailData } from '../../lib/emails';
import { env } from '../../lib/env';

export const prerender = false;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function clean(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const name = clean(body.name, 200);
  const email = clean(body.email, 320);
  const company = clean(body.company, 200);
  const need = clean(body.need, 200);
  const message = clean(body.message, 5000);

  // Honeypot: real users never fill a hidden field. Pretend success, do nothing.
  if (clean(body.website, 200) || clean(body.fax, 200)) {
    return json({ ok: true });
  }

  const errors: Record<string, string> = {};
  if (!name) errors.name = 'Name is required.';
  if (!email) errors.email = 'Email is required.';
  else if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address.';
  if (Object.keys(errors).length) return json({ ok: false, errors }, 422);

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    clientAddress ||
    null;
  const userAgent = request.headers.get('user-agent') || null;
  const source = clean(body.source, 100) || 'website-contact-modal';

  const submittedAt =
    new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(new Date()) + ' IST';

  // 1) Persist the lead first — never lose it to a mail hiccup.
  let id: number | null = null;
  let dbError = false;
  try {
    id = await insertSubmission({ name, email, company, need, message, source, ip, userAgent });
  } catch (e) {
    dbError = true;
    console.error('[contact] DB insert failed:', e);
  }

  // 2) Notify the team + auto-reply to the submitter.
  const data: EmailData = { id, name, email, company, need, message, source, submittedAt };
  let emailError = false;
  try {
    const to = env.CONTACT_TO || env.SMTP_USER;
    if (!to) throw new Error('CONTACT_TO / SMTP_USER not set — no recipient.');

    const notify = notificationEmail(data);
    const reply = autoReplyEmail(data);

    const results = await Promise.allSettled([
      // to the G3 team — reply-to threads straight back to the submitter
      sendMail({
        to,
        subject: notify.subject,
        html: notify.html,
        text: notify.text,
        replyTo: email,
        bcc: env.CONTACT_BCC,
      }),
      // branded confirmation to the submitter
      sendMail({
        to: email,
        subject: reply.subject,
        html: reply.html,
        text: reply.text,
        replyTo: to,
      }),
    ]);

    emailError = results.some((r) => r.status === 'rejected');
    for (const r of results) {
      if (r.status === 'rejected') console.error('[contact] email send rejected:', r.reason);
    }
  } catch (e) {
    emailError = true;
    console.error('[contact] email step failed:', e);
  }

  // 3) Record the outcome on the row (best-effort).
  if (id != null) {
    try {
      await setEmailStatus(id, emailError ? 'failed' : 'sent');
    } catch (e) {
      console.error('[contact] status update failed:', e);
    }
  }

  // Both sinks failed → tell the client so its mailto fallback fires.
  if (dbError && emailError) {
    return json({ ok: false, error: 'We could not process your message right now.' }, 502);
  }

  return json({ ok: true, id });
};

// Anything other than POST.
const methodNotAllowed: APIRoute = () =>
  new Response(JSON.stringify({ ok: false, error: 'Method not allowed.' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST' },
  });

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const DELETE = methodNotAllowed;
