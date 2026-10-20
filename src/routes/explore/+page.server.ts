import { isLanguage } from '#lib/languages.ts';
import { isLevel } from '#lib/levels.ts';
import { listPublicLanguages, listPublicLevels, listPublicSets } from '#lib/server/sets.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const lang = url.searchParams.get('lang') ?? '';
	const level = url.searchParams.get('level') ?? '';
	const filters = {
		lang: isLanguage(lang) ? lang : undefined,
		level: isLevel(level) ? level : undefined
	};
	// Each filter's counts take the other filter into account.
	const [sets, languages, levels] = await Promise.all([
		listPublicSets(q, filters),
		listPublicLanguages(filters.level),
		listPublicLevels(filters.lang)
	]);
	return { q, lang: filters.lang ?? '', level: filters.level ?? '', sets, languages, levels };
};
