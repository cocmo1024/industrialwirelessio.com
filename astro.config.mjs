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
				'Field-oriented reference system for remote telemetry, industrial wireless architecture, network paths, and site reliability.',
			tagline: 'Remote telemetry, field connectivity, network path choices, and reliability planning organized for real deployments.',
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
					items: [
						{
							label: 'Applications',
							autogenerate: { directory: 'applications' },
						},
						{
							label: 'Network Paths',
							autogenerate: { directory: 'network-paths' },
						},
						{
							label: 'Protocols',
							autogenerate: { directory: 'protocols' },
						},
						{
							label: 'Hardware',
							autogenerate: { directory: 'hardware' },
						},
						{
							label: 'Reliability',
							autogenerate: { directory: 'reliability' },
						},
					],
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
