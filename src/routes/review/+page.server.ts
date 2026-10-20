import { requireUser } from '#lib/server/auth.ts';
import { getDueCards } from '#lib/server/srs.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals, url);
	return { cards: await getDueCards(user.id) };
};
