import { getCollection } from 'astro:content';
import { brand } from '../data/brand';
import { buildRouteManifest } from '../utils/routes';

export const prerender = true;

/**
 * llms.txt — generated at build time from the route manifest
 * (blueprint §6.4: both llms files are build-generated, never
 * hand-maintained). The introduction reads the canonical brand-facts
 * block from brand.ts (GEO List B-07): positioning + contact + cluster.
 */
const SECTION_TITLES: Record<string, string> = {
	'': 'Core',
	applications: 'Applications',
	'product-families': 'Product Families',
	vendors: 'Vendors',
	'network-paths': 'Network Paths',
	protocols: 'Protocols',
	hardware: 'Hardware',
	reliability: 'Reliability',
	tools: 'Tools',
	compare: 'Comparisons',
};

export async function GET() {
	const entries = await getCollection('pages');
	const manifest = buildRouteManifest(entries);
	const byId = new Map(entries.map((entry) => [entry.id, entry]));

	const lines: string[] = [
		`# ${brand.name}`,
		'',
		`> ${brand.positioning}`,
		'',
		brand.cluster,
		'',
		`Contact: ${brand.email}`,
		'',
		`Full text of every reference page on this site, compiled for AI systems: ${brand.siteUrl}/llms-full.txt`,
		'',
	];

	const sections = new Map<string, { title: string; url: string; description?: string }[]>();
	for (const route of manifest) {
		if (route.locale !== 'en') continue;
		const entry =
			byId.get(route.slug === '' ? 'en/index' : `en/${route.slug}`) ??
			byId.get(`en/${route.slug}/index`);
		if (!entry) continue;
		const sectionKey = route.slug.split('/')[0] ?? '';
		const bucket = sections.get(sectionKey) ?? [];
		bucket.push({
			title: entry.data.title,
			url: route.url,
			description: entry.data.description,
		});
		sections.set(sectionKey, bucket);
	}

	for (const [sectionKey, items] of sections) {
		lines.push(`## ${SECTION_TITLES[sectionKey] ?? sectionKey}`);
		for (const item of items) {
			lines.push(
				`- [${item.title}](${item.url})${item.description ? `: ${item.description}` : ''}`,
			);
		}
		lines.push('');
	}

	// Code-defined routes that are not content entries.
	lines.push('## Tools');
	lines.push(
		`- [Link Engineering Tools](${brand.siteUrl}/tools/): Engineering calculators for industrial wireless links, organized by the link problem they solve.`,
	);
	lines.push(
		`- [Link Budget Calculator](${brand.siteUrl}/tools/link-budget-calculator/): Transmit power and gains against path, cable and fade losses, checked against receiver sensitivity.`,
	);
	lines.push(
		`- [Fresnel Zone Calculator](${brand.siteUrl}/tools/fresnel-zone-calculator/): First Fresnel zone radius and clearance ratio for a given path and frequency.`,
	);
	lines.push('');

	return new Response(lines.join('\n'), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
}
