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
	/** Protocol anatomy wiring (Phase 1): the protocol record this page renders. */
	protocolSlug: z.string().optional(),
	/** Comparison anatomy wiring (Phase 1): protocol record slugs compared on this page. */
	comparisonOf: z.array(z.string()).optional(),
	/** FAQ block (GEO List A construction spec §4): questions verbatim from List C. */
	faq: z
		.array(z.object({ question: z.string(), answer: z.string() }))
		.optional(),
});

/**
 * Protocol records (blueprint §4.4) — the data layer's first citizens.
 * One YAML file per protocol in src/data/protocols/. Every numeric
 * value lives in `keyParameters` / `gatewayCapacity` / `payloadLimits`
 * and carries its primary source with it; a value that cannot be
 * traced to a standards-body publication or a manufacturer datasheet
 * is omitted from the record entirely (never approximated). Pages,
 * the protocol matrix, the spectrum rail and the link strips are all
 * views of these records — there is no second copy of any number.
 */
const sourcedValue = z.object({
	key: z.string(),
	label: z.string(),
	value: z.string(),
	/** Primary source this value was transcribed from (document + section/table). */
	source: z.string(),
});

const protocolSchema = z.object({
	slug: z.string(),
	name: z.string(),
	fullName: z.string(),
	standardsBody: z.string(),
	standardDesignation: z.string(),
	/** One-line coverage note for the nameplate (this site's coverage level). */
	coverage: z.string(),
	bands: z.array(
		z.object({
			label: z.string(),
			detail: z.string(),
			/** Representative frequency for spectrum-rail log positioning. */
			railFreqMhz: z.number(),
		}),
	),
	topology: z.string(),
	/** Latency / update-rate class, in the standard body's or maker's own wording. */
	latencyClass: z.string(),
	powerProfile: z.string(),
	/** One-sentence fit statement for the matrix "best for" column. */
	bestFor: z.string(),
	keyParameters: z.array(sourcedValue),
	/** WirelessHART only (asset A2): per-model gateway capacity, one sourced row per model. */
	gatewayCapacity: z
		.array(
			z.object({
				vendor: z.string(),
				model: z.string(),
				maxDevices: z.string(),
				condition: z.string(),
				source: z.string(),
			}),
		)
		.optional(),
	/** LoRaWAN only (asset A5): regional-parameter payload limits, straight from RP002. */
	payloadLimits: z
		.array(
			z.object({
				region: z.string(),
				dataRate: z.string(),
				maxMacPayload: z.string(),
				maxAppPayload: z.string().optional(),
				note: z.string().optional(),
				source: z.string(),
			}),
		)
		.optional(),
	linkStrip: z.object({
		nodeA: z.string(),
		nodeB: z.string(),
		linkLabel: z.string(),
		readings: z.array(z.object({ label: z.string(), value: z.string() })),
	}),
	sources: z.array(
		z.object({
			label: z.string(),
			url: z.string().url(),
			dateChecked: z.coerce.date(),
		}),
	),
});

export const collections = {
	pages: defineCollection({
		loader: glob({ base: './src/content/pages', pattern: '**/*.{md,mdx}' }),
		schema: pageSchema,
	}),
	protocols: defineCollection({
		loader: glob({ base: './src/data/protocols', pattern: '**/*.yaml' }),
		schema: protocolSchema,
	}),
};
