import { getCollection } from 'astro:content';
import { brand } from '../data/brand';
import { pagePath, parseEntryId } from '../utils/routes';

export const prerender = true;

/** RSS feed — ported from the legacy endpoint; reads the new content model + brand.ts. */
const SITE_PAGE_IDS = new Set([
	'',
	'about',
	'contact',
	'privacy',
	'terms-of-use',
	'disclaimer',
	'editorial-policy',
	'advertising',
	'affiliate-disclosure',
]);

function escapeXml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

export async function GET() {
	const entries = await getCollection('pages');
	const items = entries
		.map((entry) => ({ entry, parsed: parseEntryId(entry.id) }))
		.filter(
			(item) =>
				item.parsed &&
				item.parsed.locale === 'en' &&
				!SITE_PAGE_IDS.has(item.parsed.slug) &&
				!item.parsed.slug.endsWith('/index') &&
				item.parsed.slug.split('/').length > 1,
		)
		.sort((a, b) => a.entry.id.localeCompare(b.entry.id))
		.map(({ entry, parsed }) => {
			const title = escapeXml(entry.data.title);
			const description = escapeXml(entry.data.description ?? brand.description);
			const url = `${brand.siteUrl}${pagePath(parsed!.locale, parsed!.slug)}`;
			return `<item><title>${title}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><description>${description}</description></item>`;
		})
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXml(brand.name)}</title><link>${brand.siteUrl}/</link><description>${escapeXml(brand.description)}</description><language>en-us</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate><atom:link href="${brand.siteUrl}/rss.xml" rel="self" type="application/rss+xml" />${items}</channel></rss>`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
	});
}
