import fs from 'node:fs';
import path from 'node:path';

/**
 * Link-graph report — blueprint §7.3 mechanism 2 acceptance, measured
 * on the built site (dist/), not on source text:
 *
 *   node scripts/link-graph-report.mjs
 *
 * For every indexable page in the sitemap it counts inbound links
 * from other built pages and the click depth from the homepage
 * (BFS over internal links). Acceptance: inbound >= 3 and depth
 * <= 3 for every indexable page. Exits non-zero when any page fails,
 * listing the failures — Phase 4 gate evidence.
 */
const root = process.cwd();
const dist = path.join(root, 'dist');

function walk(dir) {
	if (!fs.existsSync(dir)) return [];
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walk(full);
		return entry.isFile() && entry.name.endsWith('.html') ? [full] : [];
	});
}

function pagePathOf(file) {
	const rel = path.relative(dist, file).replaceAll(path.sep, '/');
	if (rel === 'index.html') return '/';
	return `/${rel.replace(/\/index\.html$/, '')}/`;
}

// Indexable set = sitemap URLs.
const sitemap = fs.readFileSync(path.join(dist, 'sitemap-0.xml'), 'utf8');
const indexable = new Set(
	[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
		(match) => new URL(match[1]).pathname,
	),
);

const outbound = new Map();
for (const file of walk(dist)) {
	const from = pagePathOf(file);
	const html = fs.readFileSync(file, 'utf8');
	const links = new Set();
	for (const match of html.matchAll(/href="([^"#]+)"/g)) {
		let href = match[1];
		if (href.startsWith('https://industrialwirelessio.com')) {
			href = new URL(href).pathname;
		}
		if (!href.startsWith('/')) continue;
		if (/\.(xml|txt|svg|png|ico|webmanifest)$/.test(href)) continue;
		if (!href.endsWith('/')) href = `${href}/`;
		if (href !== from) links.add(href);
	}
	outbound.set(from, links);
}

const inbound = new Map([...indexable].map((page) => [page, 0]));
for (const [, links] of outbound) {
	for (const target of links) {
		if (inbound.has(target)) inbound.set(target, inbound.get(target) + 1);
	}
}

// BFS depth from home.
const depth = new Map([['/', 0]]);
const queue = ['/'];
while (queue.length) {
	const current = queue.shift();
	for (const target of outbound.get(current) ?? []) {
		if (!depth.has(target)) {
			depth.set(target, depth.get(current) + 1);
			queue.push(target);
		}
	}
}

const failures = [];
const rows = [];
for (const page of [...indexable].sort()) {
	const inCount = inbound.get(page) ?? 0;
	const d = depth.get(page) ?? Infinity;
	rows.push({ page, inbound: inCount, depth: d === Infinity ? null : d });
	if (inCount < 3) failures.push(`${page}: inbound ${inCount} < 3`);
	if (d > 3) failures.push(`${page}: depth ${d === Infinity ? 'unreachable' : d} > 3`);
}

const report = {
	generatedFrom: 'dist/',
	indexablePages: indexable.size,
	minInbound: Math.min(...rows.map((row) => row.inbound)),
	maxDepth: Math.max(...rows.map((row) => row.depth ?? 99)),
	failures,
	rows,
};
fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(
	path.join(root, 'reports', 'link-graph.json'),
	`${JSON.stringify(report, null, 2)}\n`,
);
console.log(
	`Link graph: ${indexable.size} indexable pages, min inbound ${report.minInbound}, max depth ${report.maxDepth}, failures ${failures.length}.`,
);
for (const failure of failures) console.log(`- ${failure}`);
if (failures.length) process.exit(1);
