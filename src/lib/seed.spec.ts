import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { grade } from './grade';
import { isLanguage } from './languages';
import { isLevel } from './levels';

// The seed sets (seed/*/*.tsv) must be well-formed and answerable in Write mode.
const root = join(import.meta.dirname, '../../seed');
const files = readdirSync(root).flatMap((dir) =>
	readdirSync(join(root, dir))
		.filter((f) => f.endsWith('.tsv'))
		.map((f) => join(root, dir, f))
);

describe.each(files)('%s', (file) => {
	const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean);
	const meta: Record<string, string> = {};
	for (const line of lines) {
		const header = line.match(/^#\s*(\w+):\s*(.*)$/);
		if (header) meta[header[1]] = header[2];
	}
	const cards = lines.filter((l) => !l.startsWith('#')).map((l) => l.split('\t'));

	it('has a title and valid languages', () => {
		expect(meta.title).toBeTruthy();
		expect(isLanguage(meta.language) && isLanguage(meta.translated)).toBe(true);
		if (meta.level) expect(isLevel(meta.level)).toBe(true);
	});

	it('has unique terms, each answerable by typing it', () => {
		expect(new Set(cards.map(([term]) => term)).size).toBe(cards.length);
		for (const [term, definition, ...rest] of cards) {
			expect(rest, term).toEqual([]);
			expect(grade(term, term, { lang: meta.language }), term).toBe('correct');
			expect(grade(definition, definition, { lang: meta.translated }), definition).toBe('correct');
			// Hints and articles are optional, but must never leave nothing to type.
			expect(grade('', term, { lang: meta.language }), term).toBe('wrong');
		}
	});
});
