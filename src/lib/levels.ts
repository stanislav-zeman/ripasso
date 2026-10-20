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

export const isLevel = (value: unknown): value is Level => LEVELS.includes(value as Level);

/** E.g. "B1 · Intermediate". */
export const levelLabel = (level: Level) => `${level} · ${LEVEL_NAMES[level]}`;
