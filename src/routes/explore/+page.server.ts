import { isLanguage } from '#lib/languages.ts';
import { listPublicLanguages, listPublicSets } from '#lib/server/sets.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const requested = url.searchParams.get('lang') ?? '';
	const lang = isLanguage(requested) ? requested : '';
	const [sets, languages] = await Promise.all([listPublicSets(q, lang), listPublicLanguages()]);
	return { q, lang, sets, languages };
};
