import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '#lib/server/auth.ts';

/** Only allow redirects to paths on this site. */
export function safeNext(url: URL) {
	const next = url.searchParams.get('next') ?? '/';
	return next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

async function run(action: () => Promise<unknown>, fallback: string) {
	try {
		await action();
	} catch (e) {
		if (e instanceof APIError) return fail(400, { message: e.message || fallback });
		console.error(e);
		return fail(500, { message: 'Something went wrong, please try again.' });
	}
}

export async function signInEmail(event: RequestEvent) {
	const form = await event.request.formData();
	const email = String(form.get('email') ?? '');
	const password = String(form.get('password') ?? '');
	const failure = await run(
		() => auth.api.signInEmail({ body: { email, password } }),
		'Sign in failed'
	);
	if (failure) return { ...failure, data: { ...failure.data, email } };
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
		'Sign up failed'
	);
	if (failure) return { ...failure, data: { ...failure.data, name, email } };
	redirect(303, safeNext(event.url));
}

export async function signInGoogle(event: RequestEvent) {
	let url: string | undefined;
	const failure = await run(async () => {
		const result = await auth.api.signInSocial({
			body: { provider: 'google', callbackURL: safeNext(event.url) }
		});
		url = result.url;
	}, 'Google sign in failed');
	if (failure) return failure;
	if (!url) return fail(500, { message: 'Google sign in is not available.' });
	// SvelteKit 3 refuses external redirects unless the target origin is allowed explicitly.
	redirect(303, url, { external: ['https://accounts.google.com'] });
}
