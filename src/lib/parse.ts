export interface ParsedCard {
	term: string;
	definition: string;
}

export const SEPARATORS = {
	auto: 'Auto-detect',
	tab: 'Tab',
	dash: ' - ',
	equals: ' = ',
	semicolon: ';',
	comma: ','
} as const;

export type Separator = keyof typeof SEPARATORS;

const SPLITTERS: Record<Exclude<Separator, 'auto'>, string | RegExp> = {
	tab: '\t',
	dash: /\s+[-–—]\s+/,
	equals: /\s*=\s*/,
	semicolon: ';',
	comma: ','
};

/** Order matters: the first separator that splits most lines wins. */
const DETECTION_ORDER: Exclude<Separator, 'auto'>[] = [
	'tab',
	'dash',
	'equals',
	'semicolon',
	'comma'
];

export const MAX_CARDS = 2000;

function splitLine(line: string, sep: Exclude<Separator, 'auto'>): ParsedCard | null {
	const splitter = SPLITTERS[sep];
	const match = typeof splitter === 'string' ? line.indexOf(splitter) : line.search(splitter);
	if (match < 0) return null;
	const sepLength =
		typeof splitter === 'string' ? splitter.length : line.slice(match).match(splitter)![0].length;
	const term = line.slice(0, match).trim();
	const definition = line.slice(match + sepLength).trim();
	if (!term || !definition) return null;
	return { term, definition };
}

export function detectSeparator(lines: string[]): Exclude<Separator, 'auto'> {
	let best: Exclude<Separator, 'auto'> = 'tab';
	let bestCount = 0;
	for (const sep of DETECTION_ORDER) {
		const count = lines.filter((line) => splitLine(line, sep)).length;
		if (count > bestCount) {
			best = sep;
			bestCount = count;
		}
	}
	return best;
}

/**
 * Parses pasted text into cards, one card per line, term and definition split by `separator`.
 * Quizlet's export (tab between term and definition, newline between cards) works with `auto`.
 * Lines that can't be split are returned in `skipped`.
 */
export function parseCards(text: string, separator: Separator = 'auto') {
	const lines = text
		.replace(/\r\n?/g, '\n')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
	const sep = separator === 'auto' ? detectSeparator(lines) : separator;
	const cards: ParsedCard[] = [];
	const skipped: string[] = [];
	for (const line of lines) {
		const parsed = splitLine(line, sep);
		if (parsed) cards.push(parsed);
		else skipped.push(line);
	}
	return { cards: cards.slice(0, MAX_CARDS), skipped, separator: sep };
}
