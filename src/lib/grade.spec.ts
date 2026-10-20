import { describe, expect, it } from 'vitest';
import { grade } from './grade';

describe('grade', () => {
	it('accepts exact answers regardless of case, whitespace and punctuation', () => {
		expect(grade('  ¿Por qué? ', 'por qué')).toBe('correct');
	});

	it('flags answers that only miss accents', () => {
		expect(grade('perche', 'perché')).toBe('accent');
		expect(grade('cafe', 'le café', { lang: 'fr' })).toBe('accent');
		expect(grade('Strasse', 'die Straße', { lang: 'de' })).toBe('wrong');
	});

	it("ignores the answer language's leading articles", () => {
		expect(grade('casa', 'la casa', { lang: 'it' })).toBe('correct');
		expect(grade("l'acqua", 'acqua', { lang: 'it' })).toBe('correct');
		expect(grade('Hund', 'der Hund', { lang: 'de' })).toBe('correct');
		expect(grade('cat', 'the cat', { lang: 'en' })).toBe('correct');
		// Articles are only stripped as whole words, and only for the given language.
		expect(grade('apple', 'an apple', { lang: 'en' })).toBe('correct');
		expect(grade('casa', 'la casa', { lang: 'en' })).toBe('wrong');
		expect(grade('casa', 'la casa')).toBe('wrong');
		expect(grade('casa', 'la casa', { lang: 'it', ignoreArticles: false })).toBe('wrong');
	});

	it('treats parenthesised hints as optional', () => {
		expect(grade('ambiente', "l'ambiente (m.)", { lang: 'it' })).toBe('correct');
		expect(grade("l'ambiente (m.)", "l'ambiente (m.)", { lang: 'it' })).toBe('correct');
		expect(grade('fidarsi', 'fidarsi (di)', { lang: 'it' })).toBe('correct');
		expect(grade('although', 'although (+ subjunctive; formal)')).toBe('correct');
	});

	it('accepts any of several alternatives', () => {
		expect(grade('to dine', 'to eat; to dine')).toBe('correct');
		expect(grade('almorzar', 'comer / almorzar')).toBe('correct');
	});

	it('rejects wrong and empty answers', () => {
		expect(grade('dog', 'cat')).toBe('wrong');
		expect(grade('', 'cat')).toBe('wrong');
	});
});
