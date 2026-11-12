import { getCollection } from 'astro:content';
import { siteMeta } from '../utils/site-meta.mjs';

export const prerender = true;

// Site/trust pages are listed in llms.txt but excluded from the full-text
// compilation, matching the editorial scope of llms-full.txt.
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

function toPublicUrl(id: string) {
	if (id === 'index') return `${siteMeta.siteUrl}/`;
	const normalized = id.endsWith('/index') ? id.slice(0, -'/index'.length) : id;
	return `${siteMeta.siteUrl}/${normalized}/`;
}

export async function GET() {
	const docs = await getCollection('docs');
	const entries = docs
		.filter((entry) => !EXCLUDED_PAGE_IDS.has(entry.id))
		.sort((left, right) => left.id.localeCompare(right.id));

	const sections = entries.map((entry) => {
		const body = (entry.body ?? '').trim();
		return `---\n\n## ${entry.data.title}\nURL: ${toPublicUrl(entry.id)}\n\n${body}`;
	});

	const text = [
		`# ${siteMeta.name} — Full Text`,
		'',
		`Source: ${siteMeta.siteUrl}/ — compiled llms-full.txt. Contact: ${siteMeta.email}`,
		'',
		'',
		...sections,
		'',
	].join('\n');

	return new Response(text, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
}
