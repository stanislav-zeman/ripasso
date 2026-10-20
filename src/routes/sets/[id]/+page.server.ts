import { redirect } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth.ts';
import { copySet, deleteSet, getOwnedSet } from '#lib/server/sets.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	copy: async ({ locals, params, url }) => {
		const user = requireUser(locals, url);
		const id = await copySet(params.id, user.id);
		redirect(303, `/sets/${id}/edit`);
	},
	delete: async ({ locals, params, url }) => {
		const user = requireUser(locals, url);
		await getOwnedSet(params.id, user.id);
		await deleteSet(params.id);
		redirect(303, '/');
	}
};
