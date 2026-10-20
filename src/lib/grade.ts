import { LANGUAGES } from './languages';

export type Verdict = 'correct' | 'accent' | 'wrong';

export interface GradeOptions {
	/** Language of the expected answer; its leading articles are ignored ("casa" matches "la casa"). */
	lang?: string;
	ignoreArticles?: boolean;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const articlePatterns = new Map<string, RegExp | null>();

/** Matches a leading article: whole words need a following space, elided ones ("l'") don't. */
function articlePattern(lang: string | undefined) {
	if (!lang) return null;
	if (!articlePatterns.has(lang)) {
		const articles = LANGUAGES[lang]?.articles ?? [];
		const words = articles.filter((a) => !a.endsWith("'")).map(escape);
		const elided = articles.filter((a) => a.endsWith("'")).map(escape);
		const parts = [
			...(words.length ? [`(?:${words.join('|')})\\s+`] : []),
			...elided.map((e) => `${e}\\s*`)
		];
		articlePatterns.set(lang, parts.length ? new RegExp(`^(?:${parts.join('|')})`) : null);
	}
	return articlePatterns.get(lang)!;
}

function normalize(text: string, { lang, ignoreArticles = true }: GradeOptions) {
	let s = text
		.normalize('NFC')
		// Parenthesised hints such as "(m.)" or "(di)" are optional when answering.
		.replace(/\([^)]*\)/g, ' ')
		.toLowerCase()
		.replace(/[’`´]/g, "'")
		.replace(/[.,!?¿¡;:"]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	const articles = ignoreArticles && articlePattern(lang);
	if (articles) s = s.replace(articles, '');
	return s;
}

function stripAccents(text: string) {
	return text.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/** Splits an expected answer like "to eat; to dine" or "comer / almorzar" into alternatives. */
function alternatives(expected: string) {
	// Separators inside a hint, like "(+ subjunctive; formal)", don't start a new alternative.
	const parts = expected
		.replace(/\([^)]*\)/g, ' ')
		.split(/\s*[;/]\s*|\s*,\s+/)
		.filter(Boolean);
	return [expected, ...parts];
}

/**
 * Grades a typed answer. Exact match (case, punctuation and articles aside) is `correct`;
 * a match that only differs in accents (cafe / café) is `accent`.
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
