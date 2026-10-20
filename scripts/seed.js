// Loads word sets from TSV files into the database, owned by an existing account.
//
//   npm run db:seed -- --owner you@example.com [--visibility public|unlisted|private] [--dry-run] [dir...]
//
// Each file in the given directories (default: every folder in seed/) is one set:
//
//   # title: Lavoro e carriera – B1
//   # description: Work and career.
//   # language: it          (the language the set teaches)
//   # translated: en        (the language of the definitions)
//   # level: B1             (optional CEFR level, A1–C2)
//   il colloquio di lavoro<TAB>job interview
//
// Sets the owner already has (same title) are skipped, so running it twice is safe.
// Uses DATABASE_URL / DATABASE_AUTH_TOKEN from the environment or .env.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import { createClient } from '@libsql/client';

const VISIBILITIES = ['private', 'unlisted', 'public'];
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		owner: { type: 'string' },
		visibility: { type: 'string', default: 'public' },
		'dry-run': { type: 'boolean', default: false }
	}
});

function fail(message) {
	console.error(`Error: ${message}`);
	process.exit(1);
}

if (!values.owner) fail('pass the owner account with --owner you@example.com');
if (!VISIBILITIES.includes(values.visibility)) {
	fail(`--visibility must be one of ${VISIBILITIES.join(', ')}`);
}

if (existsSync('.env')) process.loadEnvFile('.env');
const url = process.env.DATABASE_URL;
if (!url) fail('DATABASE_URL is not set');

const dirs = positionals.length
	? positionals
	: readdirSync('seed')
			.map((name) => join('seed', name))
			.filter((path) => statSync(path).isDirectory());

/** Reads one set file: `# key: value` headers, then term<TAB>definition lines. */
function readSet(file) {
	const meta = {};
	const cards = [];
	readFileSync(file, 'utf8')
		.split(/\r?\n/)
		.forEach((line, i) => {
			if (!line.trim()) return;
			const header = line.match(/^#\s*(\w+):\s*(.*)$/);
			if (header) {
				meta[header[1]] = header[2].trim();
				return;
			}
			const [term, definition, ...rest] = line.split('\t').map((s) => s.trim());
			if (!term || !definition || rest.length)
				fail(`${file}:${i + 1}: expected "term<TAB>definition"`);
			cards.push({ term, definition });
		});
	for (const key of ['title', 'language', 'translated']) {
		if (!meta[key]) fail(`${file}: missing "# ${key}:" header`);
	}
	if (meta.level && !LEVELS.includes(meta.level))
		fail(`${file}: level must be one of ${LEVELS.join(', ')}`);
	if (!cards.length) fail(`${file}: no cards`);
	return { file, ...meta, cards };
}

const sets = dirs.flatMap((dir) =>
	readdirSync(dir)
		.filter((name) => name.endsWith('.tsv'))
		.sort()
		.map((name) => readSet(join(dir, name)))
);
if (!sets.length) fail(`no .tsv files found in ${dirs.join(', ')}`);

const db = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });

const owner = (
	await db.execute({ sql: 'select id, name from user where email = ?', args: [values.owner] })
).rows[0];
if (!owner) fail(`no account with email ${values.owner} in ${url}. Sign up in the app first.`);

const existing = new Set(
	(
		await db.execute({ sql: 'select title from study_set where owner_id = ?', args: [owner.id] })
	).rows.map((r) => r.title)
);

console.log(
	`Seeding ${url} as ${owner.name} <${values.owner}>${values['dry-run'] ? ' (dry run)' : ''}`
);
let created = 0;
for (const set of sets) {
	if (existing.has(set.title)) {
		console.log(`  skip    ${set.title} (already exists)`);
		continue;
	}
	if (!values['dry-run']) {
		const setId = randomUUID();
		await db.batch(
			[
				{
					sql: `insert into study_set (id, owner_id, title, description, term_lang, def_lang, level, visibility)
					      values (?, ?, ?, ?, ?, ?, ?, ?)`,
					args: [
						setId,
						owner.id,
						set.title,
						set.description ?? '',
						set.language,
						set.translated,
						set.level ?? null,
						values.visibility
					]
				},
				...set.cards.map((card, position) => ({
					sql: 'insert into card (id, set_id, term, definition, position) values (?, ?, ?, ?, ?)',
					args: [randomUUID(), setId, card.term, card.definition, position]
				}))
			],
			'write'
		);
	}
	created++;
	console.log(
		`  create  ${set.title} (${[set.level, `${set.cards.length} cards`, values.visibility].filter(Boolean).join(', ')})`
	);
}
console.log(`Done: ${created} created, ${sets.length - created} skipped.`);
