import { getCollection } from 'astro:content';
import { brand } from '../data/brand';
import { buildRouteManifest } from '../utils/routes';
import {
	productGate,
	productPath,
	productSummary,
	PRODUCT_TYPE_LABELS,
} from '../utils/products';

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
	const entries = (await getCollection('pages')).filter((entry) => !entry.data.mergedTo);
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

	// Product pages are data-defined routes (Phase 2): only records that
	// pass the §4.3 indexability gate have a page, so only those are
	// listed here — rows-only records are reachable through the index.
	const productEntries = await getCollection('products');
	const indexableProducts = productEntries
		.map((entry) => entry.data)
		.filter((record) => productGate(record).indexable)
		.sort((a, b) => `${a.vendor} ${a.model}`.localeCompare(`${b.vendor} ${b.model}`));
	if (indexableProducts.length) {
		lines.push('## Product Database — specification pages');
		for (const record of indexableProducts) {
			lines.push(
				`- [${record.vendor} ${record.model}](${brand.siteUrl}${productPath(record)}): ${PRODUCT_TYPE_LABELS[record.productType]}. ${productSummary(record)}`,
			);
		}
		lines.push('');
	}

	// Portal sections (R1 layer): code-defined routes, listed here in
	// the R1 top-bar order so AI systems meet the portal's structure,
	// not only its archive.
	lines.push('## Portal Sections');
	lines.push(
		`- [Industry News](${brand.siteUrl}/news/): Industrial wireless news written from the primary source — standards-body releases, manufacturer announcements and organizer publications, each dated and linked to the original.`,
	);
	lines.push(
		`- [Markets & Trends](${brand.siteUrl}/markets/): Market coverage grounded in countable things: the product database census, standards-body market evidence and tender data.`,
	);
	lines.push(
		`- [Forty records in: what the industrial wireless database actually shows](${brand.siteUrl}/markets/database-census-2026/): The first census of the product database — gateways outnumber modules, proprietary 900 MHz ties LoRaWAN; every figure computed from the records.`,
	);
	lines.push(
		`- [Vendors & Ecosystem](${brand.siteUrl}/ecosystem/): The ecosystem hub: newly verified records, release movement and the vendor directory entry.`,
	);
	lines.push(
		`- [Vendor Directory](${brand.siteUrl}/vendors/): Every listed maker, the protocols it builds for, its covered product lines and its recorded products.`,
	);
	lines.push(
		`- [Tech Depth](${brand.siteUrl}/tech-depth/): Protocol deep dives, link-engineering tools and the topic archive, grouped by theme and pinned by editorial weight.`,
	);
	lines.push(
		`- [Events](${brand.siteUrl}/events/): SPS, HANNOVER MESSE, Automate — dates and venues from the organizers, with the wireless angle noted.`,
	);
	lines.push(
		`- [Resources](${brand.siteUrl}/resources/): The primary-source directory: FieldComm Group, ISA100 WCI, LoRa Alliance, IO-Link Community, ISA.`,
	);
	lines.push(
		`- [Data Center](${brand.siteUrl}/data-center/): The data modules: product database, protocol matrix, comparisons and tools, with live counts.`,
	);
	lines.push('');

	// Vendor pages are data-defined routes (Phase 3 portal layer):
	// a vendor earns a page when at least one product record stands
	// behind the listing (R1.3 floor).
	const vendorEntries = await getCollection('vendors');
	const productEntriesForVendors = await getCollection('products');
	const vendorCounts = new Map<string, number>();
	for (const entry of productEntriesForVendors) {
		vendorCounts.set(
			entry.data.vendorSlug,
			(vendorCounts.get(entry.data.vendorSlug) ?? 0) + 1,
		);
	}
	const listedVendors = vendorEntries
		.map((entry) => entry.data)
		.filter((vendor) => (vendorCounts.get(vendor.slug) ?? 0) >= 1)
		.sort((a, b) => a.name.localeCompare(b.name));
	if (listedVendors.length) {
		lines.push('## Vendor Directory — maker pages');
		for (const vendor of listedVendors) {
			lines.push(
				`- [${vendor.name}](${brand.siteUrl}/vendors/${vendor.slug}/): ${vendor.productLines.join(', ')}; ${vendorCounts.get(vendor.slug)} product record${(vendorCounts.get(vendor.slug) ?? 0) === 1 ? '' : 's'} in the database.`,
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
