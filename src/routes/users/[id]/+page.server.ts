import { getPublicProfile } from '#lib/server/sets.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { profile, sets } = await getPublicProfile(params.id);
	return { profile, sets, isMe: locals.user?.id === profile.id };
};
