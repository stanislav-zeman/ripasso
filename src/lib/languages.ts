export interface Language {
	name: string;
	/** BCP 47 locale used to pick a text-to-speech voice. */
	locale: string;
	/** Characters offered as buttons when typing answers in this language. */
	specialChars?: string[];
	/** Leading articles that grading ignores, so "casa" matches "la casa". Elided forms end in `'`. */
	articles?: string[];
}

export const LANGUAGES: Record<string, Language> = {
	zh: { name: 'Chinese', locale: 'zh-CN' },
	cs: {
		name: 'Czech',
		locale: 'cs-CZ',
		specialChars: ['á', 'č', 'ď', 'é', 'ě', 'í', 'ň', 'ó', 'ř', 'š', 'ť', 'ú', 'ů', 'ý', 'ž']
	},
	nl: {
		name: 'Dutch',
		locale: 'nl-NL',
		specialChars: ['é', 'ë', 'ï', 'ö', 'ü'],
		articles: ['de', 'het', 'een']
	},
	en: { name: 'English', locale: 'en-US', articles: ['the', 'a', 'an'] },
	fr: {
		name: 'French',
		locale: 'fr-FR',
		specialChars: ['à', 'â', 'ç', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'œ'],
		articles: ['le', 'la', 'les', "l'", 'un', 'une', 'des', 'du']
	},
	de: {
		name: 'German',
		locale: 'de-DE',
		specialChars: ['ä', 'ö', 'ü', 'ß'],
		articles: ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer']
	},
	it: {
		name: 'Italian',
		locale: 'it-IT',
		specialChars: ['à', 'è', 'é', 'ì', 'ò', 'ù'],
		articles: ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', "l'", "un'"]
	},
	ja: { name: 'Japanese', locale: 'ja-JP' },
	ko: { name: 'Korean', locale: 'ko-KR' },
	pl: {
		name: 'Polish',
		locale: 'pl-PL',
		specialChars: ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż']
	},
	pt: {
		name: 'Portuguese',
		locale: 'pt-PT',
		specialChars: ['á', 'â', 'ã', 'à', 'ç', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú'],
		articles: ['o', 'a', 'os', 'as', 'um', 'uma']
	},
	ru: { name: 'Russian', locale: 'ru-RU' },
	sk: {
		name: 'Slovak',
		locale: 'sk-SK',
		specialChars: [
			'á',
			'ä',
			'č',
			'ď',
			'é',
			'í',
			'ĺ',
			'ľ',
			'ň',
			'ó',
			'ô',
			'ŕ',
			'š',
			'ť',
			'ú',
			'ý',
			'ž'
		]
	},
	es: {
		name: 'Spanish',
		locale: 'es-ES',
		specialChars: ['á', 'é', 'í', 'ñ', 'ó', 'ú', 'ü', '¿', '¡'],
		articles: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas']
	},
	sv: { name: 'Swedish', locale: 'sv-SE', specialChars: ['å', 'ä', 'ö'], articles: ['en', 'ett'] },
	uk: { name: 'Ukrainian', locale: 'uk-UA' }
};

export const isLanguage = (code: string) => Object.hasOwn(LANGUAGES, code);

export const languageName = (code: string) => LANGUAGES[code]?.name ?? code;
