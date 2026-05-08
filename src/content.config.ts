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
				contentCluster: z.string().optional(),
				canonicalCluster: z.string().optional(),
				pageType: z
					.enum([
						'home',
						'foundation',
						'policy',
						'hub',
						'reference',
						'application-guide',
						'vendor-profile',
						'product-family',
						'protocol-guide',
						'comparison',
						'decision-guide',
						'implementation-guide',
						'security-checklist',
						'cost-model',
						'playbook',
						'rfp-checklist',
						'market-signal',
						'question-answer',
						'prompt-library',
						'tool-guide',
						'tool-comparison',
						'evaluation',
						'workflow',
						'syntax-reference',
						'editor-comparison',
						'publishing-guide',
						'case-study',
						'robot-type',
						'vision-guide',
						'cell-design',
						'deployment-guide',
						'hardware-guide',
						'reliability-guide',
						'network-path',
					])
					.optional(),
				lifecycle: z
					.enum(['evergreen', 'market-signal', 'seasonal', 'policy', 'hub'])
					.optional(),
				refreshPriority: z.enum(['low', 'medium', 'high']).optional(),
				authorKey: z.string().optional(),
				editorKey: z.string().optional(),
				datePublished: z.coerce.date().optional(),
				lastReviewed: z.coerce.date().optional(),
				problemSolved: z.string().optional(),
				readerTakeaway: z.string().optional(),
				keyQuestions: z.array(z.string()).optional(),
				notFor: z.array(z.string()).optional(),
				updateTriggers: z.array(z.string()).optional(),
			}),
		}),
	}),
};
