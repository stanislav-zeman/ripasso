import {
	ORIGIN,
	BETTER_AUTH_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET
} from '$app/env/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { error, redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import { db } from '#lib/server/db/index.ts';

export const googleEnabled = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
	baseURL: ORIGIN,
	secret: BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	emailAndPassword: { enabled: true, minPasswordLength: 8 },
	socialProviders: googleEnabled
		? { google: { clientId: GOOGLE_CLIENT_ID!, clientSecret: GOOGLE_CLIENT_SECRET! } }
		: {},
	account: {
		// Signing in with Google using the same email as a password account links the two.
		accountLinking: { enabled: true, trustedProviders: ['google'] }
	},
	// Errors without a page to return to (e.g. an expired sign-in link) land on the login page
	// with `?error=…` instead of Better Auth's built-in error page.
	onAPIError: { errorURL: '/login' },
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});

/** Returns the signed-in user, or redirects to the login page. */
export function requireUser(locals: App.Locals, url?: URL) {
	if (!locals.user) {
		const next = url ? `?next=${encodeURIComponent(url.pathname + url.search)}` : '';
		redirect(302, `/login${next}`);
	}
	return locals.user;
}

/** Like `requireUser`, but for API endpoints, where a redirect makes no sense. */
export function requireApiUser(locals: App.Locals) {
	if (!locals.user) error(401, 'Not signed in');
	return locals.user;
}
