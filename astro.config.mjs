// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import { siteMeta } from './src/utils/site-meta.mjs';

export default defineConfig({
	site: siteMeta.siteUrl,
	trailingSlash: 'always',
	integrations: [
		starlight({
			title: siteMeta.name,
			description: siteMeta.description,
			tagline: siteMeta.tagline,
			lastUpdated: true,
			social: [
				{
					icon: 'x.com',
					label: 'X',
					href: 'https://x.com/oocxx_com',
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
							label: 'Product Families',
							autogenerate: { directory: 'product-families' },
						},
						{
							label: 'Vendors',
							autogenerate: { directory: 'vendors' },
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
					items: [
						'about',
						'contact',
						'privacy',
						'terms-of-use',
						'disclaimer',
						'editorial-policy',
						'advertising',
						'affiliate-disclosure',
					],
				},
			],
			customCss: ['./src/styles/global.css'],
			pagefind: true,
			favicon: siteMeta.faviconPath,
			credits: false,
			components: {
				Head: './src/components/Head.astro',
				PageSidebar: './src/components/PageSidebar.astro',
				Footer: './src/components/Footer.astro',
			},
		}),
		sitemap(),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
