/**
 * Branded HTML emails, styled to match the G3 site (dark "night-mode" hero:
 * deep green-black ground, teal accents, Cormorant/Georgia serif display,
 * Manrope/Arial body, JetBrains-Mono/monospace eyebrows).
 *
 * Built for email clients, not browsers: table layout, fully inline CSS,
 * web-safe font fallbacks, and every piece of user input HTML-escaped.
 */
import { env } from './env';

export interface EmailData {
  id: number | null;
  name: string;
  email: string;
  company: string;
  need: string;
  message: string;
  source: string;
  submittedAt: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/* ----- brand tokens (mirrors src/styles/global.css :root + body.dark) ----- */
const C = {
  ground: '#06100E', // page bg (dark)
  card: '#0a1613', // card surface
  inset: '#061a19', // quoted / inset panels
  ink: '#eaf3f0', // primary text
  soft: '#9fb4b0', // secondary text
  faint: '#6f8884', // tertiary / meta
  teal: '#1B7B6E',
  tealBright: '#2AB89F',
  gold: '#ffe3ae', // warm night accent (hero italic)
  line: 'rgba(180,220,212,0.12)',
  serif: "Georgia, 'Cormorant Garamond', 'Times New Roman', serif",
  sans: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SFMono-Regular', Consolas, monospace",
};

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nl2br(s: string): string {
  return esc(s).replace(/\r?\n/g, '<br>');
}

function firstName(name: string): string {
  return (name.trim().split(/\s+/)[0] || name).trim();
}

/** Hidden preheader text (the gray preview line in most inboxes). */
function preheader(text: string): string {
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.ground};opacity:0;">${esc(
    text,
  )}</div>`;
}

/** The branded dark shell every email shares. */
function shell(opts: { preview: string; eyebrow: string; content: string }): string {
  const companyName = env.COMPANY_NAME!;
  const siteUrl = env.SITE_URL!;
  const siteHost = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(companyName)}</title>
</head>
<body style="margin:0;padding:0;background:${C.ground};color:${C.ink};-webkit-font-smoothing:antialiased;">
${preheader(opts.preview)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.ground};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:${C.card};border:1px solid ${C.line};border-radius:18px;overflow:hidden;">
        <!-- teal accent bar (echoes the hero's grid flows) -->
        <tr><td style="height:4px;line-height:4px;font-size:0;background:${C.teal};">&nbsp;</td></tr>

        <!-- header lockup -->
        <tr>
          <td style="padding:30px 36px 18px 36px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="vertical-align:middle;">
                  <span style="font-family:${C.serif};font-size:30px;font-weight:600;letter-spacing:0.02em;color:${C.ink};">G3</span>
                </td>
                <td align="right" style="vertical-align:middle;font-family:${C.mono};font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${C.tealBright};">
                  Global&nbsp;Green&nbsp;Grid
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="padding:0 36px;"><div style="height:1px;background:${C.line};line-height:1px;font-size:0;">&nbsp;</div></td></tr>

        <!-- content -->
        <tr>
          <td style="padding:30px 36px 8px 36px;">
            <div style="font-family:${C.mono};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${C.tealBright};margin:0 0 14px 0;">${esc(
              opts.eyebrow,
            )}</div>
            ${opts.content}
          </td>
        </tr>

        <!-- footer -->
        <tr><td style="padding:8px 36px 0 36px;"><div style="height:1px;background:${C.line};line-height:1px;font-size:0;">&nbsp;</div></td></tr>
        <tr>
          <td style="padding:22px 36px 30px 36px;">
            <div style="font-family:${C.serif};font-size:16px;color:${C.ink};margin-bottom:4px;">${esc(companyName)}</div>
            <div style="font-family:${C.sans};font-size:12px;line-height:1.6;color:${C.faint};">
              Sovereign, sustainable, AI-era data centres — across four Indian metros.<br>
              <a href="${esc(siteUrl)}" style="color:${C.tealBright};text-decoration:none;">${esc(siteHost)}</a>
            </div>
          </td>
        </tr>
      </table>
      <div style="font-family:${C.sans};font-size:11px;color:${C.faint};padding:16px 8px 0 8px;">© ${new Date().getFullYear()} ${esc(
        companyName,
      )}</div>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function valueOrDash(v: string): string {
  return v && v.trim() ? esc(v) : '—';
}

/** Notification to the G3 team — the full submission. */
export function notificationEmail(d: EmailData): RenderedEmail {
  const fn = firstName(d.name);
  const needLine = d.need ? ` · ${d.need}` : '';
  const subject = `New enquiry — ${d.name}${needLine}`;

  const detailRow = (label: string, valueHtml: string) => `
    <tr>
      <td style="padding:11px 0;border-bottom:1px solid ${C.line};font-family:${C.mono};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${C.faint};white-space:nowrap;vertical-align:top;width:130px;">${esc(
        label,
      )}</td>
      <td style="padding:11px 0;border-bottom:1px solid ${C.line};font-family:${C.sans};font-size:14px;color:${C.ink};vertical-align:top;">${valueHtml}</td>
    </tr>`;

  const content = `
    <h1 style="margin:0 0 6px 0;font-family:${C.serif};font-weight:600;font-size:30px;line-height:1.15;color:${C.ink};">${esc(
      d.name,
    )}</h1>
    <p style="margin:0 0 24px 0;font-family:${C.sans};font-size:15px;color:${C.soft};">wants to talk to G3.</p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 22px 0;">
      ${detailRow('Email', `<a href="mailto:${esc(d.email)}" style="color:${C.tealBright};text-decoration:none;">${esc(d.email)}</a>`)}
      ${detailRow('Company', valueOrDash(d.company))}
      ${detailRow('Interested in', valueOrDash(d.need))}
    </table>

    ${
      d.message.trim()
        ? `<div style="font-family:${C.mono};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${C.faint};margin:0 0 10px 0;">Message</div>
    <div style="background:${C.inset};border-left:3px solid ${C.teal};border-radius:0 10px 10px 0;padding:16px 18px;font-family:${C.sans};font-size:15px;line-height:1.7;color:${C.ink};">${nl2br(
            d.message,
          )}</div>`
        : `<div style="font-family:${C.sans};font-size:14px;color:${C.faint};font-style:italic;">No message provided.</div>`
    }

    <!-- reply CTA -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 8px 0;">
      <tr>
        <td style="border-radius:999px;background:${C.teal};">
          <a href="mailto:${esc(d.email)}?subject=${encodeURIComponent(
            'Re: your enquiry to G3',
          )}" style="display:inline-block;padding:13px 26px;font-family:${C.sans};font-size:14px;font-weight:600;color:#eafff9;text-decoration:none;border-radius:999px;">Reply to ${esc(
            fn,
          )} &rarr;</a>
        </td>
      </tr>
    </table>

    <div style="margin-top:18px;font-family:${C.mono};font-size:11px;line-height:1.7;color:${C.faint};">
      Received ${esc(d.submittedAt)}${d.id != null ? ` · ref #${d.id}` : ''}<br>
      Source: ${esc(d.source)} · logged to database
    </div>`;

  const text = [
    `NEW ENQUIRY — ${d.name}`,
    ``,
    `Name:          ${d.name}`,
    `Email:         ${d.email}`,
    `Company:       ${d.company || '—'}`,
    `Interested in: ${d.need || '—'}`,
    ``,
    `Message:`,
    d.message.trim() || '(none)',
    ``,
    `Received ${d.submittedAt}${d.id != null ? ` · ref #${d.id}` : ''}`,
    `Source: ${d.source} · logged to database`,
  ].join('\n');

  return { subject, html: shell({ preview: `${d.name}${needLine} — ${d.email}`, eyebrow: 'New enquiry', content }), text };
}

/** Auto-reply to the person who submitted — a branded confirmation. */
export function autoReplyEmail(d: EmailData): RenderedEmail {
  const fn = firstName(d.name);
  const subject = `Thanks ${fn} — we've received your message`;
  const wants = d.need ? `your interest in ${esc(d.need)}` : 'your requirements';

  const recap =
    d.message.trim() || d.company.trim() || d.need.trim()
      ? `<div style="font-family:${C.mono};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${C.faint};margin:26px 0 10px 0;">What you sent us</div>
    <div style="background:${C.inset};border:1px solid ${C.line};border-radius:12px;padding:16px 18px;font-family:${C.sans};font-size:14px;line-height:1.7;color:${C.soft};">
      ${d.company.trim() ? `<div><span style="color:${C.faint};">Company:</span> ${esc(d.company)}</div>` : ''}
      ${d.need.trim() ? `<div><span style="color:${C.faint};">Interested in:</span> ${esc(d.need)}</div>` : ''}
      ${d.message.trim() ? `<div style="margin-top:8px;color:${C.ink};">${nl2br(d.message)}</div>` : ''}
    </div>`
      : '';

  const content = `
    <h1 style="margin:0 0 14px 0;font-family:${C.serif};font-weight:600;font-size:32px;line-height:1.12;color:${C.ink};">Thank you, <span style="font-style:italic;color:${C.gold};">${esc(
      fn,
    )}</span>.</h1>
    <p style="margin:0 0 16px 0;font-family:${C.sans};font-size:16px;line-height:1.7;color:${C.soft};">
      Your message has reached the right desk at G3. A member of our team will be in touch shortly to talk through ${wants}.
    </p>
    <p style="margin:0 0 4px 0;font-family:${C.sans};font-size:16px;line-height:1.7;color:${C.soft};">
      We typically respond within one business day. If it's urgent, simply reply to this email — it reaches us directly.
    </p>
    ${recap}
    <div style="margin-top:28px;font-family:${C.serif};font-size:17px;color:${C.ink};">— The G3 Team</div>
    <div style="margin-top:4px;font-family:${C.mono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${C.faint};">Global Green Grid · Data Centres Reimagined</div>`;

  const text = [
    `Thank you, ${fn}.`,
    ``,
    `Your message has reached the right desk at G3. A member of our team will`,
    `be in touch shortly to talk through ${d.need ? `your interest in ${d.need}` : 'your requirements'}.`,
    ``,
    `We typically respond within one business day. If it's urgent, just reply`,
    `to this email — it reaches us directly.`,
    ``,
    d.message.trim() ? `What you sent us:\n${d.message.trim()}\n` : '',
    `— The G3 Team`,
    `Global Green Grid · Data Centres Reimagined`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject,
    html: shell({ preview: `We've received your message — the G3 team will be in touch.`, eyebrow: 'Message received', content }),
    text,
  };
}
