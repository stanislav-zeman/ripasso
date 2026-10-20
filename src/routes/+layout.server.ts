import { googleEnabled } from '#lib/server/auth.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	const user = locals.user && {
		id: locals.user.id,
		name: locals.user.name,
		image: locals.user.image ?? null
	};
	return { user: user ?? null, googleEnabled };
};
