import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docsDir = path.join(root, 'src', 'content', 'docs');

const sitePages = new Set([
	'about.mdx',
	'contact.mdx',
	'privacy.mdx',
	'terms-of-use.mdx',
	'disclaimer.mdx',
	'editorial-policy.mdx',
	'advertising.mdx',
	'affiliate-disclosure.mdx',
	'editorial-desk.mdx',
	'review-desk.mdx',
]);

const searchFirstPatterns = [
	/high-value traffic/i,
	/search traffic/i,
	/traffic page/i,
	/long-term traffic/i,
	/created primarily to attract visits/i,
	/keyword-only/i,
];

const requiredMetadata = [
	'referenceType',
	'adProfile',
	'commercialIntent',
	'reviewCadence',
	'primaryKeyword',
	'searchIntent',
	'decisionStage',
	'targetRoles',
	'contentStatus',
	'contentCluster',
	'canonicalCluster',
	'pageType',
	'lifecycle',
	'refreshPriority',
	'authorKey',
	'editorKey',
	'lastReviewed',
	'problemSolved',
	'readerTakeaway',
];

function walk(dir) {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) return walk(fullPath);
		return entry.isFile() && entry.name.endsWith('.mdx') ? [fullPath] : [];
	});
}

function parseFrontmatter(text) {
	const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	return match ? match[1] : '';
}

function field(frontmatter, name) {
	const match = frontmatter.match(new RegExp(`^${name}:\\s*(.+?)\\s*$`, 'm'));
	return match ? match[1].replace(/^['"]|['"]$/g, '').trim() : '';
}

function has(frontmatter, name) {
	return new RegExp(`^${name}:`, 'm').test(frontmatter);
}

function bodyText(text) {
	return text
		.replace(/^---\r?\n[\s\S]*?\r?\n---/, '')
		.replace(/^import\s+.+$/gm, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\{[^}]+\}/g, ' ');
}

function wordCount(text) {
	return (bodyText(text).match(/\b[\w-]+\b/g) ?? []).length;
}

const blockers = [];
const warnings = [];

for (const file of walk(docsDir)) {
	const rel = path.relative(root, file).replaceAll(path.sep, '/');
	const text = fs.readFileSync(file, 'utf8');
	const frontmatter = parseFrontmatter(text);
	const title = field(frontmatter, 'title');
	const description = field(frontmatter, 'description');
	const pageType = field(frontmatter, 'pageType');
	const lifecycle = field(frontmatter, 'lifecycle');
	const contentCluster = field(frontmatter, 'contentCluster');
	const canonicalCluster = field(frontmatter, 'canonicalCluster');
	const isIndex = rel.endsWith('/index.mdx');
	const isSitePage = sitePages.has(path.basename(file));
	const isReferencePage = !isIndex && !isSitePage;
	const words = wordCount(text);

	if (!title) blockers.push(`${rel}: missing title`);
	if (!description) blockers.push(`${rel}: missing description`);
	for (const name of requiredMetadata) {
		if (!field(frontmatter, name) && !has(frontmatter, name)) {
			blockers.push(`${rel}: missing required metadata field ${name}`);
		}
	}
	if (title && title.length > 90) warnings.push(`${rel}: title is long (${title.length} chars)`);
	if (description && (description.length < 70 || description.length > 220)) {
		warnings.push(`${rel}: description length is ${description.length} chars`);
	}
	if (isReferencePage && words < 300) warnings.push(`${rel}: thin reference body (${words} words)`);
	if (pageType === 'hub' && lifecycle !== 'hub') warnings.push(`${rel}: hub page should set lifecycle: hub`);
	if (pageType !== 'hub' && lifecycle === 'hub' && !isIndex) warnings.push(`${rel}: non-hub page uses lifecycle: hub`);
	if (contentCluster && canonicalCluster && contentCluster !== canonicalCluster && pageType === 'hub') {
		warnings.push(`${rel}: hub has different contentCluster and canonicalCluster`);
	}

	for (const pattern of searchFirstPatterns) {
		if (pattern.test(text)) blockers.push(`${rel}: search-first phrasing matched ${pattern}`);
	}
}

console.log(`Search-quality audit scanned ${walk(docsDir).length} MDX pages.`);

if (warnings.length) {
	console.log(`Advisory warnings (${warnings.length}):`);
	for (const warning of warnings.slice(0, 80)) console.log(`- ${warning}`);
	if (warnings.length > 80) console.log(`- ... ${warnings.length - 80} more warnings`);
}

if (blockers.length) {
	console.error(`Blocking issues (${blockers.length}):`);
	for (const blocker of blockers) console.error(`- ${blocker}`);
	process.exit(1);
}

console.log('Search-quality audit passed: required metadata and search-quality blockers are clean.');
