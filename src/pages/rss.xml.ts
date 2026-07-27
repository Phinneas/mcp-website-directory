import type { APIRoute } from 'astro';
import { blogFeed } from '../utils/blogFeed';

export const prerender = true;

export const GET: APIRoute = () =>
  blogFeed({
    title: 'My MCP Shelf Blog',
    description: 'Insights, updates, and guides for the MCP ecosystem',
  });
