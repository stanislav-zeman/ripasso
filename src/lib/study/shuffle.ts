export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/** Picks up to `count - 1` distractors plus the correct answer, in random order. */
export function choices(correct: string, pool: readonly string[], count = 4, random = Math.random) {
	const distractors = shuffle(
		[...new Set(pool)].filter((p) => p !== correct),
		random
	).slice(0, count - 1);
	return shuffle([correct, ...distractors], random);
}
