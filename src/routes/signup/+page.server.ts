import { redirect } from '@sveltejs/kit';
import { safeNext, signInGoogle, signUpEmail } from '#lib/server/auth-actions.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) redirect(302, safeNext(url));
};

export const actions: Actions = { email: signUpEmail, google: signInGoogle };
