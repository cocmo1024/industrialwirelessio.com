import fs from 'node:fs';
import path from 'node:path';

/**
 * Build reports — skeleton (blueprint Phase 0: URL 对照表生成、孤儿页
 * 报告、门控统计）. Plain Node, filesystem-based, no Astro imports:
 *
 *   node scripts/build-reports.mjs
 *
 * Outputs (reports/):
 *   url-manifest.json — every (page, locale) route the manifest
 *     generates, with its indexability class. This is the seed of the
 *     Phase 4 cutover URL对照表 (old URL → new state).
 *   orphan-report.json — content pages with fewer than 3 inbound
 *     links from other pages' bodies (blueprint §7.3 acceptance:
 *     every indexable page needs >= 3 inbound links and must be
 *     reachable from home in <= 3 clicks once data-driven link zones
 *     land in Phase 1+; in Phase 0 this is a baseline measurement).
 *   gate-stats.json — record/page counts: content pages per locale,
 *     protocol/product data records (data layer, Phase 1/2), and the
 *     indexable vs noindex split.
 */
const root = process.cwd();
const contentDir = path.join(root, 'src', 'content', 'pages');
const reportsDir = path.join(root, 'reports');

const NOINDEX_SLUGS = new Set([
	'privacy',
	'terms-of-use',
	'disclaimer',
	'advertising',
	'affiliate-disclosure',
]);

function walk(dir) {
	if (!fs.existsSync(dir)) return [];
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walk(full);
		return entry.isFile() && /\.mdx?$/.test(entry.name) ? [full] : [];
	});
}

function parseRoute(file) {
	const rel = path.relative(contentDir, file).replace(/\\/g, '/');
	const match = rel.match(/^([a-z]{2})\/(.+)\.mdx?$/);
	if (!match) return null;
	const [, locale, rest] = match;
	const slug = rest.replace(/\/index$/, '') === 'index' ? '' : rest.replace(/\/index$/, '');
	const urlPath =
		locale === 'en' ? (slug ? `/${slug}/` : '/') : slug ? `/${locale}/${slug}/` : `/${locale}/`;
	return { locale, slug, path: urlPath, file: path.relative(root, file) };
}

const files = walk(contentDir);
const routes = files.map(parseRoute).filter(Boolean);
const bodies = new Map(
	files.map((file) => [path.relative(root, file), fs.readFileSync(file, 'utf8')]),
);

// Inbound-link approximation: count other pages whose body links to
// this page's path. Data-driven link zones (Phase 1+) are generated,
// not written in bodies, so treat this as a floor, not the verdict.
const orphanReport = routes
	.filter((route) => route.slug && !NOINDEX_SLUGS.has(route.slug.split('/').at(-1)))
	.map((route) => {
		let inbound = 0;
		for (const [file, body] of bodies) {
			if (file === route.file) continue;
			if (body.includes(`](${route.path})`) || body.includes(`href="${route.path}"`)) {
				inbound += 1;
			}
		}
		return { ...route, inboundLinks: inbound };
	})
	.filter((route) => route.inboundLinks < 3)
	.sort((a, b) => a.inboundLinks - b.inboundLinks || a.path.localeCompare(b.path));

function countDataRecords(dir) {
	const full = path.join(root, 'src', 'data', dir);
	if (!fs.existsSync(full)) return 0;
	return fs.readdirSync(full).filter((name) => /\.ya?ml$/.test(name)).length;
}

const perLocale = {};
for (const route of routes) {
	perLocale[route.locale] = (perLocale[route.locale] ?? 0) + 1;
}

const gateStats = {
	generatedAt: new Date().toISOString(),
	contentPages: { total: routes.length, perLocale },
	dataRecords: {
		protocols: countDataRecords('protocols'),
		products: countDataRecords('products'),
	},
	indexability: {
		indexable: routes.filter(
			(route) => !NOINDEX_SLUGS.has(route.slug.split('/').at(-1) ?? ''),
		).length,
		noindex: routes.filter((route) => NOINDEX_SLUGS.has(route.slug.split('/').at(-1) ?? ''))
			.length,
	},
	orphanPagesBelowInboundFloor: orphanReport.length,
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(
	path.join(reportsDir, 'url-manifest.json'),
	JSON.stringify(
		routes.map((route) => ({
			...route,
			indexable: !NOINDEX_SLUGS.has(route.slug.split('/').at(-1) ?? ''),
		})),
		null,
		2,
	),
);
fs.writeFileSync(path.join(reportsDir, 'orphan-report.json'), JSON.stringify(orphanReport, null, 2));
fs.writeFileSync(path.join(reportsDir, 'gate-stats.json'), JSON.stringify(gateStats, null, 2));

console.log(
	`Reports: ${routes.length} routes (${Object.entries(perLocale)
		.map(([locale, count]) => `${locale}:${count}`)
		.join(', ')}), ${gateStats.dataRecords.protocols} protocol records, ` +
		`${gateStats.dataRecords.products} product records, ` +
		`${orphanReport.length} pages below the inbound-link floor.`,
);
