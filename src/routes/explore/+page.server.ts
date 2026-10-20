import { listPublicSets } from '#lib/server/sets.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	return { q, sets: await listPublicSets(q) };
};
