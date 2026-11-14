import { getCollection } from 'astro:content';
import { brand } from '../data/brand';
import { pagePath, parseEntryId } from '../utils/routes';

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
