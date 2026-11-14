import { brand, LOCALE_TAGS } from '../data/brand';

export const prerender = true;

/** Web app manifest — ported from the legacy endpoint; reads brand.ts. */
export function GET() {
	return new Response(
		JSON.stringify({
			name: brand.name,
			short_name: brand.shortName,
			description: brand.description,
			lang: LOCALE_TAGS.en.languageTag,
			start_url: '/',
			scope: '/',
			display: 'browser',
			background_color: brand.backgroundColor,
			theme_color: brand.themeColor,
			icons: [
				{ src: brand.icon192Path, sizes: '192x192', type: 'image/png' },
				{ src: brand.icon512Path, sizes: '512x512', type: 'image/png' },
			],
		}),
		{
			headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
		},
	);
}
