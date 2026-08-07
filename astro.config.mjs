import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

import tailwindcss from '@tailwindcss/vite';

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
  })],

  vite: {
    plugins: [tailwindcss()]
  }
});