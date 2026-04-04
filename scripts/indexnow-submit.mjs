import { execFileSync } from 'node:child_process';
import { siteMeta } from '../src/utils/site-meta.mjs';

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

function docPathToUrl(filePath) {
	if (!filePath.startsWith('src/content/docs/')) return undefined;

	const relative = filePath
		.replace(/^src\/content\/docs\//, '')
		.replace(/\.mdx?$/, '')
		.replace(/\/index$/, '');

	if (!relative || relative === 'index') {
		return `${siteMeta.siteUrl}/`;
	}

	return `${siteMeta.siteUrl}/${relative}/`;
}

async function submit(urlList) {
	const response = await fetch('https://api.indexnow.org/indexnow', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
		body: JSON.stringify({
			host: siteMeta.domain,
			key: siteMeta.indexNowKey,
			keyLocation: `${siteMeta.siteUrl}/${siteMeta.indexNowKey}.txt`,
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
		target.startsWith('http') ? target : new URL(target, `${siteMeta.siteUrl}/`).toString()
	);
} else if (useAll) {
	urls = listFiles(['ls-files', 'src/content/docs']).map(docPathToUrl).filter(Boolean);
} else {
	urls = listFiles(['diff', '--name-only', '--diff-filter=AMR', range, '--', 'src/content/docs'])
		.map(docPathToUrl)
		.filter(Boolean);
}

urls = Array.from(new Set(urls));

if (!urls.length) {
	console.log(`No public URLs found for IndexNow submission in ${siteMeta.domain}.`);
	process.exit(0);
}

await submit(urls);
console.log(`Submitted ${urls.length} URL(s) to IndexNow for ${siteMeta.domain}.`);
