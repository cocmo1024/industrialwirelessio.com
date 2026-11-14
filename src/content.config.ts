import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Content model for the rebuild stack (blueprint v2 §4.1/§5.1).
 *
 * Long-form pages live per locale on disk:
 *   src/content/pages/en/…  src/content/pages/de/…  …
 * Routes, sitemaps and hreflang clusters are generated from the files
 * that actually exist (src/utils/routes.ts) — there is no fallback
 * rendering of English content under a locale prefix.
 *
 * The schema keeps the legacy editorial frontmatter fields (the 74
 * migrated MDX files carry them) and stays permissive (`looseObject`)
 * until the Phase 4 migration normalizes each file into the new page
 * anatomies; per-type schemas for protocols/products live with the
 * data layer from Phase 1 on.
 */
const pageSchema = z.looseObject({
	title: z.string(),
	description: z.string().optional(),
	referenceType: z.string().optional(),
	pageType: z.string().optional(),
	contentStatus: z.enum(['seed', 'growing', 'cornerstone']).optional(),
	primaryKeyword: z.string().optional(),
	searchIntent: z.string().optional(),
	decisionStage: z.string().optional(),
	targetRoles: z.array(z.string()).optional(),
	contentCluster: z.string().optional(),
	canonicalCluster: z.string().optional(),
	lifecycle: z.string().optional(),
	refreshPriority: z.string().optional(),
	authorKey: z.string().optional(),
	editorKey: z.string().optional(),
	datePublished: z.coerce.date().optional(),
	lastReviewed: z.coerce.date().optional(),
	problemSolved: z.string().optional(),
	readerTakeaway: z.string().optional(),
	keyQuestions: z.array(z.string()).optional(),
	notFor: z.array(z.string()).optional(),
	updateTriggers: z.array(z.string()).optional(),
	/** Object-graph wiring (blueprint §4.6), filled in from Phase 1 on. */
	relatedProtocols: z.array(z.string()).optional(),
	relatedProducts: z.array(z.string()).optional(),
	relatedTools: z.array(z.string()).optional(),
});

export const collections = {
	pages: defineCollection({
		loader: glob({ base: './src/content/pages', pattern: '**/*.{md,mdx}' }),
		schema: pageSchema,
	}),
};
