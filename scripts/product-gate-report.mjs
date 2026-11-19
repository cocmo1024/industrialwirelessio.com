import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

/**
 * Product gate report — the §4.3 indexability verdict per record.
 *
 * Plain Node mirror of src/utils/products.ts `productGate` (keep the
 * two in step; the TS module is canonical, this script exists so a
 * batch can be audited without a build). Outputs
 * reports/product-gate.json and prints the batch's three numbers:
 * records / full pages / rows-only.
 */
const root = process.cwd();
const productsDir = path.join(root, 'src', 'data', 'products');
const reportsDir = path.join(root, 'reports');

const IO_KEYS = ['di', 'do', 'ai', 'ao', 'relay', 'pulse'];

function gate(record) {
	const identity = Boolean(record.vendor && record.model && record.productType);
	const wirelessChecks = [
		(record.protocols ?? []).length > 0,
		(record.frequencyBands ?? []).length > 0,
		record.txPowerDbm != null,
		record.rxSensitivityDbm != null,
		record.rangeClass != null,
		record.antenna != null,
	];
	const wirelessFieldsPopulated = wirelessChecks.filter(Boolean).length;
	const wirelessIdentity =
		wirelessFieldsPopulated >= 3 &&
		(record.protocols ?? []).length > 0 &&
		(record.frequencyBands ?? []).length > 0;
	const ioCounts = IO_KEYS.map((key) => record.io?.[key]).filter((value) => value != null);
	const ioSubstance = ioCounts.length >= 1 || (record.upstreamInterfaces ?? []).length >= 2;
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
		(record.certifications ?? []).length +
		(record.hazardousArea ? 1 : 0);
	const anatomySubstance = wirelessIdentity && specRows >= 1;
	return {
		indexable: identity && wirelessIdentity && ioSubstance && sourceBinding && anatomySubstance,
		identity,
		wirelessIdentity,
		wirelessFieldsPopulated,
		ioSubstance,
		sourceBinding,
		anatomySubstance,
	};
}

const files = fs.existsSync(productsDir)
	? fs.readdirSync(productsDir).filter((name) => /\.ya?ml$/.test(name)).sort()
	: [];

const results = files.map((file) => {
	const record = parse(fs.readFileSync(path.join(productsDir, file), 'utf8'));
	return { file, slug: record.slug, vendor: record.vendor, model: record.model, ...gate(record) };
});

const indexable = results.filter((result) => result.indexable);
fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(
	path.join(reportsDir, 'product-gate.json'),
	JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2),
);

console.log(
	`Product gate: ${results.length} records, ${indexable.length} full pages, ` +
		`${results.length - indexable.length} rows-only.`,
);
for (const result of results.filter((item) => !item.indexable)) {
	const failed = ['identity', 'wirelessIdentity', 'ioSubstance', 'sourceBinding', 'anatomySubstance']
		.filter((key) => !result[key])
		.join(', ');
	console.log(`- rows-only: ${result.slug} (failed: ${failed}; wireless fields ${result.wirelessFieldsPopulated}/6)`);
}
