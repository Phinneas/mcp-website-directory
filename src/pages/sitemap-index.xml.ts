/**
 * GET /sitemap-index.xml — Merged sitemap index.
 *
 * References both the Astro-generated static sitemap (sitemap-0.xml) and
 * the dynamic server sitemap (sitemap-servers.xml). Overrides the static
 * file the sitemap plugin generates so all routes are discoverable.
 *
 * The static sitemap-0.xml must still be present in dist/ (the sitemap
 * plugin generates it). The server sitemap is generated at request time.
 */
import type { APIRoute } from 'astro';

export const prerender = false;

const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
};

export const GET: APIRoute = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://www.mymcpshelf.com/sitemap-0.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://www.mymcpshelf.com/sitemap-servers.xml</loc>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, { headers: XML_HEADERS });
};