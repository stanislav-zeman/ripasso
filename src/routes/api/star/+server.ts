import { error, json } from '@sveltejs/kit';
import { requireApiUser } from '#lib/server/auth.ts';
import { setStarred } from '#lib/server/srs.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = requireApiUser(locals);
	const { cardId, starred } = await request.json();
	if (typeof cardId !== 'string' || typeof starred !== 'boolean') error(400, 'Invalid request');
	await setStarred(user.id, cardId, starred);
	return json({ starred });
};
