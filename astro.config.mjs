// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	site: 'https://industrialwirelessio.com',
	trailingSlash: 'always',
	integrations: [
		starlight({
			title: 'Industrial Wireless I/O',
			description:
				'Field-oriented reference material for remote telemetry, industrial wireless architecture, network paths, and reliability planning.',
			tagline: 'Remote telemetry, field connectivity, and industrial wireless architecture organized for real deployments.',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/cocmo1024/industrialwirelessio.com',
				},
			],
			sidebar: [
				{
					label: 'Reference Areas',
					items: ['applications', 'network-paths', 'protocols', 'hardware', 'reliability'],
				},
				{
					label: 'Site',
					collapsed: true,
					items: ['about', 'contact', 'privacy', 'disclaimer'],
				},
			],
			customCss: ['./src/styles/global.css'],
			pagefind: true,
			favicon: '/favicon.svg',
			credits: false,
		}),
		sitemap(),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
