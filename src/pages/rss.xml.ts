import type { APIRoute } from 'astro';
import { blogFeed } from '../utils/blogFeed';

// SSR: external_posts (Signal Field etc.) are written to D1 at request time,
// so this feed needs the runtime DB binding, not a build-time snapshot.
export const prerender = false;

export const GET: APIRoute = (context) => {
  const db = (context.locals as any).runtime?.env?.DB as D1Database | undefined;
  return blogFeed({
    title: 'My MCP Shelf Blog',
    description: 'Insights, updates, and guides for the MCP ecosystem',
    db,
  });
};
