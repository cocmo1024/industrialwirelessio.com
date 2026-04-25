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
	'editorial-desk',
	'review-desk',
	'tool',
]);

const PAGE_TYPE_BY_ID = {
	about: 'AboutPage',
	contact: 'ContactPage',
	'editorial-desk': 'ProfilePage',
	'review-desk': 'ProfilePage',
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
	if (route.id === 'tool' && siteMeta.toolApplication) return 'tool';
	if (SITE_PAGE_IDS.has(route.id)) {
		return route.id === 'about' || route.id === 'contact' ? 'foundation' : 'policy';
	}
	if (route.id.endsWith('/index')) return 'section';
	return 'content';
}

function getString(value) {
	return typeof value === 'string' ? value : undefined;
}

function getStringArray(value) {
	return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function getReferenceType(route) {
	return getString(route.entry?.data?.referenceType);
}

function getPageTopics({ title, primaryKeyword, articleSection, referenceType, keyQuestions }) {
	return Array.from(
		new Set(
			[primaryKeyword, articleSection, referenceType, title, ...keyQuestions]
				.filter((value) => typeof value === 'string')
				.map((value) => value.trim())
				.filter(Boolean)
		)
	);
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

function getModifiedTime(route) {
	return toIsoDate(route.lastUpdated) ?? toIsoDate(route.entry?.data?.lastReviewed);
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

function getPublishingPrinciplesUrl() {
	return siteMeta.publishingPrinciplesPath
		? toAbsoluteUrl(siteMeta.publishingPrinciplesPath)
		: undefined;
}

function getEditorialEntity(key) {
	if (!key) return undefined;
	const entity = siteMeta.editorialEntities?.[key];
	if (!entity) return undefined;

	return {
		key,
		...entity,
		url: toAbsoluteUrl(entity.path),
		id: `${toAbsoluteUrl(entity.path)}#profile`,
	};
}

function getDefaultAuthorKey(route, pageKind) {
	if (route.id === 'editorial-desk' || route.id === 'review-desk') return route.id;
	if (pageKind === 'content' || pageKind === 'tool') return 'editorial-desk';
	return undefined;
}

function getDefaultEditorKey(pageKind) {
	return pageKind === 'content' || pageKind === 'tool' ? 'review-desk' : undefined;
}

function getAuthorship(route, pageKind) {
	const author = getEditorialEntity(route.entry?.data?.authorKey ?? getDefaultAuthorKey(route, pageKind));
	const editor = getEditorialEntity(route.entry?.data?.editorKey ?? getDefaultEditorKey(pageKind));
	return { author, editor };
}

function getRichResultImages() {
	const fallback = [
		{
			path: siteMeta.ogImagePath,
			width: 1200,
			height: 630,
			alt: siteMeta.ogImageAlt,
		},
	];

	return Array.isArray(siteMeta.richResultImages) && siteMeta.richResultImages.length
		? siteMeta.richResultImages
		: fallback;
}

function buildImageObjects(canonicalUrl) {
	return getRichResultImages().map((image, index) => ({
		'@context': 'https://schema.org',
		'@type': 'ImageObject',
		'@id': `${canonicalUrl}#primaryimage-${index + 1}`,
		url: toAbsoluteUrl(image.path),
		contentUrl: toAbsoluteUrl(image.path),
		width: image.width,
		height: image.height,
		caption: image.alt ?? siteMeta.ogImageAlt,
	}));
}

function buildOrganizationNode() {
	const logoUrl = toAbsoluteUrl(siteMeta.icon512Path ?? siteMeta.faviconPath);
	const sameAs = getSameAsUrls();
	const publishingPrinciples = getPublishingPrinciplesUrl();

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
		...(publishingPrinciples ? { publishingPrinciples } : {}),
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
	const publishingPrinciples = getPublishingPrinciplesUrl();

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
		...(publishingPrinciples ? { publishingPrinciples } : {}),
	};
}

function buildEditorialEntityNode(entity) {
	if (!entity) return undefined;

	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		'@id': entity.id,
		name: entity.name,
		description: entity.description,
		url: entity.url,
		memberOf: { '@id': `${siteMeta.siteUrl}/#organization` },
		knowsAbout: entity.expertise,
		...(getSameAsUrls().length ? { sameAs: getSameAsUrls() } : {}),
	};
}

function buildSoftwareApplicationNode(canonicalUrl, author) {
	const app = siteMeta.toolApplication;
	if (!app) return undefined;

	const screenshotUrl = toAbsoluteUrl(app.screenshotPath);

	return {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		'@id': `${canonicalUrl}#software`,
		name: app.name,
		description: app.description,
		url: app.url,
		applicationCategory: app.category,
		operatingSystem: app.operatingSystem,
		browserRequirements: app.browserRequirements,
		isAccessibleForFree: true,
		featureList: app.features,
		screenshot: {
			'@type': 'ImageObject',
			'@id': `${canonicalUrl}#software-screenshot`,
			url: screenshotUrl,
			contentUrl: screenshotUrl,
			width: 1200,
			height: 675,
			caption: app.screenshotAlt,
		},
		offers: {
			'@type': 'Offer',
			price: app.price,
			priceCurrency: app.priceCurrency,
			availability: 'https://schema.org/InStock',
			url: app.url,
		},
		publisher: { '@id': `${siteMeta.siteUrl}/#organization` },
		...(author ? { author: { '@id': author.id } } : {}),
	};
}

export function buildSeo(route, currentUrl) {
	const pageKind = getPageKind(route);
	const authorship = getAuthorship(route, pageKind);
	const title = getString(route.entry?.data?.title) ?? siteMeta.name;
	const description = getString(route.entry?.data?.description) ?? siteMeta.description;
	const primaryKeyword = getString(route.entry?.data?.primaryKeyword);
	const referenceType = getReferenceType(route);
	const canonicalUrl = new URL(currentUrl.pathname, `${siteMeta.siteUrl}/`).toString();
	const articleSection = getFirstSectionLabel(route);
	const breadcrumbs = buildBreadcrumbs(route, canonicalUrl, title);
	const publishedTime = getPublishedTime(route);
	const modifiedTime = getModifiedTime(route);
	const keyQuestions = getStringArray(route.entry?.data?.keyQuestions).slice(0, 3);
	const pageTopics = getPageTopics({
		title,
		primaryKeyword,
		articleSection,
		referenceType,
		keyQuestions,
	});
	const articleTags = pageTopics
		.filter((topic) => topic !== title)
		.slice(0, 8);
	const imageObjects = buildImageObjects(canonicalUrl);
	const primaryImage = imageObjects[0];
	const webpageId = `${canonicalUrl}#webpage`;
	const breadcrumbId = `${canonicalUrl}#breadcrumb`;
	const currentProfileEntity =
		route.id === 'editorial-desk' || route.id === 'review-desk'
			? getEditorialEntity(route.id)
			: undefined;
	const pageType =
		pageKind === 'home' || pageKind === 'section'
			? 'CollectionPage'
			: PAGE_TYPE_BY_ID[route.id] ?? 'WebPage';
	const publishingPrinciples = getPublishingPrinciplesUrl();

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
					primaryImageOfPage: { '@id': primaryImage['@id'] },
					about:
						currentProfileEntity?.expertise ??
						(pageKind === 'home' || pageKind === 'section' ? siteMeta.keywords : pageTopics),
					...(breadcrumbs.length > 1 ? { breadcrumb: { '@id': breadcrumbId } } : {}),
					...(authorship.author ? { author: { '@id': authorship.author.id } } : {}),
					...(authorship.editor ? { editor: { '@id': authorship.editor.id } } : {}),
					...(currentProfileEntity ? { mainEntity: { '@id': currentProfileEntity.id } } : {}),
					...(publishingPrinciples ? { publishingPrinciples } : {}),
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
					author: authorship.author ? { '@id': authorship.author.id } : { '@id': `${siteMeta.siteUrl}/#organization` },
					...(authorship.editor ? { editor: { '@id': authorship.editor.id } } : {}),
					publisher: { '@id': `${siteMeta.siteUrl}/#organization` },
					image: imageObjects.map((image) => ({ '@id': image['@id'] })),
					isPartOf: { '@id': `${siteMeta.siteUrl}/#website` },
					isAccessibleForFree: true,
					about: pageTopics,
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

	const softwareNode =
		route.id === 'tool' ? buildSoftwareApplicationNode(canonicalUrl, authorship.author) : undefined;

	const entityNodes = Array.from(
		new Map(
			[authorship.author, authorship.editor, currentProfileEntity]
				.filter(Boolean)
				.map((entity) => [entity.id, buildEditorialEntityNode(entity)])
		).values()
	);

	return {
		title,
		description,
		canonicalUrl,
		siteName: siteMeta.name,
		themeColor: siteMeta.themeColor,
		ogLocale: siteMeta.ogLocale,
		ogType: pageKind === 'content' ? 'article' : 'website',
		imageUrl: primaryImage.url,
		imageAlt: primaryImage.caption,
		imageWidth: primaryImage.width,
		imageHeight: primaryImage.height,
		imageType: primaryImage.url.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
		publishedTime,
		modifiedTime,
		articleSection,
		articleTags,
		twitterSite: getTwitterHandle(),
		authorName: authorship.author?.name ?? siteMeta.editorialTeamName ?? siteMeta.name,
		authorUrl: authorship.author?.url,
		editorName: authorship.editor?.name,
		editorUrl: authorship.editor?.url,
		editorialMethodSummary: siteMeta.editorialMethodSummary,
		robots:
			pageKind === 'not-found' || NOINDEX_PAGE_IDS.has(route.id)
				? 'noindex, nofollow, noarchive, max-snippet:0, max-image-preview:none, max-video-preview:0'
				: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
		structuredData: [
			buildOrganizationNode(),
			buildWebsiteNode(),
			breadcrumbNode,
			...imageObjects,
			...entityNodes,
			webpageNode,
			articleNode,
			softwareNode,
		].filter(Boolean),
	};
}
