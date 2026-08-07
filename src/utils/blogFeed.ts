import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { BlogTrack } from '../data/newsletters';
import { getExternalPosts } from './externalPosts';

const SITE = 'https://www.mymcpshelf.com';

/**
 * Build an RSS response for the blog, optionally filtered to one track.
 * `db` is optional so feed routes without D1 in scope (or local dev without
 * the binding) still work — they just omit externally-published posts.
 */
export async function blogFeed(options: {
  title: string;
  description: string;
  track?: BlogTrack;
  db?: D1Database;
}) {
  const collectionPosts = await getCollection('blog', ({ data }) => {
    if (data.draft) return false;
    return options.track ? data.track === options.track : true;
  });
  const externalPosts = await getExternalPosts(options.db, options.track);

  const items = [
    ...collectionPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: new Date(post.data.date),
      link: `${SITE}/blog/${post.slug}`,
      categories: post.data.tags ?? [],
      author: post.data.author,
    })),
    ...externalPosts.map((post) => ({
      title: post.title,
      description: post.description,
      pubDate: new Date(post.published_at),
      link: `${SITE}/blog/${post.slug}`,
      categories: [] as string[],
      author: post.author,
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: options.title,
    description: options.description,
    site: SITE,
    items,
  });
}
