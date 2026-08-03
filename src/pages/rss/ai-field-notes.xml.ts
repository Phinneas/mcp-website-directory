import type { APIRoute } from 'astro';
import { blogFeed } from '../../utils/blogFeed';

export const prerender = true;

export const GET: APIRoute = () =>
  blogFeed({
    title: 'AI Horizons Dispatch — My MCP Shelf',
    description: 'Commentary and field notes on the AI ecosystem — models, agents, and tooling shifts.',
    track: 'ai-field-notes',
  });
