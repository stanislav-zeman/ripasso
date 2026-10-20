import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';

/** Only allow redirects to paths on this site. */
export function safeNext(url: URL) {
	const next = url.searchParams.get('next') ?? '/';
	return next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

/**
 * Runs a Better Auth call. On failure returns `fail()` with a message, plus `keep` (form values
 * to show again). It must stay a real `fail()` result: a copy of it would count as a success.
 */
async function run(
	action: () => Promise<unknown>,
	fallback: string,
	keep: Record<string, string> = {}
) {
	try {
		await action();
	} catch (e) {
		if (e instanceof APIError) return fail(400, { message: e.message || fallback, ...keep });
		console.error(e);
		return fail(500, { message: 'Something went wrong, please try again.', ...keep });
	}
}

export async function signInEmail(event: RequestEvent) {
	const form = await event.request.formData();
	const email = String(form.get('email') ?? '');
	const password = String(form.get('password') ?? '');
	const failure = await run(
		() => auth.api.signInEmail({ body: { email, password } }),
		'Sign in failed',
		{ email }
	);
	if (failure) return failure;
	redirect(303, safeNext(event.url));
}

export async function signUpEmail(event: RequestEvent) {
	const form = await event.request.formData();
	const name = String(form.get('name') ?? '').trim();
	const email = String(form.get('email') ?? '');
	const password = String(form.get('password') ?? '');
	if (!name) return fail(400, { message: 'Please enter your name.', name, email });
	const failure = await run(
		() => auth.api.signUpEmail({ body: { name, email, password } }),
		'Sign up failed',
		{ name, email }
	);
	if (failure) return failure;
	redirect(303, safeNext(event.url));
}

export async function signInGoogle(event: RequestEvent) {
	// If Google sign-in fails or is cancelled, come back to this page (Better Auth adds `?error=…`).
	const back = new URL(event.url.pathname, event.url);
	const next = event.url.searchParams.get('next');
	if (next) back.searchParams.set('next', next);
	let url: string | undefined;
	const failure = await run(async () => {
		const result = await auth.api.signInSocial({
			body: {
				provider: 'google',
				callbackURL: safeNext(event.url),
				errorCallbackURL: back.pathname + back.search
			}
		});
		url = result.url;
	}, 'Google sign in failed');
	if (failure) return failure;
	if (!url) return fail(500, { message: 'Google sign in is not available.' });
	// SvelteKit 3 refuses external redirects unless the target origin is allowed explicitly.
	redirect(303, url, { external: ['https://accounts.google.com'] });
}
