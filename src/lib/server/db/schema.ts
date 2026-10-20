import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';
import { LEVELS } from '../../levels';

export * from './auth.schema';

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const VISIBILITIES = ['private', 'unlisted', 'public'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const studySet = sqliteTable(
	'study_set',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		ownerId: text('owner_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		description: text('description').notNull().default(''),
		/** The set's "Language": the foreign language it teaches. Terms are written in it. */
		termLang: text('term_lang').notNull().default('it'),
		/** The language definitions (translations) are written in. */
		defLang: text('def_lang').notNull().default('en'),
		/** Optional CEFR level (A1–C2). */
		level: text('level', { enum: LEVELS }),
		visibility: text('visibility', { enum: VISIBILITIES }).notNull().default('private'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(now).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.default(now)
			.$onUpdate(() => new Date())
			.notNull()
	},
	(t) => [
		index('study_set_owner_idx').on(t.ownerId),
		// Explore lists public sets, optionally of one language.
		index('study_set_visibility_lang_idx').on(t.visibility, t.termLang)
	]
);

export const card = sqliteTable(
	'card',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		setId: text('set_id')
			.notNull()
			.references(() => studySet.id, { onDelete: 'cascade' }),
		term: text('term').notNull(),
		definition: text('definition').notNull(),
		position: integer('position').notNull(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(now).notNull()
	},
	(t) => [index('card_set_position_idx').on(t.setId, t.position)]
);

/** Per-user study state of a card. Mirrors the ts-fsrs `Card` fields. */
export const cardProgress = sqliteTable(
	'card_progress',
	{
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		cardId: text('card_id')
			.notNull()
			.references(() => card.id, { onDelete: 'cascade' }),
		starred: integer('starred', { mode: 'boolean' }).notNull().default(false),
		due: integer('due', { mode: 'timestamp_ms' }).notNull(),
		stability: real('stability').notNull().default(0),
		difficulty: real('difficulty').notNull().default(0),
		elapsedDays: integer('elapsed_days').notNull().default(0),
		scheduledDays: integer('scheduled_days').notNull().default(0),
		learningSteps: integer('learning_steps').notNull().default(0),
		reps: integer('reps').notNull().default(0),
		lapses: integer('lapses').notNull().default(0),
		state: integer('state').notNull().default(0),
		lastReview: integer('last_review', { mode: 'timestamp_ms' })
	},
	(t) => [
		primaryKey({ columns: [t.userId, t.cardId] }),
		index('card_progress_due_idx').on(t.userId, t.due)
	]
);

export type StudySet = typeof studySet.$inferSelect;
export type Card = typeof card.$inferSelect;
export type CardProgress = typeof cardProgress.$inferSelect;
