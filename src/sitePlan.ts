import { SITE_CONTACT_EMAIL, SITE_TITLE } from './consts';

export const SITE_EDITOR = {
	name: `${SITE_TITLE} Editorial Desk`,
	role: 'Field connectivity research desk',
	email: SITE_CONTACT_EMAIL,
	bio: 'We focus on remote telemetry architecture, wireless I/O deployment, and reliability planning that stays useful for engineers and operators over time.',
};

export const SITE_POSITIONING =
	'Build an English-language field manual around telemetry architecture, network comparison, and deployment reliability for remote industrial assets.';

export const SITE_AUDIENCES = [
	{
		title: 'Controls and Automation Engineers',
		summary: 'Readers deciding how to move signals and telemetry data from remote equipment into usable operational systems.',
	},
	{
		title: 'Utilities and Remote Asset Operators',
		summary: 'Teams responsible for pump stations, water systems, energy assets, and other distributed infrastructure with uptime constraints.',
	},
	{
		title: 'System Integrators and Network Designers',
		summary: 'People comparing LoRaWAN, cellular, wireless I/O, gateways, and field-hardened deployment approaches.',
	},
];

export const SITE_CONTENT_PILLARS = [
	{
		title: 'Field Architecture',
		href: '/categories/field-architecture/',
		summary: 'Remote-site design logic that ties telemetry systems to assets, geography, service access, and environment reality.',
	},
	{
		title: 'Network Comparison',
		href: '/categories/network-comparison/',
		summary: 'LoRaWAN, cellular, Wi-Fi, and mixed-network tradeoff pages built for pre-purchase design decisions.',
	},
	{
		title: 'Deployment Reliability',
		href: '/categories/deployment-reliability/',
		summary: 'Panels, antennas, power, grounding, labeling, and maintenance topics that keep field systems alive.',
	},
];

export const SITE_VALUE_LANES = [
	{
		title: 'Architecture Intent',
		summary: 'Readers comparing design paths are often closer to real spend than readers consuming high-level IoT commentary.',
	},
	{
		title: 'Reliability Intent',
		summary: 'Field-hardening and maintenance pages speak to operational risk, which makes them sticky and commercially valuable.',
	},
	{
		title: 'Deployment Intent',
		summary: 'Remote telemetry content attracts teams who need hardware, services, or integration support to execute.',
	},
];

export const SITE_PRIORITY_CLUSTERS = [
	{
		title: 'Pump Station and Water Telemetry',
		summary: 'Architecture and reliability pages for remote water, wastewater, and lift-station monitoring.',
		whyItWins: 'A clear industrial use case with repeatable design needs, long equipment life, and strong hardware or services relevance.',
	},
	{
		title: 'LoRaWAN vs Cellular by Asset Type',
		summary: 'Comparison pages based on geography, bandwidth, battery life, service access, and maintenance burden.',
		whyItWins: 'High-value traffic from teams making pre-purchase architecture decisions rather than browsing general connectivity content.',
	},
	{
		title: 'Panel, Antenna, and Power Design',
		summary: 'Deployment detail around enclosures, cable runs, antenna placement, grounding, and backup power.',
		whyItWins: 'Field reliability topics stay useful for years and are difficult for shallow competitors to cover well.',
	},
	{
		title: 'Remote I/O and Gateway Selection',
		summary: 'Device-role guidance for remote I/O modules, protocol gateways, routers, and telemetry controllers.',
		whyItWins: 'Useful where architecture questions turn into actual hardware decisions and vendor shortlists.',
	},
];

export const SITE_CONTENT_FORMATS = [
	{
		title: 'Architecture Guides',
		summary: 'Scenario-specific field pages that connect asset type, data flow, network choice, and deployment constraints.',
	},
	{
		title: 'Network Comparison Pages',
		summary: 'Decision content built around tradeoffs in coverage, maintenance, bandwidth, cost, and resiliency.',
	},
	{
		title: 'Field Checklists',
		summary: 'Panel, enclosure, antenna, service-access, and maintenance-oriented documents that stay relevant over time.',
	},
	{
		title: 'Hardware Role Guides',
		summary: 'Pages that clarify what kind of remote I/O, gateway, controller, or modem belongs in a given architecture.',
	},
];

export const SITE_METHOD_PRINCIPLES = [
	{
		title: 'Field constraints first',
		summary: 'Every strong page should account for geography, power, enclosure, service access, and maintenance reality.',
	},
	{
		title: 'Compare architecture, not just products',
		summary: 'Readers often need to choose the design path before they can responsibly choose a vendor or module.',
	},
	{
		title: 'Reliability is part of strategy',
		summary: 'Grounding, antenna placement, backup power, and labeling are not side notes; they are core content assets.',
	},
	{
		title: 'Refresh pages that drive hardware decisions',
		summary: 'Network and role-comparison pages should be revisited often enough to remain trusted entry points.',
	},
];

export const SITE_AVOID_TOPICS = [
	'Generic smart-city or IoT future posts with no field deployment value',
	'Thin hardware lists that ignore architecture and maintenance reality',
	'Consumer wireless content disconnected from industrial remote assets',
	'Protocol explainers that never connect to a real design decision',
];

export const SITE_UPDATE_PLAYBOOK = [
	{
		title: 'Monthly field buildout',
		summary: 'Expand one field scenario with an architecture guide, a reliability checklist, and a linked comparison page.',
	},
	{
		title: 'Quarterly comparison refresh',
		summary: 'Revisit the highest-intent network and hardware role pages so they remain useful for current design choices.',
	},
	{
		title: 'Quarterly reliability expansion',
		summary: 'Add enclosure, antenna, grounding, or power-planning pages that deepen the practical field manual layer.',
	},
	{
		title: 'Annual architecture recut',
		summary: 'Consolidate overlapping guides and strengthen the hub pages that anchor the most valuable field-use cases.',
	},
];

export const SITE_REVIEW_PROMISE =
	'The pages that influence architecture and hardware decisions should be revisited on a recurring cycle so remote-asset teams can trust the archive when deployments matter.';
