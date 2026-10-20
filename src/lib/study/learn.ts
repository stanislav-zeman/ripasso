import { Rating, type Grade } from './api';
import type { Verdict } from '#lib/grade.ts';

export interface LearnCard {
	id: string;
	term: string;
	definition: string;
	termLang: string;
	defLang: string;
	/** ts-fsrs state: 0 New, 1 Learning, 2 Review, 3 Relearning. */
	state: number;
}

export interface LearnItem {
	card: LearnCard;
	stage: 'choice' | 'write';
	misses: number;
}

/** How far back in the queue a card goes after being answered, so it isn't asked twice in a row. */
export const REQUEUE_GAP = 3;

export function initialQueue(cards: LearnCard[]): LearnItem[] {
	// New cards start with an easier multiple-choice question before having to type them.
	return cards.map((card) => ({ card, stage: card.state === 0 ? 'choice' : 'write', misses: 0 }));
}

export function requeue(queue: LearnItem[], item: LearnItem) {
	const rest = queue.slice(1);
	rest.splice(Math.min(REQUEUE_GAP, rest.length), 0, item);
	return rest;
}

/** Maps a typed answer to an FSRS rating. Quick, first-try answers to known cards count as Easy. */
export function ratingFor(verdict: Verdict, item: LearnItem, ms: number): Grade {
	if (verdict === 'wrong') return Rating.Again;
	if (verdict === 'accent' || item.misses > 0) return Rating.Hard;
	if (item.card.state === 2 && ms < 4000) return Rating.Easy;
	return Rating.Good;
}
