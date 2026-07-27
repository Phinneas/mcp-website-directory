import type { APIRoute } from 'astro';
import { blogFeed } from '../../utils/blogFeed';

export const prerender = true;

export const GET: APIRoute = () =>
  blogFeed({
    title: 'OSS Spotlight — My MCP Shelf',
    description: 'Open-source tool evaluations: MCP servers, frameworks, and developer tools worth your shelf space.',
    track: 'oss-spotlight',
  });
