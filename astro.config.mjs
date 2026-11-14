// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { brand, LOCALES, DEFAULT_LOCALE } from './src/data/brand.ts';

// Pages that must never appear in any sitemap shard (trust/policy pages,
// kept noindex site-wide — same set as the previous stack).
const noindexSitemapPaths = new Set([
	'/advertising/',
	'/affiliate-disclosure/',
	'/disclaimer/',
	'/privacy/',
	'/terms-of-use/',
]);

/** @param {string} page */
function shouldIncludeInSitemap(page) {
	return !noindexSitemapPaths.has(new URL(page, brand.siteUrl).pathname);
}

// Rebuild stack (blueprint v2, 2026-11-14): Astro custom — no Starlight,
// no Tailwind. Routes are generated from content/data manifests only
// (see src/utils/routes.ts): a (page, locale) pair with no translation
// on disk produces no route, no sitemap entry and no hreflang tag.
export default defineConfig({
	site: brand.siteUrl,
	trailingSlash: 'always',
	i18n: {
		defaultLocale: DEFAULT_LOCALE,
		locales: [...LOCALES],
		routing: {
			prefixDefaultLocale: false,
			redirectToDefaultLocale: false,
		},
	},
	vite: {
		resolve: {
			alias: {
				// TEMPORARY (Phase 0–3): legacy MDX bodies import Starlight
				// components; resolve them to inert stubs so the content
				// loader compiles. Bodies are not rendered until the
				// Phase 4 migration replaces those imports natively.
				// See src/compat/starlight-components.ts.
				'@astrojs/starlight/components': new URL(
					'./src/compat/starlight-components.ts',
					import.meta.url,
				).pathname,
			},
		},
	},
	integrations: [
		mdx(),
		sitemap({
			filter: shouldIncludeInSitemap,
			i18n: {
				defaultLocale: DEFAULT_LOCALE,
				locales: Object.fromEntries(LOCALES.map((locale) => [locale, locale])),
			},
		}),
	],
});
