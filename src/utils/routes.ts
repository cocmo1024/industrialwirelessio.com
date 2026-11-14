/**
 * routes.ts — the route manifest: single generator of "which
 * (page, locale) pairs exist" for the whole site.
 *
 * Blueprint v2 §5.1: routing is translation-manifest driven. Long-form
 * content lives on disk per locale (`src/content/pages/<locale>/…`);
 * data records carry per-locale overlay files. A pair that has no
 * translation on disk produces NO route, NO sitemap entry and NO
 * hreflang tag — an untranslated page is a 404, never an English copy
 * served under a locale prefix (the Starlight fallback defect this
 * architecture exists to eliminate).
 *
 * Sitemaps (astro.config) and hreflang clusters (BaseLayout/seo.ts)
 * are generated from the same manifest, so the three can never drift.
 */
import { brand, LOCALES, LOCALE_TAGS, type Locale } from '../data/brand';

export interface RouteEntry {
	locale: Locale;
	/** Path below the locale root, '' for the locale homepage. No slashes at either end. */
	slug: string;
	/** Absolute path on the site, trailing slash included. */
	path: string;
	/** Fully qualified URL. */
	url: string;
}

/** Content-collection entry ids look like `en/protocols/wirelesshart`. */
export function parseEntryId(id: string): { locale: Locale; slug: string } | null {
	const segments = id.split('/').filter(Boolean);
	const [maybeLocale, ...rest] = segments;
	if (!maybeLocale || !(LOCALES as readonly string[]).includes(maybeLocale)) return null;
	if (rest.at(-1) === 'index') rest.pop();
	return { locale: maybeLocale as Locale, slug: rest.join('/') };
}

export function pagePath(locale: Locale, slug: string): string {
	const clean = slug.replace(/^\/+|\/+$/g, '');
	if (locale === 'en') return clean ? `/${clean}/` : '/';
	return clean ? `/${locale}/${clean}/` : `/${locale}/`;
}

export function toAbsoluteUrl(pathname: string): string {
	return new URL(pathname, `${brand.siteUrl}/`).toString();
}

interface ManifestSource {
	id: string;
}

/** Build the manifest from content-collection entries (any collection). */
export function buildRouteManifest(entries: ManifestSource[]): RouteEntry[] {
	const manifest: RouteEntry[] = [];
	for (const entry of entries) {
		const parsed = parseEntryId(entry.id);
		if (!parsed) continue;
		const path = pagePath(parsed.locale, parsed.slug);
		manifest.push({ ...parsed, path, url: toAbsoluteUrl(path) });
	}
	return manifest.sort((a, b) => a.path.localeCompare(b.path));
}

export interface HreflangLink {
	hreflang: string;
	href: string;
}

/**
 * hreflang cluster for one page slug: one link per locale that ACTUALLY
 * has the page, plus x-default → the English version when it exists.
 */
export function hreflangLinksFor(manifest: RouteEntry[], slug: string): HreflangLink[] {
	const versions = manifest.filter((route) => route.slug === slug);
	const links = versions.map((route) => ({
		hreflang: LOCALE_TAGS[route.locale].languageTag,
		href: route.url,
	}));
	const english = versions.find((route) => route.locale === 'en');
	if (english) links.push({ hreflang: 'x-default', href: english.url });
	return links;
}
