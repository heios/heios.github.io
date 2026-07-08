// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import pagePlugin from '@pelagornis/page';
import starlightLinksValidator from 'starlight-links-validator';
import rehypeTooltips from './src/plugins/rehype-tooltips.mjs';

// The Page theme's footer copyright defaults to "© <year> Pelagornis Inc." (the
// theme author's placeholder). Override it via its documented escape hatch so the
// site carries the correct credit rather than the theme author's.
process.env.PAGE_FOOTER_TEXT ||= `© ${new Date().getFullYear()} heios`;

// https://astro.build/config
export default defineConfig({
	site: 'https://heios.github.io',
	markdown: {
		// Upgrade Markdown link titles into styled hover-cards (see the plugin).
		rehypePlugins: [rehypeTooltips],
	},
	integrations: [
		starlight({
			title: 'heios',
			plugins: [pagePlugin(), starlightLinksValidator()],
			// Wrap the Page theme's Hero to re-add Starlight's `#_top` skip-link
			// target, which the theme's Hero drops on splash pages (home + 404).
			// The Page plugin preserves user-set component overrides.
			components: { Hero: './src/components/Hero.astro' },
			// Empties the sidebar on the home + research index (see the file).
			routeMiddleware: './src/starlightRouteData.ts',
			customCss: ['./src/styles/custom.css'],
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/heios' },
			],
			sidebar: [
				{ label: 'Research', link: '/research/' },
				{
					label: 'Crediting AI in commits · 2026-07-08',
					items: [
						{ label: 'Report', link: '/research/2026-07-08/ai-commit-attribution/' },
						{ label: 'Glossary', link: '/research/2026-07-08/ai-commit-attribution/glossary/' },
						{
							label: 'Primary sources',
							items: [
								{
									autogenerate: {
										directory: 'research/2026-07-08/ai-commit-attribution/sources',
									},
								},
							],
						},
					],
				},
			],
		}),
	],
});
