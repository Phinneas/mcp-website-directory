import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { remarkNapkin } from './src/plugins/remark-napkin.mjs';

import tailwindcss from '@tailwindcss/vite';

/*
 * Generate blog post URLs for the sitemap.
 * Blog posts use SSR via [...slug].astro with prerender = false,
 * so the sitemap integration can't auto-discover them. We read the
 * content collection directory directly to build the URL list.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.join(__dirname, 'src/content/blog');
let blogUrls = [];
try {
  blogUrls = fs.readdirSync(blogDir)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .map((f) => `https://www.mymcpshelf.com/blog/${f.replace(/\.[^.]+$/, '')}`);
} catch {
  // Fall back to empty array if directory doesn't exist yet
}

// https://astro.build/config
export default defineConfig({
  site: 'https://www.mymcpshelf.com',
  output: 'server',
  // configPath pinned: an unrelated wrangler.jsonc at ~ was shadowing this
  // project's wrangler.toml during local config resolution.
  adapter: cloudflare({ platformProxy: { configPath: './wrangler.toml' } }),
  trailingSlash: 'never',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [react(), mdx(), sitemap({
    filter: (page) => !page.includes('/server/'),
    customPages: blogUrls,
  })],
  markdown: {
    remarkPlugins: [remarkNapkin],
  },

  vite: {
    plugins: [tailwindcss()]
  }
});