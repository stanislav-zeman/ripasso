import { listLibrary } from '#lib/server/sets.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { sets: [] };
	return { sets: await listLibrary(locals.user.id) };
};
