import type { APIRoute } from 'astro';
import { blogFeed } from '../../utils/blogFeed';

export const prerender = true;

export const GET: APIRoute = () =>
  blogFeed({
    title: 'Signal Field — My MCP Shelf',
    description: 'Data and infrastructure news: storage, security, and the systems layer under modern AI tooling.',
    track: 'signal-field',
  });
