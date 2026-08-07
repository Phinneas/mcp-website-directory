import type { APIRoute } from 'astro';
import { blogFeed } from '../../utils/blogFeed';

export const prerender = false;

export const GET: APIRoute = (context) => {
  const db = (context.locals as any).runtime?.env?.DB as D1Database | undefined;
  return blogFeed({
    title: 'Signal Field — My MCP Shelf',
    description: 'Data and infrastructure news: storage, security, and the systems layer under modern AI tooling.',
    track: 'signal-field',
    db,
  });
};
