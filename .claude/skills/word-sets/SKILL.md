---
name: word-sets
description: Create or extend ready-made vocabulary sets in seed/ (e.g. "make Italian B2 sets", "add a Spanish A1 food set"). Covers the TSV format, card-writing conventions, overlap checks, validation and loading the sets into a database.
---

# Writing seed word sets

Seed sets live in `seed/<language>-<level>/NN-slug.tsv`, for example `seed/italian-b1/03-verbi-utili.tsv`. One file is one set. `npm run db:seed` loads them; `src/lib/seed.spec.ts` validates every file automatically.

## File format

```
# title: Verbi utili
# description: Pronominal verbs and other verbs you need at B1.
# language: it
# translated: en
# level: B1

accorgersi (di)	to notice / to realise / to realize
cavarsela	to manage / to get by
```

- **Headers:** `language` and `translated` are codes from `src/lib/languages.ts`; add the language there first if it's missing. `level` is optional, one of A1–C2.
- **Titles:** in the target language, without the level (the level badge shows it).
- **Card lines:** `term<TAB>definition`, a real tab character. Write the files with a script (e.g. Python joining fields with `\t`), not by hand-typing tabs.
- **Size:** about 25–30 cards per set, 8–9 sets per level.

## Card conventions

How grading works (`src/lib/grade.ts`) drives these rules:

- **Nouns with their article:** `la casa`, `gli stivali`. Grading ignores leading articles of the answer language, so `casa` is accepted.
- **Gender hint for elided articles:** `l'ambiente (m.)`, `l'estate (f.)`. Anything in parentheses is shown as a hint and is optional when typing.
- **Prepositions and usage notes in parentheses:** `fidarsi (di)`, `sebbene` → `although (+ subjunctive)`.
- **Alternative meanings separated by `/`:** `trousers / pants`. Every alternative is accepted. Use `;` for genuinely different senses: `prescription; recipe`.
- **Never use ", " inside a term or definition**: the grader splits on it, so each half would be accepted on its own. Put commas inside parentheses instead: `first course (pasta, rice or soup)`.
- **No two cards in one set with the same definition**: a typed synonym would be marked wrong.
- **No term repeated across sets of the same language**: check existing files before writing.
- **Accuracy over quantity:** standard, neutral translations. Include both British and American spellings where they differ (`to realise / to realize`).

## Workflow

1. **Choose topics.** List the existing sets for the language (`ls seed/`, read the titles) and pick topics that fit the level and don't repeat existing ones.
2. **Write the files**, numbered `01-…`, `02-…`, with a script. Have it assert, per set: one tab per line, unique terms, no duplicate definitions, and no overlap with terms in the other sets of that language.
3. **Validate:** `npx vitest run src/lib/seed.spec.ts`. It checks headers, unique terms and that every card is answerable.
4. **Document:** add the folder to the "Ready-made word sets" list in `README.md`.
5. **Try the sets in the sandbox:** `npm run dev:sandbox` loads every seed folder as `author@ripasso.test`, and `npm run screenshot -- /explore` shows them.
6. **Load into a real database** only when the user asks, and only the new folder:
   - **Local:** `npm run db:seed -- --owner <email> seed/<folder>`. The owner must already have an account there.
   - **Production:** `npm run db:seed:prod -- --owner <email> seed/<folder>`. This needs the user's explicit confirmation; the project hook will ask.

   Sets are public by default (`--visibility private` keeps them private). Re-running skips sets the owner already has, matched by title.
