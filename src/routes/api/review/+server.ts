import { error, json } from '@sveltejs/kit';
import { requireApiUser } from '#lib/server/auth.ts';
import { reviewCard, Rating } from '#lib/server/srs.ts';
import type { RequestHandler } from './$types';

const GRADES = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = requireApiUser(locals);
	const { cardId, rating } = await request.json();
	if (typeof cardId !== 'string' || !GRADES.includes(rating)) error(400, 'Invalid review');
	const next = await reviewCard(user.id, cardId, rating);
	return json({ due: next.due, state: next.state });
};
