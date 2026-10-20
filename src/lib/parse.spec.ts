import { describe, expect, it } from 'vitest';
import { parseCards } from './parse';

describe('parseCards', () => {
	it('parses a Quizlet export (tab separated)', () => {
		const { cards, separator } = parseCards('il gatto\tthe cat\nla casa\tthe house\n');
		expect(separator).toBe('tab');
		expect(cards).toEqual([
			{ term: 'il gatto', definition: 'the cat' },
			{ term: 'la casa', definition: 'the house' }
		]);
	});

	it('detects dash-separated lines and keeps hyphens inside words', () => {
		const { cards, separator } = parseCards('l’aria-condizionata - air conditioning\nperché – why');
		expect(separator).toBe('dash');
		expect(cards).toEqual([
			{ term: 'l’aria-condizionata', definition: 'air conditioning' },
			{ term: 'perché', definition: 'why' }
		]);
	});

	it('only splits on the first comma', () => {
		const { cards } = parseCards('mangiare, to eat, to dine', 'comma');
		expect(cards).toEqual([{ term: 'mangiare', definition: 'to eat, to dine' }]);
	});

	it('skips blank lines and reports lines without a separator', () => {
		const { cards, skipped } = parseCards('\r\nciao\thello\r\n\r\njust a word\n');
		expect(cards).toHaveLength(1);
		expect(skipped).toEqual(['just a word']);
	});
});
