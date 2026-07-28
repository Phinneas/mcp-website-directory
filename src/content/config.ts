import { defineCollection, z } from 'astro:content';

export const BLOG_TRACKS = ['oss-spotlight', 'signal-field', 'ai-field-notes'] as const;

const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date().or(z.string()).optional().default(new Date('2024-01-01')),
    author: z.string().optional().default('Chester Beard'),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    track: z.enum(BLOG_TRACKS).optional(),
    category: z.string().optional(),
    draft: z.boolean().optional().default(false),
    featured: z.boolean().optional().default(false),
  }),
});

export const collections = {
  'blog': blogCollection,
};
