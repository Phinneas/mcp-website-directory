/**
 * GET /sitemap-servers.xml — Dynamic sitemap for indexable server pages.
 *
 * Lists only servers that pass the quality gate (Tier A: stars >= 20,
 * description >= 300 chars). Uses the same shared predicate as
 * the server detail page's robots meta.
 *
 * Included from the sitemap index at /sitemap-index.xml.
 */
import type { APIRoute } from 'astro';
import { getIndexableServers } from '../../utils/indexing.js';
import serversData from '../../data/servers.json';

export const prerender = false;

const SITEMAP_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = () => {
  const allServers: any[] =
    Array.isArray(serversData?.servers) && serversData.servers.length > 0
      ? serversData.servers
      : [];

  const indexable = getIndexableServers(allServers);

  const urls = indexable.map((s) => {
    const loc = `https://www.mymcpshelf.com/server/${escapeXml(s.slug)}`;
    return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, { headers: SITEMAP_HEADERS });
};