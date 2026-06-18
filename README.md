# G3 — Marketing Site (hostable package)

Single-file site (`index.html`) + a `media/` folder of assets. No build step, no dependencies.

## Contents
```
index.html              the site (~205 KB — all heavy assets externalized)
media/
  g3-day-2160.mp4        hero day video — 4K     (H.264, 2.9 MB)
  g3-day-1080.mp4        hero day video — 1080p  (1.2 MB)
  g3-day-720.mp4         hero day video — 720p   (420 KB)
  g3-night-2160.mp4      hero night video — 4K   (2.8 MB)
  g3-night-1080.mp4      hero night video — 1080p
  g3-night-720.mp4       hero night video — 720p
  poster-day.jpg         first-frame poster (shown instantly before video)
  poster-night.jpg
  cloud-*.webp           drifting sky sprites
  host-1..6.jpg          "what you can host" rail
  ggg-logo.png           footer lockup
vercel.json              1-year immutable caching on /media
```

## Adaptive video quality
The hero serves **three resolutions** and picks one **at load, from device capability** — not
viewport width (a 4K monitor on a weak GPU shouldn't get 4K; a small window on a strong machine
shouldn't be starved). The selector reads:

- `navigator.hardwareConcurrency` (CPU cores), `navigator.deviceMemory` (RAM, Chromium)
- physical panel size (`screen` × `devicePixelRatio`)
- `navigator.connection` Data Saver / `effectiveType` (2g/3g)
- `pointer:coarse` + small CSS viewport → phone/tablet

Ladder:
| Tier  | Goes to |
|-------|---------|
| **2160p (4K)** | strong CPU (≥8 threads) **and** a panel ≥1440p physical **and** RAM not known-low |
| **1080p** | mainstream default; also the cap for phones/tablets (4K is invisible at that size, burns data + battery) |
| **720p**  | Data Saver on, 2g/2-core/≤2 GB RAM, or very small displays |

**Force a tier for testing:** add `?q=2160`, `?q=1080`, or `?q=720` to the URL.
The chosen tier is logged to the console (`[G3] hero quality: …`) and set on `<html data-hero-q>`.

## Autoplay behaviour
- **Day clip autoplays on open** (muted, looped — required for autoplay everywhere).
- Scroll past the hero → both videos **pause** (nothing decodes off-screen); scroll back → the active clip **resumes**.
- The day/night rack toggle (top-right of the hero) crossfades to the night clip and starts it.

## Deploy
- **Vercel** — drag this folder onto https://vercel.com/new (or `npm i -g vercel && vercel`). Static, no framework.
- **Netlify** — drag onto https://app.netlify.com/drop.
- **Any static host / S3 / Cloudflare Pages** — upload as-is; all paths are relative.

## Local preview
Open via a tiny server (not `file://`, which blocks some media):
```
npx serve .       # or:  python3 -m http.server 8000
```

## If videos don't show
They must travel **with** the html — keep the `media/` folder next to `index.html`.
The page shows an on-screen hint if it's opened without them.
