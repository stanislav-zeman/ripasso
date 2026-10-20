export const LANGUAGES: Record<string, string> = {
	it: 'Italian',
	en: 'English',
	cs: 'Czech',
	de: 'German',
	fr: 'French',
	es: 'Spanish'
};

export const languageName = (code: string) => LANGUAGES[code] ?? code;
