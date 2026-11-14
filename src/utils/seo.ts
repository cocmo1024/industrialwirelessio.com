/**
 * seo.ts — structured-data and head-metadata generators.
 *
 * Ported from the legacy `src/utils/seo.mjs` during the Phase 0 rebuild
 * (blueprint v2 §6.2), with the GEO List B entity fixes applied at this
 * single source:
 *   B-01  Organization/WebSite description = brand positioning (brand.ts)
 *   B-02  knowsAbout = connectivity vocabulary (brand.ts)
 *   B-03  unproven X profile is NOT carried over — `sameAs` reads only
 *         `brand.verifiedProfiles`; when empty, `sameAs` is omitted
 *   B-04  the GitHub code repository is NOT a sameAs entry
 *   B-05  Organization carries `slogan`; slogan === tagline (brand.ts)
 *   B-14  no foundingDate / address / telephone is ever emitted
 *
 * The Organization @id is unchanged from the legacy stack
 * (https://industrialwirelessio.com/#organization) so entity continuity
 * survives the rebuild.
 */
import { brand, LOCALE_TAGS, type Locale } from '../data/brand';
import { toAbsoluteUrl } from './routes';

export type PageKind =
	| 'home'
	| 'section'
	| 'content'
	| 'foundation'
	| 'policy'
	| 'tool'
	| 'product'
	| 'not-found';

export interface PageDescriptor {
	/** Route id without locale prefix, e.g. `protocols/wirelesshart`; '' or 'index' for home. */
	id: string;
	locale: Locale;
	title: string;
	description?: string;
	kind: PageKind;
	datePublished?: Date | string;
	dateModified?: Date | string;
	authorKey?: string;
	editorKey?: string;
	/** Breadcrumb trail (name + path); defaults are derived from the id when omitted. */
	breadcrumbs?: { name: string; path: string }[];
}

const NOINDEX_KINDS: ReadonlySet<PageKind> = new Set(['policy', 'not-found']);

const PAGE_TYPE_BY_ID: Record<string, string> = {
	about: 'AboutPage',
	contact: 'ContactPage',
	'editorial-desk': 'ProfilePage',
	'review-desk': 'ProfilePage',
};

function toIsoDate(value: Date | string | undefined): string | undefined {
	if (!value) return undefined;
	const parsed = value instanceof Date ? value : new Date(value);
	return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function titleizeSegment(segment: string): string {
	return segment
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

export function buildOrganizationNode() {
	const logoUrl = toAbsoluteUrl(brand.icon512Path ?? brand.faviconPath);
	const sameAs = [...brand.verifiedProfiles];
	const publishingPrinciples = toAbsoluteUrl(brand.publishingPrinciplesPath);

	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		'@id': `${brand.siteUrl}/#organization`,
		name: brand.name,
		alternateName: [brand.shortName, brand.domain],
		url: `${brand.siteUrl}/`,
		description: brand.description,
		slogan: brand.slogan,
		email: brand.email,
		...(sameAs.length ? { sameAs } : {}),
		publishingPrinciples,
		knowsAbout: [...brand.knowsAbout],
		logo: {
			'@type': 'ImageObject',
			'@id': `${brand.siteUrl}/#logo`,
			url: logoUrl,
			contentUrl: logoUrl,
			width: 512,
			height: 512,
		},
		contactPoint: [
			{
				'@type': 'ContactPoint',
				contactType: 'editorial and business inquiries',
				email: brand.email,
				availableLanguage: ['en'],
			},
		],
	};
}

export function buildWebsiteNode(locale: Locale = 'en') {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'@id': `${brand.siteUrl}/#website`,
		url: `${brand.siteUrl}/`,
		name: brand.name,
		alternateName: [brand.domain],
		description: brand.description,
		inLanguage: LOCALE_TAGS[locale].languageTag,
		publisher: { '@id': `${brand.siteUrl}/#organization` },
		publishingPrinciples: toAbsoluteUrl(brand.publishingPrinciplesPath),
	};
}

export function buildEditorialEntityNode(key: string) {
	const entity = brand.editorialEntities[key];
	if (!entity) return undefined;
	const url = toAbsoluteUrl(entity.path);
	const sameAs = [...brand.verifiedProfiles];

	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		'@id': `${url}#profile`,
		name: entity.name,
		description: entity.description,
		url,
		memberOf: { '@id': `${brand.siteUrl}/#organization` },
		knowsAbout: entity.expertise,
		...(sameAs.length ? { sameAs } : {}),
	};
}

function defaultBreadcrumbs(page: PageDescriptor): { name: string; item: string }[] {
	const homePath = page.locale === 'en' ? '/' : `/${page.locale}/`;
	const crumbs = [{ name: 'Home', item: toAbsoluteUrl(homePath) }];
	const segments = page.id.split('/').filter(Boolean);
	if (page.id === '' || page.id === 'index' || page.kind === 'not-found') return crumbs;

	const walked: string[] = [];
	segments.forEach((segment, index) => {
		walked.push(segment);
		const isLast = index === segments.length - 1;
		const path =
			page.locale === 'en' ? `/${walked.join('/')}/` : `/${page.locale}/${walked.join('/')}/`;
		crumbs.push({
			name: isLast ? page.title : (brand.sectionLabels[segment] ?? titleizeSegment(segment)),
			item: toAbsoluteUrl(path),
		});
	});
	return crumbs;
}

export interface SeoResult {
	title: string;
	description: string;
	canonicalUrl: string;
	robots: string;
	ogType: 'website' | 'article';
	ogLocale: string;
	languageTag: string;
	imageUrl: string;
	imageAlt: string;
	publishedTime?: string;
	modifiedTime?: string;
	structuredData: Record<string, unknown>[];
}

export function buildSeo(page: PageDescriptor, canonicalPath: string): SeoResult {
	const locale = page.locale;
	const canonicalUrl = toAbsoluteUrl(canonicalPath);
	const title = page.title;
	const description = page.description ?? brand.description;
	const languageTag = LOCALE_TAGS[locale].languageTag;
	const publishedTime = toIsoDate(page.datePublished);
	const modifiedTime = toIsoDate(page.dateModified);

	const crumbs =
		page.breadcrumbs?.map((crumb) => ({
			name: crumb.name,
			item: toAbsoluteUrl(crumb.path),
		})) ?? defaultBreadcrumbs(page);

	const breadcrumbNode =
		crumbs.length > 1
			? {
					'@context': 'https://schema.org',
					'@type': 'BreadcrumbList',
					'@id': `${canonicalUrl}#breadcrumb`,
					itemListElement: crumbs.map((crumb, index) => ({
						'@type': 'ListItem',
						position: index + 1,
						name: crumb.name,
						item: crumb.item,
					})),
				}
			: undefined;

	const authorEntity = page.authorKey ? buildEditorialEntityNode(page.authorKey) : undefined;
	const editorEntity = page.editorKey ? buildEditorialEntityNode(page.editorKey) : undefined;
	const profileEntity =
		page.id === 'editorial-desk' || page.id === 'review-desk'
			? buildEditorialEntityNode(page.id)
			: undefined;

	const pageType =
		page.kind === 'home' || page.kind === 'section'
			? 'CollectionPage'
			: (PAGE_TYPE_BY_ID[page.id] ?? 'WebPage');

	const webpageNode =
		page.kind === 'not-found'
			? undefined
			: {
					'@context': 'https://schema.org',
					'@type': pageType,
					'@id': `${canonicalUrl}#webpage`,
					name: title,
					description,
					url: canonicalUrl,
					inLanguage: languageTag,
					isPartOf: { '@id': `${brand.siteUrl}/#website` },
					...(crumbs.length > 1 ? { breadcrumb: { '@id': `${canonicalUrl}#breadcrumb` } } : {}),
					...(authorEntity ? { author: { '@id': authorEntity['@id'] } } : {}),
					...(editorEntity ? { editor: { '@id': editorEntity['@id'] } } : {}),
					...(profileEntity ? { mainEntity: { '@id': profileEntity['@id'] } } : {}),
					...(modifiedTime ? { dateModified: modifiedTime } : {}),
				};

	const articleNode =
		page.kind === 'content'
			? {
					'@context': 'https://schema.org',
					'@type': 'TechArticle',
					'@id': `${canonicalUrl}#article`,
					headline: title,
					description,
					url: canonicalUrl,
					inLanguage: languageTag,
					mainEntityOfPage: { '@id': `${canonicalUrl}#webpage` },
					author: authorEntity
						? { '@id': authorEntity['@id'] }
						: { '@id': `${brand.siteUrl}/#organization` },
					...(editorEntity ? { editor: { '@id': editorEntity['@id'] } } : {}),
					publisher: { '@id': `${brand.siteUrl}/#organization` },
					isPartOf: { '@id': `${brand.siteUrl}/#website` },
					isAccessibleForFree: true,
					...(publishedTime ? { datePublished: publishedTime } : {}),
					...(modifiedTime ? { dateModified: modifiedTime } : {}),
				}
			: undefined;

	const entityNodes = [authorEntity, editorEntity, profileEntity].filter(
		(node): node is NonNullable<typeof node> => Boolean(node),
	);

	return {
		title,
		description,
		canonicalUrl,
		robots: NOINDEX_KINDS.has(page.kind)
			? 'noindex, nofollow, noarchive, max-snippet:0, max-image-preview:none, max-video-preview:0'
			: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
		ogType: page.kind === 'content' ? 'article' : 'website',
		ogLocale: LOCALE_TAGS[locale].ogLocale,
		languageTag,
		imageUrl: toAbsoluteUrl(brand.ogImagePath),
		imageAlt: brand.ogImageAlt,
		publishedTime,
		modifiedTime,
		structuredData: [
			buildOrganizationNode(),
			buildWebsiteNode(locale),
			breadcrumbNode,
			...entityNodes,
			webpageNode,
			articleNode,
		].filter((node): node is NonNullable<typeof node> => Boolean(node)),
	};
}
