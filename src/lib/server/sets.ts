import { error } from '@sveltejs/kit';
import {
	and,
	asc,
	count,
	desc,
	eq,
	inArray,
	isNotNull,
	like,
	lte,
	ne,
	notInArray,
	or,
	sql
} from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import {
	card,
	cardProgress,
	studySet,
	user,
	type StudySet,
	type Visibility
} from '#lib/server/db/schema.ts';
import { MAX_CARDS, type ParsedCard } from '#lib/parse.ts';
import type { Level } from '#lib/levels.ts';

export interface CardInput extends ParsedCard {
	id?: string;
}

export interface SetInput {
	title: string;
	description: string;
	termLang: string;
	defLang: string;
	level: Level | null;
	visibility: Visibility;
}

export function canRead(set: StudySet, userId: string | undefined) {
	return set.visibility !== 'private' || set.ownerId === userId;
}

/** Loads a set the user may read, with its cards and the user's progress on them. */
export async function getSetForUser(setId: string, userId: string | undefined) {
	const [row] = await db
		.select({ set: studySet, ownerName: user.name })
		.from(studySet)
		.innerJoin(user, eq(user.id, studySet.ownerId))
		.where(eq(studySet.id, setId));
	if (!row || !canRead(row.set, userId)) error(404, 'Set not found');

	const cards = await db
		.select({
			id: card.id,
			term: card.term,
			definition: card.definition,
			position: card.position,
			starred: sql<boolean>`coalesce(${cardProgress.starred}, 0)`.mapWith(Boolean),
			state: sql<number>`coalesce(${cardProgress.state}, 0)`.mapWith(Number),
			due: cardProgress.due
		})
		.from(card)
		.leftJoin(
			cardProgress,
			and(eq(cardProgress.cardId, card.id), eq(cardProgress.userId, userId ?? ''))
		)
		.where(eq(card.setId, setId))
		.orderBy(asc(card.position));

	return { set: row.set, ownerName: row.ownerName, isOwner: row.set.ownerId === userId, cards };
}

export type SetWithCards = Awaited<ReturnType<typeof getSetForUser>>;
export type StudyCard = SetWithCards['cards'][number];

/** Loads a set the user owns, or fails with 404/403. */
export async function getOwnedSet(setId: string, userId: string) {
	const [set] = await db.select().from(studySet).where(eq(studySet.id, setId));
	if (!set) error(404, 'Set not found');
	if (set.ownerId !== userId) error(403, 'Only the owner can change this set');
	return set;
}

const cardCount = db
	.select({ setId: card.setId, cards: count().as('cards') })
	.from(card)
	.groupBy(card.setId)
	.as('card_count');

/** The user's own sets plus other people's sets they have studied. */
export async function listLibrary(userId: string) {
	const now = new Date();
	const due = db
		.select({ setId: card.setId, due: count().as('due') })
		.from(cardProgress)
		.innerJoin(card, eq(card.id, cardProgress.cardId))
		.where(and(eq(cardProgress.userId, userId), lte(cardProgress.due, now)))
		.groupBy(card.setId)
		.as('due_count');

	const studied = db
		.selectDistinct({ setId: card.setId })
		.from(cardProgress)
		.innerJoin(card, eq(card.id, cardProgress.cardId))
		.where(eq(cardProgress.userId, userId));

	return db
		.select({
			id: studySet.id,
			title: studySet.title,
			termLang: studySet.termLang,
			level: studySet.level,
			description: studySet.description,
			visibility: studySet.visibility,
			ownerId: studySet.ownerId,
			ownerName: user.name,
			updatedAt: studySet.updatedAt,
			cards: sql<number>`coalesce(${cardCount.cards}, 0)`.mapWith(Number),
			due: sql<number>`coalesce(${due.due}, 0)`.mapWith(Number)
		})
		.from(studySet)
		.innerJoin(user, eq(user.id, studySet.ownerId))
		.leftJoin(cardCount, eq(cardCount.setId, studySet.id))
		.leftJoin(due, eq(due.setId, studySet.id))
		.where(
			or(
				eq(studySet.ownerId, userId),
				and(ne(studySet.visibility, 'private'), inArray(studySet.id, studied))
			)
		)
		.orderBy(desc(studySet.updatedAt));
}

export interface PublicFilters {
	lang?: string;
	level?: Level;
	ownerId?: string;
}

export async function listPublicSets(
	query: string,
	{ lang, level, ownerId }: PublicFilters = {},
	limit = 50
) {
	const q = `%${query.trim().replace(/[%_]/g, '')}%`;
	return db
		.select({
			id: studySet.id,
			title: studySet.title,
			termLang: studySet.termLang,
			level: studySet.level,
			description: studySet.description,
			ownerId: studySet.ownerId,
			ownerName: user.name,
			updatedAt: studySet.updatedAt,
			cards: sql<number>`coalesce(${cardCount.cards}, 0)`.mapWith(Number)
		})
		.from(studySet)
		.innerJoin(user, eq(user.id, studySet.ownerId))
		.leftJoin(cardCount, eq(cardCount.setId, studySet.id))
		.where(
			and(
				eq(studySet.visibility, 'public'),
				ownerId ? eq(studySet.ownerId, ownerId) : undefined,
				lang ? eq(studySet.termLang, lang) : undefined,
				level ? eq(studySet.level, level) : undefined,
				query.trim() ? or(like(studySet.title, q), like(studySet.description, q)) : undefined
			)
		)
		.orderBy(desc(studySet.updatedAt))
		.limit(limit);
}

/** A user's public profile: only their name, photo and public sets, never their email. */
export async function getPublicProfile(userId: string) {
	const [profile] = await db
		.select({ id: user.id, name: user.name, image: user.image, createdAt: user.createdAt })
		.from(user)
		.where(eq(user.id, userId));
	if (!profile) error(404, 'User not found');
	const sets = await listPublicSets('', { ownerId: userId }, 500);
	return { profile, sets };
}

/** Languages that have public sets (at `level`, if given), most sets first. */
export async function listPublicLanguages(level?: Level) {
	return db
		.select({ code: studySet.termLang, sets: count() })
		.from(studySet)
		.where(and(eq(studySet.visibility, 'public'), level ? eq(studySet.level, level) : undefined))
		.groupBy(studySet.termLang)
		.orderBy(desc(count()));
}

/** Levels that have public sets (in `lang`, if given). */
export async function listPublicLevels(lang?: string) {
	const rows = await db
		.select({ level: studySet.level, sets: count() })
		.from(studySet)
		.where(
			and(
				eq(studySet.visibility, 'public'),
				isNotNull(studySet.level),
				lang ? eq(studySet.termLang, lang) : undefined
			)
		)
		.groupBy(studySet.level);
	return rows as { level: Level; sets: number }[];
}

export async function createSet(ownerId: string, input: SetInput, cards: ParsedCard[]) {
	const id = crypto.randomUUID();
	await db.batch([
		db.insert(studySet).values({ id, ownerId, ...input }),
		...chunk(cards.slice(0, MAX_CARDS), 200).map((part, i) =>
			db.insert(card).values(
				part.map((c, j) => ({
					setId: id,
					term: c.term,
					definition: c.definition,
					position: i * 200 + j
				}))
			)
		)
	]);
	return id;
}

/**
 * Saves the set's metadata and card list. Cards keep their id (and so everyone's progress)
 * when edited; cards missing from `cards` are deleted.
 */
export async function updateSet(setId: string, input: SetInput, cards: CardInput[]) {
	const existing = await db.select({ id: card.id }).from(card).where(eq(card.setId, setId));
	const existingIds = new Set(existing.map((c) => c.id));
	const kept = cards.slice(0, MAX_CARDS).map((c, position) => ({
		...c,
		id: c.id && existingIds.has(c.id) ? c.id : undefined,
		position
	}));
	const keptIds = kept.flatMap((c) => (c.id ? [c.id] : []));

	await db.batch([
		db
			.update(studySet)
			.set({ ...input, updatedAt: new Date() })
			.where(eq(studySet.id, setId)),
		db
			.delete(card)
			.where(and(eq(card.setId, setId), keptIds.length ? notInArray(card.id, keptIds) : undefined)),
		...kept
			.filter((c) => c.id)
			.map((c) =>
				db
					.update(card)
					.set({ term: c.term, definition: c.definition, position: c.position })
					.where(eq(card.id, c.id!))
			),
		...chunk(
			kept.filter((c) => !c.id),
			200
		).map((part) =>
			db
				.insert(card)
				.values(
					part.map((c) => ({ setId, term: c.term, definition: c.definition, position: c.position }))
				)
		)
	]);
}

export async function deleteSet(setId: string) {
	await db.delete(studySet).where(eq(studySet.id, setId));
}

export async function copySet(setId: string, userId: string) {
	const { set, cards } = await getSetForUser(setId, userId);
	return createSet(
		userId,
		{
			title: set.ownerId === userId ? `${set.title} (copy)` : set.title,
			description: set.description,
			termLang: set.termLang,
			defLang: set.defLang,
			level: set.level,
			visibility: 'private'
		},
		cards
	);
}

function chunk<T>(items: T[], size: number): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
	return out;
}
