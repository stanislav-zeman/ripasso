export type Side = 'term' | 'definition';

interface Prefs {
	/** Which side the learner types or picks: the other one is the prompt. */
	answerWith: Side;
	starredOnly: boolean;
	shuffle: boolean;
}

const KEY = 'ripasso:prefs';
const defaults: Prefs = { answerWith: 'term', starredOnly: false, shuffle: true };

function load(): Prefs {
	try {
		return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
	} catch {
		return { ...defaults };
	}
}

/** Study preferences shared by all modes, remembered in this browser. */
export const prefs: Prefs = $state(typeof localStorage === 'undefined' ? { ...defaults } : load());

export function savePrefs() {
	try {
		localStorage.setItem(KEY, JSON.stringify(prefs));
	} catch {
		// Storage can be unavailable (private mode); preferences then last for the session.
	}
}

export interface Sided {
	term: string;
	definition: string;
}

export interface Langs {
	termLang: string;
	defLang: string;
}

/** Splits a card into what is shown and what is expected, according to `answerWith`. */
export function sides(card: Sided, langs: Langs, answerWith: Side) {
	return answerWith === 'term'
		? {
				prompt: card.definition,
				promptLang: langs.defLang,
				answer: card.term,
				answerLang: langs.termLang
			}
		: {
				prompt: card.term,
				promptLang: langs.termLang,
				answer: card.definition,
				answerLang: langs.defLang
			};
}
