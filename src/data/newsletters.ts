// Single source of truth for the three editorial tracks and their Beehiiv publications.
// Used by /blog filtering, /newsletters, per-post subscribe CTAs, and the RSS routes.
import type { BLOG_TRACKS } from '../content/config';

export type BlogTrack = (typeof BLOG_TRACKS)[number];

export interface NewsletterInfo {
  track: BlogTrack;
  name: string;
  tagline: string;
  description: string;
  /**
   * Beehiiv embed form URL — the `src` from the iframe Beehiiv generates under
   * Grow → Subscribe Forms → Embed (looks like https://embeds.beehiiv.com/<uuid>).
   * null until the publication exists; components fall back to the RSS link.
   */
  beehiivEmbedUrl: string | null;
  /**
   * Height in px of the Beehiiv iframe. Beehiiv shows this in the snippet it
   * generates — copy it across, because the iframe cannot size itself and a
   * too-small value silently clips the form. Defaults to 220.
   */
  embedHeight?: number;
  feedPath: string;
}

export const NEWSLETTERS: NewsletterInfo[] = [
  {
    track: 'oss-spotlight',
    name: 'OpenSourceScribes',
    tagline: 'Open-source tool evaluations',
    description:
      'Hands-on evaluations of open-source tools, MCP servers, and frameworks — deep dives into what they do, how they hold up, and whether they belong on your shelf.',
    beehiivEmbedUrl: null,
    feedPath: '/rss/oss-spotlight.xml',
  },
  {
    track: 'signal-field',
    name: 'Signal Field',
    tagline: 'Data & infrastructure news',
    description:
      'News and analysis on data infrastructure, storage, security, and the systems layer underneath modern AI tooling.',
    beehiivEmbedUrl: null,
    feedPath: '/rss/signal-field.xml',
  },
  {
    track: 'ai-field-notes',
    name: 'AI Horizons Dispatch',
    tagline: 'Broader AI commentary',
    description:
      'Commentary and field notes on the AI ecosystem — models, agents, tooling shifts, and what they mean in practice.',
    beehiivEmbedUrl: null,
    feedPath: '/rss/ai-field-notes.xml',
  },
];

export function newsletterForTrack(track: string | undefined): NewsletterInfo | undefined {
  return NEWSLETTERS.find((n) => n.track === track);
}
