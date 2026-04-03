type Frontmatter = Record<string, unknown> | undefined;

type AdSlotPlan = {
	zone: string;
	headline: string;
	sizes: string[];
	audience?: string;
	note?: string;
};

type AdPlan = {
	summary: string;
	rail: AdSlotPlan[];
	footer: AdSlotPlan;
};

type AdProfile =
	| 'foundation'
	| 'policy'
	| 'application'
	| 'vendor'
	| 'product-family'
	| 'protocol'
	| 'network-path'
	| 'hardware'
	| 'reliability';

function inferProfile(routeId: string, frontmatter: Frontmatter): AdProfile {
	const explicit = frontmatter?.adProfile;
	if (typeof explicit === 'string') return explicit as AdProfile;
	if (routeId.startsWith('applications/')) return 'application';
	if (routeId.startsWith('vendors/')) return 'vendor';
	if (routeId.startsWith('product-families/')) return 'product-family';
	if (routeId.startsWith('protocols/')) return 'protocol';
	if (routeId.startsWith('network-paths/')) return 'network-path';
	if (routeId.startsWith('hardware/')) return 'hardware';
	if (routeId.startsWith('reliability/')) return 'reliability';
	if (routeId === 'about' || routeId === 'contact' || routeId === 'index') return 'foundation';
	return 'policy';
}

const plans: Record<AdProfile, AdPlan> = {
	foundation: {
		summary:
			'Foundation pages keep the future commercial layout conservative while reserving room for high-fit industrial sponsors and directory-safe inventory.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Industrial category sponsor',
				sizes: ['300x250', '300x300'],
				audience: 'Fit for telemetry, instrumentation, connectivity, or software brands.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Report, directory, or awareness placement',
				sizes: ['300x600', 'native card'],
				audience: 'Lower-pressure inventory for technical field readers.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Cross-site industrial placement',
			sizes: ['728x90', '970x90', 'native strip'],
			audience: 'Useful for broad awareness across reference traffic.',
		},
	},
	policy: {
		summary:
			'Policy and disclosure pages should remain easy to trust, so the reserved commercial footprint is intentionally restrained.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Disclosure-safe brand placement',
				sizes: ['300x250', 'native card'],
				audience: 'Reserved for conservative trust-page inventory only.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Low-pressure network placement',
			sizes: ['728x90', 'native strip'],
			audience: 'Appropriate only where disclosure remains explicit.',
		},
	},
	application: {
		summary:
			'Application pages are strong monetization territory because readers are usually scoping a live field deployment and narrowing architecture choices.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Application-fit sponsor slot',
				sizes: ['300x250', '300x300'],
				audience: 'High fit for telemetry hardware, integrators, and industrial software tied to deployment work.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Field architecture or integration partner',
				sizes: ['300x600', 'native card'],
				audience: 'Useful for readers moving from research into specification work.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Application-stage partner slot',
			sizes: ['728x90', '970x90'],
			audience: 'Reserved for higher-intent engineering and buying traffic.',
		},
	},
	vendor: {
		summary:
			'Vendor pages are designed for shortlist-supporting inventory, with clear separation between editorial analysis and any future paid placements.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Portfolio-adjacent sponsor slot',
				sizes: ['300x250', '300x300'],
				audience: 'Fit for adjacent ecosystem brands, not silent editorial influence.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Directory or partner placement',
				sizes: ['300x600', 'native card'],
				audience: 'Useful for readers comparing support ecosystems and integration options.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Vendor research placement',
			sizes: ['728x90', '970x90'],
			audience: 'Reserved for vendor-adjacent but clearly disclosed inventory.',
		},
	},
	'product-family': {
		summary:
			'Product-family pages combine durable SEO with strong commercial relevance, making them ideal for structured sponsor inventory once traffic scales.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Primary product-family sponsor',
				sizes: ['300x250', '300x300'],
				audience: 'Strong fit for hardware categories under active evaluation.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Shortlist or catalog extension slot',
				sizes: ['300x600', 'native card'],
				audience: 'Best for buyers moving from category education to product research.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Category-bottom placement',
			sizes: ['728x90', '970x90', 'native strip'],
			audience: 'Designed for research traffic close to shortlist formation.',
		},
	},
	protocol: {
		summary:
			'Protocol pages support thoughtful commercial positioning for integration, interoperability, and telemetry software without overwhelming the educational content.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Interoperability or gateway sponsor',
				sizes: ['300x250', '300x300'],
				audience: 'Fit for gateway, connectivity, or integration software vendors.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Protocol ecosystem placement',
				sizes: ['300x600', 'native card'],
				audience: 'Useful for readers validating protocol and architecture fit.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Protocol comparison strip',
			sizes: ['728x90', '970x90'],
			audience: 'Reserved for technically literate research traffic.',
		},
	},
	'network-path': {
		summary:
			'Network-path pages tend to carry some of the strongest commercial value because they sit close to field architecture, coverage, and service-cost decisions.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Connectivity path sponsor',
				sizes: ['300x250', '300x300'],
				audience: 'Strong fit for carriers, gateways, antennas, and connectivity partners.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Backhaul or infrastructure placement',
				sizes: ['300x600', 'native card'],
				audience: 'Useful for readers narrowing field network strategy.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Network-strategy placement',
			sizes: ['728x90', '970x90', 'native strip'],
			audience: 'Reserved for high-intent telemetry architecture traffic.',
		},
	},
	hardware: {
		summary:
			'Hardware pages are naturally suited to product-category monetization, but the layout should remain disciplined and useful for technical evaluation.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Hardware stack sponsor',
				sizes: ['300x250', '300x300'],
				audience: 'Fit for enclosures, power, antennas, gateways, and ruggedized devices.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Deployment component placement',
				sizes: ['300x600', 'native card'],
				audience: 'Useful for readers shaping a full site-ready footprint.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Hardware evaluation strip',
			sizes: ['728x90', '970x90'],
			audience: 'Reserved for implementation-stage readers.',
		},
	},
	reliability: {
		summary:
			'Reliability pages are ideal for sponsors aligned with uptime, serviceability, survivability, and long-term field operations.',
		rail: [
			{
				zone: 'Right Rail A',
				headline: 'Reliability sponsor slot',
				sizes: ['300x250', '300x300'],
				audience: 'Fit for monitoring, power, enclosure, or service providers.',
			},
			{
				zone: 'Right Rail B',
				headline: 'Uptime and maintenance partner',
				sizes: ['300x600', 'native card'],
				audience: 'Useful for readers focused on lifetime field performance.',
			},
		],
		footer: {
			zone: 'Footer Band',
			headline: 'Survivability-focused placement',
			sizes: ['728x90', '970x90', 'native strip'],
			audience: 'Reserved for readers under active uptime pressure.',
		},
	},
};

export function getAdPlan(routeId: string, frontmatter: Frontmatter): AdPlan {
	const profile = inferProfile(routeId, frontmatter);
	return plans[profile];
}
