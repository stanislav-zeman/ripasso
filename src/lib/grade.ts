export type Verdict = 'correct' | 'accent' | 'wrong';

export interface GradeOptions {
	/** Ignore leading Italian articles, so "casa" matches "la casa". */
	ignoreArticles?: boolean;
}

const ARTICLES = /^(il|lo|la|i|gli|le|un|uno|una|l'|un'|dei|degli|delle)\s*/;

function normalize(text: string, { ignoreArticles = true }: GradeOptions) {
	let s = text
		.normalize('NFC')
		.toLowerCase()
		.replace(/[’`´]/g, "'")
		.replace(/[.,!?¿¡;:"]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	if (ignoreArticles) s = s.replace(ARTICLES, '');
	return s;
}

function stripAccents(text: string) {
	return text.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/** Splits an expected answer like "to eat; to dine" or "mangiare / pranzare" into alternatives. */
function alternatives(expected: string) {
	const parts = expected.split(/\s*[;/]\s*|\s*,\s+/).filter(Boolean);
	return [expected, ...parts];
}

/**
 * Grades a typed answer. Exact match (case, punctuation and articles aside) is `correct`;
 * a match that only differs in accents (perche / perché) is `accent`.
 */
export function grade(answer: string, expected: string, options: GradeOptions = {}): Verdict {
	const given = normalize(answer, options);
	if (!given) return 'wrong';
	const targets = alternatives(expected).map((alt) => normalize(alt, options));
	if (targets.includes(given)) return 'correct';
	const bare = stripAccents(given);
	if (targets.some((t) => stripAccents(t) === bare)) return 'accent';
	return 'wrong';
}
