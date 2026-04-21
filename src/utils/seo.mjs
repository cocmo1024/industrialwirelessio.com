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

const NOINDEX_PAGE_IDS = new Set([
	'advertising',
	'affiliate-disclosure',
	'privacy',
	'terms-of-use',
	'disclaimer',
]);

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

function toIsoDate(value) {
	if (!value) return undefined;
	const parsed = value instanceof Date ? value : new Date(value);
	return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function getPublishedTime(route) {
	return (
		toIsoDate(route.entry?.data?.datePublished) ??
		toIsoDate(route.entry?.data?.publishedTime) ??
		toIsoDate(route.entry?.data?.publishDate)
	);
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

function getSameAsUrls() {
	return Array.from(
		new Set([
			...(Array.isArray(siteMeta.sameAs) ? siteMeta.sameAs : []),
			...(siteMeta.xUrl ? [siteMeta.xUrl] : []),
			...(siteMeta.repoUrl ? [siteMeta.repoUrl] : []),
		].filter(Boolean))
	);
}

function getTwitterHandle() {
	if (!siteMeta.xUrl) return undefined;
	try {
		const pathname = new URL(siteMeta.xUrl).pathname.replace(/^\/+/, '').split('/')[0];
		return pathname ? `@${pathname}` : undefined;
	} catch {
		return undefined;
	}
}

function buildOrganizationNode() {
	const logoUrl = toAbsoluteUrl(siteMeta.icon512Path ?? siteMeta.faviconPath);
	const sameAs = getSameAsUrls();

	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		'@id': `${siteMeta.siteUrl}/#organization`,
		name: siteMeta.name,
		alternateName: Array.from(
			new Set([siteMeta.shortName, siteMeta.domain].filter((value) => typeof value === 'string'))
		),
		url: `${siteMeta.siteUrl}/`,
		description: siteMeta.description,
		email: siteMeta.email,
		...(sameAs.length ? { sameAs } : {}),
		knowsAbout: siteMeta.keywords,
		logo: {
			'@type': 'ImageObject',
			'@id': `${siteMeta.siteUrl}/#logo`,
			url: logoUrl,
			contentUrl: logoUrl,
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
	const pageKind = getPageKind(route);
	const canonicalUrl = new URL(currentUrl.pathname, `${siteMeta.siteUrl}/`).toString();
	const articleSection = getFirstSectionLabel(route);
	const breadcrumbs = buildBreadcrumbs(route, canonicalUrl, title);
	const publishedTime = getPublishedTime(route);
	const modifiedTime = toIsoDate(route.lastUpdated);
	const articleTags = Array.from(
		new Set([...(primaryKeyword ? [primaryKeyword] : []), ...siteMeta.keywords])
	).slice(0, 8);
	const imageId = `${canonicalUrl}#primaryimage`;
	const imageUrl = toAbsoluteUrl(siteMeta.ogImagePath);
	const imageObject = {
		'@type': 'ImageObject',
		'@id': imageId,
		url: imageUrl,
		contentUrl: imageUrl,
		width: 1200,
		height: 630,
		caption: siteMeta.ogImageAlt,
	};
	const webpageId = `${canonicalUrl}#webpage`;
	const breadcrumbId = `${canonicalUrl}#breadcrumb`;
	const pageType =
		pageKind === 'home' || pageKind === 'section'
			? 'CollectionPage'
			: PAGE_TYPE_BY_ID[route.id] ?? 'WebPage';

	const webpageNode =
		pageKind === 'not-found'
			? undefined
			: {
					'@context': 'https://schema.org',
					'@type': pageType,
					'@id': webpageId,
					name: title,
					description,
					url: canonicalUrl,
					inLanguage: siteMeta.languageTag,
					isPartOf: { '@id': `${siteMeta.siteUrl}/#website` },
					primaryImageOfPage: { '@id': imageId },
					about: siteMeta.keywords,
					...(breadcrumbs.length > 1 ? { breadcrumb: { '@id': breadcrumbId } } : {}),
					...(modifiedTime ? { dateModified: modifiedTime } : {}),
				};

	const articleNode =
		pageKind === 'content'
			? {
					'@context': 'https://schema.org',
					'@type': 'Article',
					'@id': `${canonicalUrl}#article`,
					headline: title,
					description,
					url: canonicalUrl,
					inLanguage: siteMeta.languageTag,
					mainEntityOfPage: { '@id': webpageId },
					author: { '@id': `${siteMeta.siteUrl}/#organization` },
					publisher: { '@id': `${siteMeta.siteUrl}/#organization` },
					image: { '@id': imageId },
					isPartOf: { '@id': `${siteMeta.siteUrl}/#website` },
					isAccessibleForFree: true,
					about: siteMeta.keywords,
					...(articleSection ? { articleSection } : {}),
					...(articleTags.length ? { keywords: articleTags.join(', ') } : {}),
					...(publishedTime ? { datePublished: publishedTime } : {}),
					...(modifiedTime ? { dateModified: modifiedTime } : {}),
				}
			: undefined;

	const breadcrumbNode =
		breadcrumbs.length > 1
			? {
					'@context': 'https://schema.org',
					'@type': 'BreadcrumbList',
					'@id': breadcrumbId,
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
		canonicalUrl,
		siteName: siteMeta.name,
		themeColor: siteMeta.themeColor,
		ogLocale: siteMeta.ogLocale,
		ogType: pageKind === 'content' ? 'article' : 'website',
		imageUrl,
		imageAlt: siteMeta.ogImageAlt,
		imageWidth: 1200,
		imageHeight: 630,
		publishedTime,
		modifiedTime,
		articleSection,
		articleTags,
		twitterSite: getTwitterHandle(),
		robots:
			pageKind === 'not-found' || NOINDEX_PAGE_IDS.has(route.id)
				? 'noindex, nofollow, noarchive, max-snippet:0, max-image-preview:none, max-video-preview:0'
				: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
		structuredData: [
			buildOrganizationNode(),
			buildWebsiteNode(),
			breadcrumbNode,
			imageObject,
			webpageNode,
			articleNode,
		].filter(Boolean),
	};
}
