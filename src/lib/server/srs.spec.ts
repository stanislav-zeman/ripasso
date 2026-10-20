import { describe, expect, it, vi } from 'vitest';
import { Rating, State } from 'ts-fsrs';

// srs.ts imports the DB client, which needs SvelteKit's env; scheduling itself is pure.
vi.mock('#lib/server/db/index.ts', () => ({ db: {} }));
vi.mock('#lib/server/sets.ts', () => ({ canRead: () => true }));

const { schedule } = await import('./srs');

describe('schedule', () => {
	const now = new Date('2026-01-01T12:00:00Z');

	it('schedules Again sooner than Good, and Good sooner than Easy', () => {
		const again = schedule(null, Rating.Again, now);
		const good = schedule(null, Rating.Good, now);
		const easy = schedule(null, Rating.Easy, now);
		expect(again.due.getTime()).toBeLessThan(good.due.getTime());
		expect(good.due.getTime()).toBeLessThan(easy.due.getTime());
		expect(easy.state).toBe(State.Review);
	});

	it('counts a lapse when a review card is forgotten', () => {
		let p = schedule(null, Rating.Easy, now);
		p = schedule(p, Rating.Again, p.due);
		expect(p.lapses).toBe(1);
		expect(p.state).toBe(State.Relearning);
	});
});
