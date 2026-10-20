import { getSetForUser } from '#lib/server/sets.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, params }) => {
	return getSetForUser(params.id, locals.user?.id);
};
