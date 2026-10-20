/** CEFR proficiency levels, easiest first. */
export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export type Level = (typeof LEVELS)[number];

export const LEVEL_NAMES: Record<Level, string> = {
	A1: 'Beginner',
	A2: 'Elementary',
	B1: 'Intermediate',
	B2: 'Upper intermediate',
	C1: 'Advanced',
	C2: 'Proficient'
};

/**
 * OKLCH hue per level: a scale from green (A1) through yellow (B1) to red (C2).
 * LevelBadge turns it into colours that keep 6:1+ text contrast in both themes.
 */
export const LEVEL_HUES: Record<Level, number> = {
	A1: 150,
	A2: 128,
	B1: 95,
	B2: 65,
	C1: 42,
	C2: 25
};

export const isLevel = (value: unknown): value is Level => LEVELS.includes(value as Level);

/** E.g. "B1 · Intermediate". */
export const levelLabel = (level: Level) => `${level} · ${LEVEL_NAMES[level]}`;
