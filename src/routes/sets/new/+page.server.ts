import { redirect } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth.ts';
import { readSetForm } from '#lib/server/set-form.ts';
import { createSet } from '#lib/server/sets.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	requireUser(locals, url);
};

export const actions: Actions = {
	default: async ({ locals, request, url }) => {
		const user = requireUser(locals, url);
		const result = await readSetForm(request);
		if (result.error) return result.error;
		const id = await createSet(user.id, result.input, result.cards);
		redirect(303, `/sets/${id}`);
	}
};
