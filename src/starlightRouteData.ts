import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

// The site home (/) and the research index (/research/) are top-level landing
// pages — drop the left sidebar so the Page theme renders its own full-width,
// no-sidebar layout for them (which also removes the mobile hamburger). The
// report entry and all its sub-pages keep the sidebar.
const NO_SIDEBAR = new Set(['/', '/research', '/research/']);

export const onRequest = defineRouteMiddleware((context) => {
	if (NO_SIDEBAR.has(context.url.pathname)) {
		context.locals.starlightRoute.sidebar = [];
	}
});
