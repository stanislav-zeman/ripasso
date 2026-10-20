import { dev } from '$app/env';
import { afterNavigate } from '$app/navigation';
import { page } from '$app/state';
import { inject, pageview } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

/**
 * Vercel Web Analytics and Speed Insights. Their `/sveltekit` entry points import
 * `$app/environment` and `$app/stores`, which SvelteKit 3 removed, so this does the same with the
 * framework-agnostic APIs. Both report routes as ids (`/sets/[id]`), so every set counts as one page.
 *
 * Must be called while the root layout initialises (it registers `afterNavigate`).
 */
export function injectVercelInsights() {
	inject({
		mode: dev ? 'development' : 'production',
		framework: 'sveltekit',
		disableAutoTrack: true
	});
	// Returns null during SSR; the script switches to its debug build in development by itself.
	const speedInsights = injectSpeedInsights({ framework: 'sveltekit' });

	afterNavigate(({ to }) => {
		// On the first page load (`type: 'enter'`) SvelteKit 3 reports `to.route.id` as null,
		// but the page state already knows the route.
		const route = to?.route.id ?? page.route.id;
		if (!to || !route) return;
		pageview({ route, path: to.url.pathname });
		speedInsights?.setRoute(route);
	});
}
