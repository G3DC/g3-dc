// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Static by default: the hero page and all its heavy media are prerendered
  // and served as flat files. Only routes that opt out with
  // `export const prerender = false` (the /api/contact endpoint) run as
  // on-demand serverless functions on Vercel.
  output: 'static',
  adapter: vercel(),
});
