import { describe, expect, it } from 'vitest';
import { initialQueue, ratingFor, requeue } from './learn';
import { Rating } from './api';

const card = (id: string, state = 0) => ({
	id,
	term: id,
	definition: id,
	termLang: 'it',
	defLang: 'en',
	state
});

describe('learn queue', () => {
	it('starts new cards with multiple choice and known cards with writing', () => {
		const q = initialQueue([card('a', 0), card('b', 2)]);
		expect(q.map((i) => i.stage)).toEqual(['choice', 'write']);
	});

	it('requeues the current item a few places back', () => {
		const q = initialQueue(['a', 'b', 'c', 'd', 'e'].map((id) => card(id)));
		expect(requeue(q, q[0]).map((i) => i.card.id)).toEqual(['b', 'c', 'd', 'a', 'e']);
		expect(requeue(q.slice(0, 2), q[0]).map((i) => i.card.id)).toEqual(['b', 'a']);
	});

	it('rates answers', () => {
		const [fresh] = initialQueue([card('a', 2)]);
		expect(ratingFor('wrong', fresh, 1000)).toBe(Rating.Again);
		expect(ratingFor('accent', fresh, 1000)).toBe(Rating.Hard);
		expect(ratingFor('correct', fresh, 1000)).toBe(Rating.Easy);
		expect(ratingFor('correct', fresh, 9000)).toBe(Rating.Good);
		expect(ratingFor('correct', { ...fresh, misses: 1 }, 1000)).toBe(Rating.Hard);
	});
});
