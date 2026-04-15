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
  adapter: cloudflare(),
  trailingSlash: 'never',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [react(), mdx(), sitemap({
    filter: (page) => !page.includes('/server/'),
  })],

  vite: {
    plugins: [tailwindcss()]
  }
});