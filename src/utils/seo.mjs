import { siteMeta } from './site-meta.mjs';

const SITE_PAGE_IDS = new Set([
	'about',
	'contact',
	'privacy',
	'terms-of-use',
	'disclaimer',
	'editorial-policy',
	'advertising',
	'affiliate-disclosure',
]);

const PAGE_TYPE_BY_ID = {
	about: 'AboutPage',
	contact: 'ContactPage',
};

function toAbsoluteUrl(pathname) {
	return new URL(pathname, `${siteMeta.siteUrl}/`).toString();
}

function titleizeSegment(segment) {
	return segment
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function getSegments(routeId) {
	if (!routeId || routeId === 'index' || routeId === '404') return [];

	const segments = routeId.split('/').filter(Boolean);
	if (segments.at(-1) === 'index') {
		segments.pop();
	}

	return segments;
}

function getPageKind(route) {
	if (route.id === '404' || route.entry?.id === '404' || route.id.endsWith('/404')) {
		return 'not-found';
	}
	if (route.id === 'index') return 'home';
	if (SITE_PAGE_IDS.has(route.id)) {
		return route.id === 'about' || route.id === 'contact' ? 'foundation' : 'policy';
	}
	if (route.id.endsWith('/index')) return 'section';
	return 'content';
}

function getString(value) {
	return typeof value === 'string' ? value : undefined;
}

function getFirstSectionLabel(route) {
	const [firstSegment] = getSegments(route.id);
	if (!firstSegment || SITE_PAGE_IDS.has(firstSegment)) return undefined;
	return siteMeta.sectionLabels[firstSegment] ?? titleizeSegment(firstSegment);
}

function buildBreadcrumbs(route, canonicalUrl, title) {
	const breadcrumbs = [{ name: 'Home', item: toAbsoluteUrl('/') }];
	if (route.id === 'index' || route.id === '404') return breadcrumbs;

	const segments = getSegments(route.id);
	if (!segments.length) {
		breadcrumbs.push({ name: title, item: canonicalUrl });
		return breadcrumbs;
	}

	const pathSegments = [];
	for (let index = 0; index < segments.length; index += 1) {
		const segment = segments[index];
		pathSegments.push(segment);
		const isLast = index === segments.length - 1;
		breadcrumbs.push({
			name: isLast ? title : siteMeta.sectionLabels[segment] ?? titleizeSegment(segment),
			item: isLast ? canonicalUrl : toAbsoluteUrl(`/${pathSegments.join('/')}/`),
		});
	}

	return breadcrumbs;
}

function buildOrganizationNode() {
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		'@id': `${siteMeta.siteUrl}/#organization`,
		name: siteMeta.name,
		url: `${siteMeta.siteUrl}/`,
		email: siteMeta.email,
		logo: {
			'@type': 'ImageObject',
			url: toAbsoluteUrl(siteMeta.icon512Path),
			width: 512,
			height: 512,
		},
		contactPoint: [
			{
				'@type': 'ContactPoint',
				contactType: 'editorial and business inquiries',
				email: siteMeta.email,
				availableLanguage: ['en'],
			},
		],
	};
}

function buildWebsiteNode() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'@id': `${siteMeta.siteUrl}/#website`,
		url: `${siteMeta.siteUrl}/`,
		name: siteMeta.name,
		alternateName: [siteMeta.domain],
		description: siteMeta.description,
		inLanguage: siteMeta.languageTag,
		publisher: { '@id': `${siteMeta.siteUrl}/#organization` },
	};
}

export function buildSeo(route, currentUrl) {
	const title = getString(route.entry?.data?.title) ?? siteMeta.name;
	const description = getString(route.entry?.data?.description) ?? siteMeta.description;
	const primaryKeyword = getString(route.entry?.data?.primaryKeyword);
	const adProfile = getString(route.entry?.data?.adProfile);
	const commercialIntent = getString(route.entry?.data?.commercialIntent);
	const pageKind = getPageKind(route);
	const canonicalUrl = new URL(currentUrl.pathname, `${siteMeta.siteUrl}/`).toString();
	const articleSection = getFirstSectionLabel(route);
	const breadcrumbs = buildBreadcrumbs(route, canonicalUrl, title);
	const modifiedTime = route.lastUpdated instanceof Date ? route.lastUpdated.toISOString() : undefined;
	const imageObject = {
		'@type': 'ImageObject',
		url: toAbsoluteUrl(siteMeta.ogImagePath),
		width: 1200,
		height: 630,
	};

	const pageType =
		pageKind === 'home'
			? 'CollectionPage'
			: pageKind === 'section'
				? 'CollectionPage'
				: pageKind === 'content'
					? 'Article'
					: PAGE_TYPE_BY_ID[route.id] ?? 'WebPage';

	const pageNode =
		pageKind === 'content'
			? {
					'@context': 'https://schema.org',
					'@type': pageType,
					'@id': `${canonicalUrl}#article`,
					headline: title,
					description,
					url: canonicalUrl,
					inLanguage: siteMeta.languageTag,
					mainEntityOfPage: canonicalUrl,
					author: { '@id': `${siteMeta.siteUrl}/#organization` },
					publisher: { '@id': `${siteMeta.siteUrl}/#organization` },
					image: imageObject,
					isPartOf: { '@id': `${siteMeta.siteUrl}/#website` },
					...(articleSection ? { articleSection } : {}),
					...(primaryKeyword
						? {
								keywords: Array.from(new Set([primaryKeyword, ...siteMeta.keywords])).join(', '),
							}
						: {}),
					...(modifiedTime ? { dateModified: modifiedTime } : {}),
				}
			: pageKind === 'not-found'
				? undefined
				: {
						'@context': 'https://schema.org',
						'@type': pageType,
						'@id': `${canonicalUrl}#webpage`,
						name: title,
						description,
						url: canonicalUrl,
						inLanguage: siteMeta.languageTag,
						isPartOf: { '@id': `${siteMeta.siteUrl}/#website` },
						primaryImageOfPage: imageObject,
						...(modifiedTime ? { dateModified: modifiedTime } : {}),
					};

	const breadcrumbNode =
		breadcrumbs.length > 1
			? {
					'@context': 'https://schema.org',
					'@type': 'BreadcrumbList',
					'@id': `${canonicalUrl}#breadcrumb`,
					itemListElement: breadcrumbs.map((crumb, index) => ({
						'@type': 'ListItem',
						position: index + 1,
						name: crumb.name,
						item: crumb.item,
					})),
				}
			: undefined;

	return {
		title,
		description,
		siteName: siteMeta.name,
		themeColor: siteMeta.themeColor,
		ogLocale: siteMeta.ogLocale,
		ogType: pageKind === 'content' ? 'article' : 'website',
		imageUrl: toAbsoluteUrl(siteMeta.ogImagePath),
		imageAlt: siteMeta.ogImageAlt,
		imageWidth: 1200,
		imageHeight: 630,
		modifiedTime,
		articleSection,
		adProfile,
		commercialIntent,
		robots:
			pageKind === 'not-found'
				? 'noindex, nofollow, noarchive, max-snippet:0, max-image-preview:none, max-video-preview:0'
				: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
		structuredData: [buildOrganizationNode(), buildWebsiteNode(), breadcrumbNode, pageNode].filter(
			Boolean
		),
	};
}
