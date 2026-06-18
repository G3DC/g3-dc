/**
 * Server-side environment resolution.
 *
 * Reads from `process.env` first (how Vercel injects runtime secrets) and falls
 * back to `import.meta.env` (how `astro dev` exposes a local `.env`). Keys are
 * referenced statically so Vite can replace them at build time.
 *
 * Nothing here is `PUBLIC_`-prefixed, so none of it is ever shipped to the client.
 */
function pick(...vals: Array<string | undefined>): string | undefined {
  for (const v of vals) {
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return undefined;
}

export const env = {
  // Postgres
  DATABASE_URL: pick(process.env.DATABASE_URL, import.meta.env.DATABASE_URL),
  DATABASE_SSL: pick(process.env.DATABASE_SSL, import.meta.env.DATABASE_SSL),

  // SMTP — defaults are the Google Workspace SMTP relay (fixed for everyone);
  // only SMTP_PASS (the app password) needs to be supplied per environment.
  SMTP_HOST: pick(process.env.SMTP_HOST, import.meta.env.SMTP_HOST, 'smtp-relay.gmail.com'),
  SMTP_PORT: pick(process.env.SMTP_PORT, import.meta.env.SMTP_PORT, '587'),
  SMTP_SECURE: pick(process.env.SMTP_SECURE, import.meta.env.SMTP_SECURE),
  SMTP_USER: pick(process.env.SMTP_USER, import.meta.env.SMTP_USER, 'g3@g3dc.com'),
  SMTP_PASS: pick(process.env.SMTP_PASS, import.meta.env.SMTP_PASS),

  // Addressing
  CONTACT_FROM: pick(process.env.CONTACT_FROM, import.meta.env.CONTACT_FROM),
  CONTACT_TO: pick(process.env.CONTACT_TO, import.meta.env.CONTACT_TO),
  CONTACT_BCC: pick(process.env.CONTACT_BCC, import.meta.env.CONTACT_BCC),

  // Branding (used in the emails)
  COMPANY_NAME: pick(process.env.COMPANY_NAME, import.meta.env.COMPANY_NAME, 'G3 — Global Green Grid'),
  SITE_URL: pick(process.env.SITE_URL, import.meta.env.SITE_URL, 'https://globalgreengrid.in'),
} as const;
