import { describe, expect, it } from 'vitest';
import { grade } from './grade';

describe('grade', () => {
	it('accepts exact answers regardless of case, whitespace and punctuation', () => {
		expect(grade('  Perché? ', 'perché')).toBe('correct');
	});

	it('flags answers that only miss accents', () => {
		expect(grade('perche', 'perché')).toBe('accent');
		expect(grade('citta', 'la città')).toBe('accent');
	});

	it('ignores leading articles unless disabled', () => {
		expect(grade('casa', 'la casa')).toBe('correct');
		expect(grade("l'acqua", 'acqua')).toBe('correct');
		expect(grade('casa', 'la casa', { ignoreArticles: false })).toBe('wrong');
	});

	it('accepts any of several alternatives', () => {
		expect(grade('to dine', 'to eat; to dine')).toBe('correct');
		expect(grade('pranzare', 'mangiare / pranzare')).toBe('correct');
	});

	it('rejects wrong and empty answers', () => {
		expect(grade('cane', 'gatto')).toBe('wrong');
		expect(grade('', 'gatto')).toBe('wrong');
	});
});
