# G3 — Marketing Site

The G3 marketing site, built with [Astro](https://astro.build) and managed with [Bun](https://bun.sh).
Originally a single hand-authored `index.html`; now an Astro project so we can add server
routes (e.g. the contact-form API) without giving up the hand-tuned hero CSS/JS.

## Structure
```
src/
  pages/
    index.astro        the whole page — head, body, and the two inline <script> blocks
    api/
      contact.ts       POST endpoint: logs to Postgres + emails team & submitter
  lib/
    env.ts             server-side env resolution (process.env → import.meta.env)
    db.ts              Postgres access (porsager 'postgres'); creates table on demand
    email.ts           Nodemailer SMTP transport (Google Workspace defaults)
    emails.ts          branded HTML+text email templates, styled like the site
  styles/
    global.css         all site CSS (was the inline <style> block)
db/
  schema.sql           contact_submissions table (auto-created too)
scripts/
  preview-emails.ts    dev helper: render the emails to /tmp (bun run email:preview)
public/
  media/               static assets, copied verbatim, served from /media/*
    g3-day-2160.mp4    hero day video — 4K     (H.264, 2.9 MB)
    g3-day-1080.mp4    hero day video — 1080p  (1.2 MB)
    g3-day-720.mp4     hero day video — 720p   (420 KB)
    g3-night-*.mp4     hero night video — 4K / 1080p / 720p
    poster-day.jpg     first-frame poster (shown instantly before video)
    poster-night.jpg
    cloud-*.webp       drifting sky sprites
    host-1..6.jpg      "what you can host" rail
    ggg-logo.png       footer lockup
astro.config.mjs       Astro config (static hero + @astrojs/vercel for the API)
.env.example           copy to .env and fill in (Postgres + SMTP + addressing)
vercel.json            1-year immutable caching on /media + clean URLs
```

The page markup and behaviour are unchanged from the original single-file site — the inline
hero choreography and button/modal scripts are kept verbatim via `<script is:inline>`, and the
CSS moved out to `src/styles/global.css`. Asset URLs are now absolute (`/media/...`).

## Develop
```
bun install            # install deps
bun run dev            # dev server with HMR  → http://localhost:4321
bun run build          # production build      → dist/
bun run preview        # serve the built dist/ locally
```

## Contact API
The hero contact modal POSTs to **`/api/contact`** (`src/pages/api/contact.ts`), an
on-demand serverless route — the rest of the site stays static. On each submission it:

1. **validates** the payload (name + valid email required; fields length-capped; a hidden
   honeypot silently absorbs bots),
2. **logs** the lead to Postgres (`contact_submissions`) *first*, so a lead is never lost
   even if mail fails,
3. **emails** the G3 team a styled notification (with `Reply-To` set to the submitter) **and**
   sends the submitter a branded auto-reply,
4. records the email outcome (`sent` / `failed`) back on the row.

If both the DB and email fail, the API returns `502` and the front-end falls back to a
prefilled `mailto:` — so the lead still has a path through.

The emails are designed in the site's night-hero language (deep green-black ground, teal
accents, Cormorant/Georgia serif, mono eyebrows). Preview them locally:
```
bun run email:preview     # writes /tmp/email-notification.html + /tmp/email-autoreply.html
```

### Configuration
Copy `.env.example` → `.env` and fill in (or set these as Vercel env vars):

| Variable | What it is |
|----------|------------|
| `DATABASE_URL` | Postgres connection string. Any provider (Neon, Supabase, Vercel Postgres, RDS…). Add `?sslmode=require` for hosted DBs. |
| `DATABASE_SSL` | `require` / `disable` (optional; auto: off for localhost, on otherwise) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | Google Workspace SMTP relay — defaults `smtp-relay.gmail.com` / `587` / `false` (STARTTLS). Fixed for everyone; usually no need to override. |
| `SMTP_USER` / `SMTP_PASS` | Relay account (default `g3@g3dc.com`) + an **App Password** (Account → Security → App passwords; needs 2-Step Verification). In practice **`SMTP_PASS` is the only one you must set.** |
| `CONTACT_FROM` | From header, e.g. `G3 — Global Green Grid <hello@globalgreengrid.in>` |
| `CONTACT_TO` | Where team notifications land |
| `CONTACT_BCC` | Optional BCC on the team notification |
| `COMPANY_NAME` / `SITE_URL` | Shown in the email footer |

The `contact_submissions` table is created automatically on first request; `db/schema.sql`
is provided if you'd rather migrate manually (`psql "$DATABASE_URL" -f db/schema.sql`).

## Adaptive video quality
The hero serves **three resolutions** and picks one **at load, from device capability** — not
viewport width. The selector (in `index.astro`) reads:

- `navigator.hardwareConcurrency` (CPU cores), `navigator.deviceMemory` (RAM, Chromium)
- physical panel size (`screen` × `devicePixelRatio`)
- `navigator.connection` Data Saver / `effectiveType` (2g/3g)
- `pointer:coarse` + small CSS viewport → phone/tablet

| Tier  | Goes to |
|-------|---------|
| **2160p (4K)** | strong CPU (≥8 threads) **and** a panel ≥1440p physical **and** RAM not known-low |
| **1080p** | mainstream default; also the cap for phones/tablets |
| **720p**  | Data Saver on, 2g/2-core/≤2 GB RAM, or very small displays |

**Force a tier for testing:** add `?q=2160`, `?q=1080`, or `?q=720` to the URL. The chosen tier
is logged to the console (`[G3] hero quality: …`) and set on `<html data-hero-q>`. `?fps=1` adds
a live frame counter.

## Autoplay behaviour
- **Day clip autoplays on open** (muted, looped). The hero opens in **night mode** between 19:00
  and 06:00 local time (a manual rack tap wins for the session).
- Scroll past the hero → both videos **pause**; scroll back → the active clip **resumes**.
- The day/night rack toggle (top-right of the hero) crossfades to the night clip and starts it.

## Deploy
- **Vercel** — auto-detected as Astro and built with the `@astrojs/vercel` adapter: the hero
  page ships as static files and `/api/contact` as a serverless function. Set the environment
  variables above in the project settings before going live. `vercel.json` keeps clean URLs and
  the 1-year immutable cache on `/media`.
- The static hero + media can be served from any host, but the contact form needs the serverless
  function (or any backend exposing `POST /api/contact`); without it the form falls back to `mailto:`.
