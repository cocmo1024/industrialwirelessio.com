import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				referenceType: z
					.enum([
						'home',
						'foundation',
						'policy',
						'application',
						'vendor',
						'product-family',
						'protocol',
						'network-path',
						'hardware',
						'reliability',
					])
					.optional(),
				adProfile: z
					.enum([
						'foundation',
						'policy',
						'application',
						'vendor',
						'product-family',
						'protocol',
						'network-path',
						'hardware',
						'reliability',
					])
					.optional(),
				commercialIntent: z.enum(['low', 'medium', 'high']).optional(),
				reviewCadence: z.string().optional(),
				primaryKeyword: z.string().optional(),
				searchIntent: z.enum(['learn', 'compare', 'select', 'design', 'deploy']).optional(),
				decisionStage: z
					.enum([
						'problem-aware',
						'solution-aware',
						'vendor-aware',
						'shortlist',
						'implementation',
						'operations',
					])
					.optional(),
				targetRoles: z.array(z.string()).optional(),
				contentStatus: z.enum(['seed', 'growing', 'cornerstone']).optional(),
			}),
		}),
	}),
};
