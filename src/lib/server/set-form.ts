import { fail } from '@sveltejs/kit';
import { VISIBILITIES, type Visibility } from '#lib/server/db/schema.ts';
import { MAX_CARDS } from '#lib/parse.ts';
import { isLanguage } from '#lib/languages.ts';
import type { CardInput, SetInput } from '#lib/server/sets.ts';

/** Reads and validates the set editor form. Cards arrive as a JSON field. */
export async function readSetForm(request: Request) {
	const form = await request.formData();
	const title = String(form.get('title') ?? '')
		.trim()
		.slice(0, 200);
	const description = String(form.get('description') ?? '')
		.trim()
		.slice(0, 2000);
	const termLang = String(form.get('termLang') ?? '');
	const defLang = String(form.get('defLang') ?? '');
	const visibility = String(form.get('visibility') ?? 'private') as Visibility;

	let cards: CardInput[] = [];
	try {
		const raw = JSON.parse(String(form.get('cards') ?? '[]'));
		if (Array.isArray(raw)) {
			cards = raw
				.map((c) => ({
					id: typeof c?.id === 'string' ? c.id : undefined,
					term: String(c?.term ?? '')
						.trim()
						.slice(0, 1000),
					definition: String(c?.definition ?? '')
						.trim()
						.slice(0, 1000)
				}))
				.filter((c) => c.term && c.definition);
		}
	} catch {
		return { error: fail(400, { message: 'Could not read the cards.' }) };
	}

	if (!title) return { error: fail(400, { message: 'Please give the set a title.' }) };
	if (!isLanguage(termLang) || !isLanguage(defLang)) {
		return { error: fail(400, { message: 'Please choose the term and definition languages.' }) };
	}
	if (!VISIBILITIES.includes(visibility)) {
		return { error: fail(400, { message: 'Invalid set settings.' }) };
	}
	if (cards.length === 0) return { error: fail(400, { message: 'Add at least one card.' }) };
	if (cards.length > MAX_CARDS) {
		return { error: fail(400, { message: `A set can have at most ${MAX_CARDS} cards.` }) };
	}

	const input: SetInput = { title, description, termLang, defLang, visibility };
	return { input, cards };
}
