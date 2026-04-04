import { getCollection } from 'astro:content';
import { siteMeta } from '../utils/site-meta.mjs';

export const prerender = true;

const SITE_PAGE_IDS = new Set([
	'index',
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

function toPublicUrl(id: string) {
	if (id === 'index') return `${siteMeta.siteUrl}/`;
	const normalized = id.endsWith('/index') ? id.slice(0, -'/index'.length) : id;
	return `${siteMeta.siteUrl}/${normalized}/`;
}

export async function GET() {
	const docs = await getCollection('docs');
	const entries = docs
		.filter((entry) => !SITE_PAGE_IDS.has(entry.id) && !entry.id.endsWith('/index'))
		.sort((left, right) => left.id.localeCompare(right.id));

	const items = entries
		.map((entry) => {
			const title = escapeXml(entry.data.title);
			const description = escapeXml(entry.data.description ?? siteMeta.description);
			const url = toPublicUrl(entry.id);
			return `<item><title>${title}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><description>${description}</description></item>`;
		})
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXml(siteMeta.name)}</title><link>${siteMeta.siteUrl}/</link><description>${escapeXml(siteMeta.description)}</description><language>en-us</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate><atom:link href="${siteMeta.siteUrl}/rss.xml" rel="self" type="application/rss+xml" />${items}</channel></rss>`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
	});
}
