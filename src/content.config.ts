import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		category: z.string(),
		tags: z.array(z.string()).default([]),
		primaryAudience: z.string().optional(),
		buyerStage: z.string().optional(),
		valueFocus: z.string().optional(),
		reviewCycle: z.string().optional(),
		featured: z.boolean().default(false),
		draft: z.boolean().default(false),
	}),
});

export const collections = { blog };
