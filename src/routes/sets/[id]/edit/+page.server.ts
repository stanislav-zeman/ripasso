import { redirect } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth.ts';
import { readSetForm } from '#lib/server/set-form.ts';
import { getOwnedSet, updateSet } from '#lib/server/sets.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url, parent }) => {
	const user = requireUser(locals, url);
	await getOwnedSet(params.id, user.id);
	const { set, cards } = await parent();
	return { set, cards };
};

export const actions: Actions = {
	default: async ({ locals, request, params, url }) => {
		const user = requireUser(locals, url);
		await getOwnedSet(params.id, user.id);
		const result = await readSetForm(request);
		if (result.error) return result.error;
		await updateSet(params.id, result.input, result.cards);
		redirect(303, `/sets/${params.id}`);
	}
};
