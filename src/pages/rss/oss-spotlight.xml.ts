import type { APIRoute } from 'astro';
import { blogFeed } from '../../utils/blogFeed';

export const prerender = false;

export const GET: APIRoute = (context) => {
  const db = (context.locals as any).runtime?.env?.DB as D1Database | undefined;
  return blogFeed({
    title: 'OpenSourceScribes — My MCP Shelf',
    description: 'Open-source tool evaluations: MCP servers, frameworks, and developer tools worth your shelf space.',
    track: 'oss-spotlight',
    db,
  });
};
