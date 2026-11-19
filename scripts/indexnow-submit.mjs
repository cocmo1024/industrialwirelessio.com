import { execFileSync } from 'node:child_process';

// Ported from the legacy stack (blueprint §6.4: key + script carry
// over unchanged in behavior). The canonical values live in
// src/data/brand.ts (single source of truth) and in the key file
// public/a435a92c-80e4-4570-9d7f-96304231a2f2.txt — plain Node cannot
// import the .ts module, so the three constants are mirrored here.
// KEEP IN SYNC with src/data/brand.ts.
const SITE = {
	domain: 'industrialwirelessio.com',
	siteUrl: 'https://industrialwirelessio.com',
	indexNowKey: 'a435a92c-80e4-4570-9d7f-96304231a2f2',
};

const args = process.argv.slice(2);
const manualTargets = args.filter((value) => value.startsWith('http') || value.startsWith('/'));
const useAll = args.includes('--all');
const range = args.find((value) => value.startsWith('--range='))?.slice(8) ?? 'HEAD~1..HEAD';

function listFiles(commandArgs) {
	const output = execFileSync('git', commandArgs, {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'ignore'],
	});
	return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

/**
 * Map a content file to its public URL under the manifest routing
 * rules (blueprint §5.1): src/content/pages/<locale>/<path>.mdx —
 * English at the root, other locales prefixed, and only for files
 * that exist (an existing file IS a generated route).
 */
function docPathToUrl(filePath) {
	const match = filePath.match(/^src\/content\/pages\/([a-z]{2})\/(.+)\.mdx?$/);
	if (!match) return undefined;
	const [, locale, rest] = match;
	const slug = rest.replace(/\/index$/, '') === 'index' ? '' : rest.replace(/\/index$/, '');
	if (locale === 'en') {
		return slug ? `${SITE.siteUrl}/${slug}/` : `${SITE.siteUrl}/`;
	}
	return slug ? `${SITE.siteUrl}/${locale}/${slug}/` : `${SITE.siteUrl}/${locale}/`;
}

async function submit(urlList) {
	const response = await fetch('https://api.indexnow.org/indexnow', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
		body: JSON.stringify({
			host: SITE.domain,
			key: SITE.indexNowKey,
			keyLocation: `${SITE.siteUrl}/${SITE.indexNowKey}.txt`,
			urlList,
		}),
	});

	if (!response.ok) {
		const details = await response.text();
		throw new Error(`IndexNow request failed (${response.status}): ${details}`);
	}
}

let urls;

if (manualTargets.length) {
	urls = manualTargets.map((target) =>
		target.startsWith('http') ? target : new URL(target, `${SITE.siteUrl}/`).toString()
	);
} else if (useAll) {
	urls = listFiles(['ls-files', 'src/content/pages']).map(docPathToUrl).filter(Boolean);
} else {
	urls = listFiles(['diff', '--name-only', '--diff-filter=AMR', range, '--', 'src/content/pages'])
		.map(docPathToUrl)
		.filter(Boolean);
}

if (!urls.length) {
	console.log('IndexNow: no URLs to submit.');
} else {
	await submit(urls);
	console.log(`IndexNow: submitted ${urls.length} URL(s).`);
}
