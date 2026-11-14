/**
 * brand.ts — single source of truth for every brand fact on this site.
 *
 * Evolved from the legacy `src/utils/site-meta.mjs` during the Phase 0
 * rebuild (blueprint v2, 2026-11-14). The JSON-LD generators, the footer,
 * the About page and the llms endpoints ALL read from this module. No
 * surface may hand-write the positioning sentence, the slogan, the email
 * or the cluster sentence — the legacy stack drifted into four different
 * versions of the site's positioning; that must be structurally
 * impossible here (GEO List B-13: one fact block, verbatim everywhere).
 *
 * Canonical fact block (GEO List B-13, fixed 2026-11-13):
 *   Site name:   Industrial Wireless I/O
 *   URL:         https://industrialwirelessio.com/
 *   Positioning: Industrial Wireless I/O is an English-language reference
 *                hub for industrial wireless I/O and industrial wireless
 *                connectivity: wireless I/O modules and gateways,
 *                wireless protocols (WirelessHART, ISA100.11a, LoRaWAN,
 *                IO-Link Wireless, NB-IoT/LTE-M and private 5G), and
 *                link, antenna and site engineering for factory
 *                automation, process industry and utility telemetry.
 *   Contact:     cqq365@gmail.com
 *   Cluster:     This site is the wireless-connectivity layer of a
 *                three-site industrial reference cluster. iiotdevices.com
 *                covers IIoT devices and architecture; sensorcatalog.com
 *                covers sensor specifications and selection. This site
 *                covers how those devices and sensors connect wirelessly.
 *   Sourcing:    Product and protocol specifications on this site are
 *                taken from manufacturer datasheets and standards-body
 *                publications; figures that cannot be traced to a
 *                primary source are left out.
 *
 * B-14 — DO NOT "complete" this entity (recorded so nobody helpfully
 * invents facts later):
 *   - Do NOT add foundingDate, postal address or telephone. None are
 *     published for this site; an invented one is a factual error, not
 *     a gap.
 *   - Do NOT pad `sameAs` with unverified profiles. Only accounts whose
 *     ownership is proven may be listed (see `verifiedProfiles`).
 *     The legacy X handle x.com/oocxx_com was dropped in Phase 0
 *     (GEO List B-03: ownership unproven; B-04: the GitHub code
 *     repository is not a brand profile and is never a sameAs entry).
 *   - This brand has zero association with the operator's manufacturing
 *     businesses. Never link or reference them here.
 */

export const LOCALES = ['en', 'de', 'es', 'pt', 'zh', 'ja', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** BCP-47 tag + og:locale per locale (name/email/numbers never localize). */
export const LOCALE_TAGS: Record<Locale, { languageTag: string; ogLocale: string }> = {
	en: { languageTag: 'en-US', ogLocale: 'en_US' },
	de: { languageTag: 'de-DE', ogLocale: 'de_DE' },
	es: { languageTag: 'es-ES', ogLocale: 'es_ES' },
	pt: { languageTag: 'pt-PT', ogLocale: 'pt_PT' },
	zh: { languageTag: 'zh-CN', ogLocale: 'zh_CN' },
	ja: { languageTag: 'ja-JP', ogLocale: 'ja_JP' },
	fr: { languageTag: 'fr-FR', ogLocale: 'fr_FR' },
};

const POSITIONING =
	'Industrial Wireless I/O is an English-language reference hub for industrial wireless I/O and industrial wireless connectivity: wireless I/O modules and gateways, wireless protocols (WirelessHART, ISA100.11a, LoRaWAN, IO-Link Wireless, NB-IoT/LTE-M and private 5G), and link, antenna and site engineering for factory automation, process industry and utility telemetry.';

const CLUSTER =
	'This site is the wireless-connectivity layer of a three-site industrial reference cluster. iiotdevices.com covers IIoT devices and architecture; sensorcatalog.com covers sensor specifications and selection. This site covers how those devices and sensors connect wirelessly.';

const SOURCING =
	'Product and protocol specifications on this site are taken from manufacturer datasheets and standards-body publications; figures that cannot be traced to a primary source are left out.';

/** B-05: one short sentence (<= 20 words) used as slogan AND tagline. */
const SLOGAN = 'Wireless I/O modules, gateways and protocols — specified from primary sources.';

export const brand = {
	name: 'Industrial Wireless I/O',
	shortName: 'Industrial Wireless I/O',
	domain: 'industrialwirelessio.com',
	siteUrl: 'https://industrialwirelessio.com',

	/** Verbatim B-13 fields — change here only, everywhere follows. */
	positioning: POSITIONING,
	cluster: CLUSTER,
	sourcing: SOURCING,
	slogan: SLOGAN,
	tagline: SLOGAN,
	/** Organization/WebSite `description` reads this (B-01). */
	description: POSITIONING,
	email: 'cqq365@gmail.com',

	editorialTeamName: 'Industrial Wireless I/O Editorial Desk',
	reviewDeskName: 'Industrial Wireless I/O Review Desk',
	editorialMethodSummary:
		'Pages are built from manufacturer datasheets, standards-body publications, field deployment patterns and physical-layer constraints; figures that cannot be traced to a primary source are left out.',

	/**
	 * Proven brand profiles only (B-03/B-04/B-14). Empty is a valid,
	 * deliberate state: the JSON-LD generator omits `sameAs` entirely
	 * when this list is empty.
	 */
	verifiedProfiles: [] as string[],

	/** Code repository — provenance only. NEVER a sameAs entry (B-04). */
	repoUrl: 'https://github.com/cocmo1024/industrialwirelessio.com',

	publishingPrinciplesPath: '/editorial-policy/',
	indexNowKey: 'a435a92c-80e4-4570-9d7f-96304231a2f2',

	themeColor: '#0b7285',
	backgroundColor: '#f7f8f9',
	faviconPath: '/favicon.svg',
	ogImagePath: '/social-card.png',
	ogImageAlt:
		'Industrial Wireless I/O — reference hub for wireless I/O modules, gateways, protocols and link engineering.',
	icon192Path: '/icon-192.png',
	icon512Path: '/icon-512.png',
	appleTouchIconPath: '/apple-touch-icon.png',
	richResultImages: [
		{
			path: '/social-card.png',
			width: 1200,
			height: 630,
			alt: 'Industrial Wireless I/O — reference hub for wireless I/O modules, gateways, protocols and link engineering.',
		},
		{
			path: '/search-preview-4x3.svg',
			width: 1200,
			height: 900,
			alt: 'Industrial Wireless I/O reference map for protocols, product records and link engineering.',
		},
		{
			path: '/search-preview-1x1.svg',
			width: 1200,
			height: 1200,
			alt: 'Industrial Wireless I/O square preview for wireless I/O and connectivity reference.',
		},
	],

	/** B-02: Organization `knowsAbout` vocabulary (connectivity, not telemetry-only). */
	knowsAbout: [
		'industrial wireless io',
		'wireless I/O modules',
		'WirelessHART',
		'ISA100.11a',
		'LoRaWAN',
		'IO-Link Wireless',
		'NB-IoT',
		'LTE-M',
		'private 5G',
		'link budget',
		'field connectivity',
	],

	editorialEntities: {
		'editorial-desk': {
			name: 'Industrial Wireless I/O Editorial Desk',
			path: '/editorial-desk/',
			description:
				'Maintains reference pages on industrial wireless I/O modules and gateways, wireless protocols, and link and site engineering.',
			expertise: [
				'wireless I/O modules',
				'wireless gateways',
				'wireless protocols',
				'network paths',
				'link engineering',
			],
		},
		'review-desk': {
			name: 'Industrial Wireless I/O Review Desk',
			path: '/review-desk/',
			description:
				'Reviews pages for physical-layer realism, source traceability, and site-level operational fit before major updates are published.',
			expertise: [
				'physical-layer review',
				'link budget review',
				'alarm design',
				'source verification',
				'remote-site operations',
			],
		},
	} as Record<
		string,
		{ name: string; path: string; description: string; expertise: string[] }
	>,

	/** Section labels for breadcrumbs (URL roots kept stable per blueprint §7.1). */
	sectionLabels: {
		protocols: 'Protocols',
		'product-families': 'Product Families',
		vendors: 'Vendors',
		'network-paths': 'Network Paths',
		hardware: 'Hardware',
		reliability: 'Reliability',
		applications: 'Applications',
		tools: 'Tools',
		compare: 'Compare',
	} as Record<string, string>,
} as const;

export type Brand = typeof brand;
