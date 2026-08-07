import type { APIRoute } from 'astro';
import { blogFeed } from '../../utils/blogFeed';

export const prerender = false;

export const GET: APIRoute = (context) => {
  const db = (context.locals as any).runtime?.env?.DB as D1Database | undefined;
  return blogFeed({
    title: 'Brainscriblr — My MCP Shelf',
    description: 'Commentary and field notes on the AI ecosystem — models, agents, and tooling shifts.',
    track: 'ai-field-notes',
    db,
  });
};
