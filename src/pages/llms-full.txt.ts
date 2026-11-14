import { getCollection } from 'astro:content';
import { brand } from '../data/brand';
import { pagePath, parseEntryId } from '../utils/routes';
import {
	ioSummary,
	productGate,
	productPath,
	productSummary,
	PRODUCT_TYPE_LABELS,
	protocolLabel,
} from '../utils/products';

export const prerender = true;

/**
 * llms-full.txt — build-time compiled full text (ported from the
 * legacy endpoint; blueprint §6.4). Output contract unchanged:
 * one `## <title>` + URL + raw body per substantive page. The header
 * now reads the canonical brand-facts block from brand.ts (B-07).
 * Site/trust pages stay excluded, matching the editorial scope.
 */
const EXCLUDED_PAGE_IDS = new Set([
	'about',
	'advertising',
	'affiliate-disclosure',
	'contact',
	'disclaimer',
	'editorial-desk',
	'editorial-policy',
	'privacy',
	'review-desk',
	'terms-of-use',
]);

export async function GET() {
	const entries = await getCollection('pages');
	const sections: string[] = [];

	const sorted = [...entries].sort((a, b) => a.id.localeCompare(b.id));
	for (const entry of sorted) {
		const parsed = parseEntryId(entry.id);
		if (!parsed || parsed.locale !== 'en') continue;
		if (EXCLUDED_PAGE_IDS.has(parsed.slug)) continue;
		const body = (entry.body ?? '').trim();
		sections.push(
			`---\n\n## ${entry.data.title}\nURL: ${brand.siteUrl}${pagePath(parsed.locale, parsed.slug)}\n\n${body}`,
		);
	}

	// Product specification pages are data-defined (Phase 2): their full
	// text is generated from the records, for gate-passing records only —
	// the same set llms.txt lists and the sitemap carries.
	const productEntries = await getCollection('products');
	const indexableProducts = productEntries
		.map((entry) => entry.data)
		.filter((record) => productGate(record).indexable)
		.sort((a, b) => `${a.vendor} ${a.model}`.localeCompare(`${b.vendor} ${b.model}`));
	for (const record of indexableProducts) {
		const lines = [
			productSummary(record),
			'',
			`Type: ${PRODUCT_TYPE_LABELS[record.productType]} · Status: ${record.status}`,
			`Protocol: ${record.protocols.map(protocolLabel).join(', ')}`,
			`Frequency band: ${record.frequencyBands.join(', ')}`,
		];
		if (record.txPowerDbm != null)
			lines.push(`Transmit power: ${record.txPowerDbm} dBm${record.txPowerCondition ? ` (${record.txPowerCondition})` : ''}`);
		if (record.rxSensitivityDbm != null)
			lines.push(`Receiver sensitivity: ${record.rxSensitivityDbm} dBm${record.rxSensitivityCondition ? ` (${record.rxSensitivityCondition})` : ''}`);
		if (record.rangeClass)
			lines.push(`Range class: ${record.rangeClass.value} ${record.rangeClass.unit} — ${record.rangeClass.conditions}`);
		if (record.antenna) lines.push(`Antenna: ${record.antenna}`);
		if (ioSummary(record)) lines.push(`I/O counts: ${ioSummary(record)}`);
		if (record.ioNotes) lines.push(`I/O notes: ${record.ioNotes}`);
		if (record.upstreamInterfaces.length)
			lines.push(`Upstream interfaces: ${record.upstreamInterfaces.join(', ')}`);
		if (record.powerSupply) lines.push(`Power supply: ${record.powerSupply}`);
		if (record.powerConsumption) lines.push(`Power consumption: ${record.powerConsumption}`);
		if (record.batteryLife)
			lines.push(`Battery life: ${record.batteryLife.value} — ${record.batteryLife.conditions}`);
		if (record.ipRating) lines.push(`Ingress rating: ${record.ipRating}`);
		if (record.operatingTemp) lines.push(`Operating temperature: ${record.operatingTemp}`);
		if (record.hazardousArea) lines.push(`Hazardous area: ${record.hazardousArea}`);
		if (record.certifications.length)
			lines.push(`Certifications: ${record.certifications.join(', ')}`);
		lines.push(
			'',
			`Source: ${record.sourceDocId ?? 'Manufacturer documentation'} (${record.sourceType}), ${record.sourceUrl}, checked ${record.dateChecked.toISOString().slice(0, 10)}.`,
		);
		sections.push(
			`---\n\n## ${record.vendor} ${record.model} — specifications\nURL: ${brand.siteUrl}${productPath(record)}\n\n${lines.join('\n')}`,
		);
	}

	const text = [
		`# ${brand.name} — Full Text`,
		'',
		brand.positioning,
		'',
		`Source: ${brand.siteUrl}/ — compiled llms-full.txt. Contact: ${brand.email}`,
		'',
		'',
		...sections,
		'',
	].join('\n');

	return new Response(text, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
}
