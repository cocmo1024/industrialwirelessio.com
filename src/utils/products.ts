/**
 * products.ts — the §4.3 indexability gate and the shared views of
 * product records.
 *
 * Blueprint §4.3, operationalized: a record in the database is NOT
 * automatically a page. A record earns an indexable product page only
 * when ALL of the following hold (computed here, applied identically
 * by the product route, the database index table, the protocol-page
 * product slots, the sitemap and the llms endpoints):
 *
 *   1. Identity complete: vendor / model / productType.
 *   2. Wireless identity: at least 3 of the wireless-identity fields
 *      are non-empty, and `protocols` + `frequencyBands` are among
 *      the populated ones.
 *   3. I/O substance: at least one I/O count is non-null — gateways
 *      may substitute upstreamInterfaces >= 2.
 *   4. Source binding: sourceUrl / sourceType / dateChecked present,
 *      plus a sourceDocId or a product-page type source.
 *   5. Anatomy substance: the rendered page would carry a wireless
 *      identity section plus at least one spec table with real rows
 *      (I/O, electrical or environment rows counted from the record).
 *
 * Records that fail any check stay in the database as rows: they feed
 * the index table, the protocol slots and comparisons, and are
 * promoted to pages automatically once their sources are completed.
 * There is no manual override flag — the gate is the record's data.
 */
import type { CollectionEntry } from 'astro:content';
import { brand } from '../data/brand';

export type ProductRecord = CollectionEntry<'products'>['data'];
export type VendorRecord = CollectionEntry<'vendors'>['data'];

export const PRODUCT_TYPE_LABELS: Record<ProductRecord['productType'], string> = {
	'wireless-io-module': 'Wireless I/O module',
	gateway: 'Gateway',
	adapter: 'Adapter',
	router: 'Router',
	'radio-modem': 'Radio modem',
	'sensor-node': 'Sensor node',
};

export const PROTOCOL_LABELS: Record<string, string> = {
	wirelesshart: 'WirelessHART',
	isa100: 'ISA100.11a',
	lorawan: 'LoRaWAN',
	'io-link-wireless': 'IO-Link Wireless',
	lte: 'LTE',
	'lte-m': 'LTE-M',
	'nb-iot': 'NB-IoT',
	'5g': '5G',
	wifi: 'Wi-Fi',
	'proprietary-subghz': 'Proprietary sub-GHz',
	'proprietary-24ghz': 'Proprietary 2.4 GHz',
	'modbus': 'Modbus',
	'proprietary-900': 'Proprietary 900 MHz',
	'proprietary-2-4': 'Proprietary 2.4 GHz',
	'proprietary-licensed': 'Proprietary licensed band',
	'gprs': 'GPRS',
	'3g': '3G',
};

export function protocolLabel(slug: string): string {
	return PROTOCOL_LABELS[slug] ?? slug;
}

const IO_FIELDS = [
	['di', 'DI'],
	['do', 'DO'],
	['ai', 'AI'],
	['ao', 'AO'],
	['relay', 'Relay'],
	['pulse', 'Pulse'],
] as const;

/** "4 DI · 4 DO · 2 AI" from a record's I/O block; '' when no counts are recorded. */
export function ioSummary(record: ProductRecord): string {
	return IO_FIELDS.filter(([key]) => record.io[key] != null)
		.map(([key, label]) => `${record.io[key]} ${label}`)
		.join(' · ');
}

/** Which I/O families a record carries — drives the index "I/O type" filter. */
export function ioTypes(record: ProductRecord): string[] {
	return IO_FIELDS.filter(([key]) => record.io[key] != null).map(([, label]) => label);
}

/** Coarse band family for the index "Band" filter, derived from the sourced band strings. */
export function bandFamily(record: ProductRecord): string[] {
	const families = new Set<string>();
	for (const band of record.frequencyBands) {
		const text = band.toLowerCase();
		if (text.includes('2.4')) families.add('2.4 GHz');
		if (/(^|\D)868(\D|$)|eu868/.test(text)) families.add('868 MHz');
		if (/90[0-9]|91[0-9]|us915|915/.test(text)) families.add('900 MHz');
		if (/lte|cellular|cat[-\s]?m|nb-iot/.test(text)) families.add('Cellular');
		if (/433/.test(text)) families.add('433 MHz');
	}
	return [...families];
}

export interface ProductGate {
	indexable: boolean;
	identity: boolean;
	wirelessIdentity: boolean;
	ioSubstance: boolean;
	sourceBinding: boolean;
	anatomySubstance: boolean;
	/** Count of populated wireless-identity fields (gate 2 evidence). */
	wirelessFieldsPopulated: number;
}

export function productGate(record: ProductRecord): ProductGate {
	const identity = Boolean(record.vendor && record.model && record.productType);

	const wirelessChecks = [
		record.protocols.length > 0,
		record.frequencyBands.length > 0,
		record.txPowerDbm != null,
		record.rxSensitivityDbm != null,
		record.rangeClass != null,
		record.antenna != null,
	];
	const wirelessFieldsPopulated = wirelessChecks.filter(Boolean).length;
	const wirelessIdentity =
		wirelessFieldsPopulated >= 3 && record.protocols.length > 0 && record.frequencyBands.length > 0;

	const ioCounts = IO_FIELDS.map(([key]) => record.io[key]).filter((value) => value != null);
	const ioSubstance = ioCounts.length >= 1 || record.upstreamInterfaces.length >= 2;

	const sourceBinding = Boolean(
		record.sourceUrl &&
			record.sourceType &&
			record.dateChecked &&
			(record.sourceDocId || record.sourceType === 'product-page'),
	);

	const specRows =
		ioCounts.length +
		(record.ioNotes ? 1 : 0) +
		(record.powerSupply ? 1 : 0) +
		(record.powerConsumption ? 1 : 0) +
		(record.batteryLife ? 1 : 0) +
		(record.ipRating ? 1 : 0) +
		(record.operatingTemp ? 1 : 0) +
		record.certifications.length +
		(record.hazardousArea ? 1 : 0);
	const anatomySubstance = wirelessIdentity && specRows >= 1;

	return {
		indexable: identity && wirelessIdentity && ioSubstance && sourceBinding && anatomySubstance,
		identity,
		wirelessIdentity,
		ioSubstance,
		sourceBinding,
		anatomySubstance,
		wirelessFieldsPopulated,
	};
}

export function productPath(record: ProductRecord): string {
	return `/product-families/${record.slug}/`;
}

export interface SensitivityPreset {
	vendor: string;
	model: string;
	sensitivityDbm: number;
	condition: string;
	href: string;
}

/**
 * Receiver-sensitivity presets for the link tools (Phase 3): only
 * records that (a) carry a datasheet sensitivity figure and (b)
 * earned a full product page may preset a calculator — the value a
 * reader can one-click into a budget must be one click away from
 * its source record. Optionally restricted to one protocol.
 */
export function sensitivityPresets(
	records: ProductRecord[],
	protocolSlug?: string,
): SensitivityPreset[] {
	return records
		.filter(
			(record) =>
				record.rxSensitivityDbm != null &&
				(!protocolSlug || record.protocols.includes(protocolSlug)) &&
				productGate(record).indexable,
		)
		.map((record) => ({
			vendor: record.vendor,
			model: record.model,
			sensitivityDbm: record.rxSensitivityDbm as number,
			condition: record.rxSensitivityCondition ?? 'per the manufacturer datasheet',
			href: productPath(record),
		}))
		.sort((a, b) => a.vendor.localeCompare(b.vendor) || a.model.localeCompare(b.model));
}

/** One-line factual summary of a record, composed only from its sourced fields. */
export function productSummary(record: ProductRecord): string {
	const parts: string[] = [
		`${record.vendor} ${record.model} is a ${PRODUCT_TYPE_LABELS[record.productType].toLowerCase()}`,
	];
	const radios = record.protocols.map(protocolLabel).join(' / ');
	if (radios) parts.push(`running ${radios}`);
	if (record.frequencyBands.length) parts.push(`on ${record.frequencyBands.join(', ')}`);
	const io = ioSummary(record);
	if (io) parts.push(`with ${io}`);
	if (record.ipRating) parts.push(`in a ${record.ipRating} enclosure`);
	return `${parts.join(' ')}.`;
}

/**
 * Dataset structured data for the database index page (GEO List B-11).
 * Field definitions are fixed here once; dateModified is the latest
 * dateChecked across the records the dataset currently covers.
 */
export const DATASET_VARIABLES: { name: string; definition: string; unit?: string }[] = [
	{ name: 'Radio protocol', definition: 'Wireless protocol(s) the product implements, as named in the manufacturer source (e.g. WirelessHART, ISA100.11a, LoRaWAN, LTE-M).' },
	{ name: 'Frequency band', definition: 'Radio band(s) as stated by the manufacturer, including regional variants (e.g. 2.4 GHz ISM, EU868, US915).' },
	{ name: 'Transmit power', definition: 'Maximum conducted or radiated transmit power stated in the manufacturer datasheet, with its stated condition.', unit: 'dBm' },
	{ name: 'Receiver sensitivity', definition: 'Receiver sensitivity stated in the manufacturer datasheet, always read together with its stated data-rate or modulation condition.', unit: 'dBm' },
	{ name: 'Range class', definition: 'Manufacturer-stated range, recorded only together with its stated conditions (line of sight, antenna, environment). Unconditioned range claims are not recorded.' },
	{ name: 'I/O counts', definition: 'Counts of discrete inputs/outputs, analog inputs/outputs, relay outputs and pulse inputs fitted to the product, per the manufacturer source.' },
	{ name: 'Upstream interfaces', definition: 'Host-side interfaces and protocols (Ethernet, Modbus TCP/RTU, OPC UA, MQTT, HART-IP and similar) as stated by the manufacturer.' },
	{ name: 'Power supply', definition: 'Supply voltage range or power source (including PoE and battery) as stated by the manufacturer.' },
	{ name: 'Ingress rating', definition: 'Enclosure ingress protection rating (IP code) as stated by the manufacturer.' },
	{ name: 'Operating temperature', definition: 'Rated operating temperature range as stated by the manufacturer.' },
	{ name: 'Certifications', definition: 'Radio approvals and hazardous-area certifications as stated by the manufacturer, in the source wording.' },
];

export function buildDatasetNode(records: ProductRecord[]) {
	const latest = records.length
		? new Date(Math.max(...records.map((record) => record.dateChecked.getTime())))
				.toISOString()
				.slice(0, 10)
		: undefined;
	return {
		'@context': 'https://schema.org',
		'@type': 'Dataset',
		'@id': `${brand.siteUrl}/product-families/#dataset`,
		name: 'Industrial Wireless I/O Product Database',
		description:
			'Manufacturer-sourced specifications for industrial wireless gateways, adapters, I/O modules, cellular routers and LoRaWAN gateways: radio protocol, frequency band, transmit power, receiver sensitivity, I/O counts, upstream interfaces, power supply, ingress rating and certifications. Every value is transcribed from the manufacturer datasheet or official product documentation linked from each record; values that cannot be traced to a primary source are left out.',
		url: `${brand.siteUrl}/product-families/`,
		creator: { '@id': `${brand.siteUrl}/#organization` },
		publisher: { '@id': `${brand.siteUrl}/#organization` },
		inLanguage: 'en-US',
		...(latest ? { dateModified: latest } : {}),
		license: `${brand.siteUrl}/terms-of-use/`,
		usageInfo:
			'Data transcribed from publicly available manufacturer datasheets and product documentation; cite the manufacturer source linked from each product record when reusing a figure. Product names and trademarks belong to their respective manufacturers.',
		variableMeasured: DATASET_VARIABLES.map((variable) => ({
			'@type': 'PropertyValueSpecification',
			name: variable.name,
			description: variable.definition,
			...(variable.unit ? { unitText: variable.unit } : {}),
		})),
	};
}

/** Schema.org Product node for an indexable product page, sourced fields only. */
export function buildProductNode(record: ProductRecord) {
	const url = `${brand.siteUrl}${productPath(record)}`;
	const properties: { '@type': string; name: string; value: string }[] = [];
	const add = (name: string, value: string | number | null | undefined) => {
		if (value != null && value !== '') properties.push({ '@type': 'PropertyValue', name, value: String(value) });
	};
	add('Radio protocol', record.protocols.map(protocolLabel).join(', '));
	add('Frequency band', record.frequencyBands.join(', '));
	add('Transmit power (dBm)', record.txPowerDbm);
	add('Receiver sensitivity (dBm)', record.rxSensitivityDbm);
	add('I/O', ioSummary(record));
	add('Upstream interfaces', record.upstreamInterfaces.join(', '));
	add('Power supply', record.powerSupply);
	add('Ingress rating', record.ipRating);
	add('Operating temperature', record.operatingTemp);
	add('Hazardous area rating', record.hazardousArea);
	return {
		'@context': 'https://schema.org',
		'@type': 'Product',
		'@id': `${url}#product`,
		name: `${record.vendor} ${record.model}`,
		model: record.model,
		category: PRODUCT_TYPE_LABELS[record.productType],
		brand: { '@type': 'Brand', name: record.vendor },
		url,
		description: productSummary(record),
		additionalProperty: properties,
		isRelatedTo: record.protocols
			.filter((slug) => ['wirelesshart', 'isa100', 'io-link-wireless', 'lorawan'].includes(slug))
			.map((slug) => ({ '@id': `${brand.siteUrl}/protocols/${slug}/#webpage` })),
		subjectOf: { '@type': 'TechArticle', url: record.sourceUrl, name: record.sourceDocId ?? 'Manufacturer source document' },
	};
}
