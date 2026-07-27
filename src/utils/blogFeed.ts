import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { BlogTrack } from '../data/newsletters';

const SITE = 'https://www.mymcpshelf.com';

/** Build an RSS response for the blog, optionally filtered to one track. */
export async function blogFeed(options: { title: string; description: string; track?: BlogTrack }) {
  const posts = (
    await getCollection('blog', ({ data }) => {
      if (data.draft) return false;
      return options.track ? data.track === options.track : true;
    })
  ).sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

  return rss({
    title: options.title,
    description: options.description,
    site: SITE,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: new Date(post.data.date),
      link: `${SITE}/blog/${post.slug}`,
      categories: post.data.tags ?? [],
      author: post.data.author,
    })),
  });
}
