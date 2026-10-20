import { error } from '@sveltejs/kit';
import { and, asc, eq, isNull, lte, ne, or } from 'drizzle-orm';
import { createEmptyCard, fsrs, Rating, State, type Card as FsrsCard, type Grade } from 'ts-fsrs';
import { db } from '#lib/server/db/index.ts';
import { card, cardProgress, studySet, type CardProgress } from '#lib/server/db/schema.ts';
import { canRead } from '#lib/server/sets.ts';

export { Rating };

const scheduler = fsrs({ enable_fuzz: true });

type ProgressFields = Omit<CardProgress, 'userId' | 'cardId' | 'starred'>;

function toFsrs(p: ProgressFields): FsrsCard {
	return {
		due: p.due,
		stability: p.stability,
		difficulty: p.difficulty,
		elapsed_days: p.elapsedDays,
		scheduled_days: p.scheduledDays,
		learning_steps: p.learningSteps,
		reps: p.reps,
		lapses: p.lapses,
		state: p.state as State,
		last_review: p.lastReview ?? undefined
	};
}

function fromFsrs(c: FsrsCard): ProgressFields {
	return {
		due: c.due,
		stability: c.stability,
		difficulty: c.difficulty,
		elapsedDays: c.elapsed_days,
		scheduledDays: c.scheduled_days,
		learningSteps: c.learning_steps,
		reps: c.reps,
		lapses: c.lapses,
		state: c.state,
		lastReview: c.last_review ?? null
	};
}

/** Pure scheduling step: the card's next state after answering with `rating`. */
export function schedule(
	previous: ProgressFields | null,
	rating: Grade,
	now = new Date()
): ProgressFields {
	const current = previous ? toFsrs(previous) : createEmptyCard(now);
	return fromFsrs(scheduler.next(current, now, rating).card);
}

async function getReadableCard(cardId: string, userId: string) {
	const [row] = await db
		.select({ set: studySet })
		.from(card)
		.innerJoin(studySet, eq(studySet.id, card.setId))
		.where(eq(card.id, cardId));
	if (!row || !canRead(row.set, userId)) error(404, 'Card not found');
}

export async function reviewCard(userId: string, cardId: string, rating: Grade, now = new Date()) {
	await getReadableCard(cardId, userId);
	const [previous] = await db
		.select()
		.from(cardProgress)
		.where(and(eq(cardProgress.userId, userId), eq(cardProgress.cardId, cardId)));
	const next = schedule(previous ?? null, rating, now);
	await db
		.insert(cardProgress)
		.values({ userId, cardId, ...next })
		.onConflictDoUpdate({ target: [cardProgress.userId, cardProgress.cardId], set: next });
	return next;
}

export async function setStarred(userId: string, cardId: string, starred: boolean) {
	await getReadableCard(cardId, userId);
	await db
		.insert(cardProgress)
		.values({ userId, cardId, starred, due: new Date() })
		.onConflictDoUpdate({ target: [cardProgress.userId, cardProgress.cardId], set: { starred } });
}

/** Cards the user has started learning and that are due, across all readable sets. */
export async function getDueCards(userId: string, limit = 100) {
	return db
		.select({
			id: card.id,
			term: card.term,
			definition: card.definition,
			setId: card.setId,
			termLang: studySet.termLang,
			defLang: studySet.defLang,
			state: cardProgress.state
		})
		.from(cardProgress)
		.innerJoin(card, eq(card.id, cardProgress.cardId))
		.innerJoin(studySet, eq(studySet.id, card.setId))
		.where(
			and(
				eq(cardProgress.userId, userId),
				lte(cardProgress.due, new Date()),
				ne(cardProgress.state, State.New),
				or(ne(studySet.visibility, 'private'), eq(studySet.ownerId, userId))
			)
		)
		.orderBy(asc(cardProgress.due))
		.limit(limit);
}

/** Cards in a set the user has never answered (starring alone doesn't count). */
export async function countNewCards(userId: string, setId: string) {
	const rows = await db
		.select({ id: card.id })
		.from(card)
		.leftJoin(cardProgress, and(eq(cardProgress.cardId, card.id), eq(cardProgress.userId, userId)))
		.where(
			and(eq(card.setId, setId), or(isNull(cardProgress.cardId), eq(cardProgress.state, State.New)))
		);
	return rows.length;
}
