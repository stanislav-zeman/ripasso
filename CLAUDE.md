# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Ripasso is a Quizlet-style vocabulary app: users make sets of term/definition cards and study them (flashcards, FSRS spaced repetition, typing, multiple choice, a match game). Stack: SvelteKit 3 (Svelte 5 runes, TypeScript), Drizzle ORM on Turso/libSQL, Better Auth (email/password + Google), Tailwind CSS 4, deployed on Vercel.

## Commands

Node 22.17+ (`.node-version`). Install with `npx npm@11 install`: npm 10 crashes resolving this tree from scratch (`npm ci` from the lockfile is fine, which is what CI and Vercel do).

```sh
npm run dev                      # http://localhost:5173
npm run check                    # svelte-check (types)
npm run lint                     # prettier --check + eslint
npm run format
npx vitest run                   # unit tests (src/**/*.spec.ts)
npx vitest run src/lib/grade.spec.ts -t "accents"   # one file / one test
npm run test:e2e                 # Playwright (e2e/*.e2e.ts)
npx playwright test -g "profile" # one E2E test
npm run db:generate              # new migration after editing schema.ts
npm run db:migrate
npm run db:seed -- --owner you@example.com [--visibility private] [seed/italian-a2]
```

E2E builds and previews the app on port 4173 against a throwaway `e2e.db` (env set in `playwright.config.ts`); it never touches `.env`'s database. CI (`.github/workflows/ci.yml`, on pushes to `master` and PRs) runs lint, check, unit and E2E.

## Database and environment: be careful

- `.env` may point `DATABASE_URL` at the **production** Turso database. `npm run dev`, `db:migrate`, `db:seed` and `drizzle-kit` all read it. For local work, prefix commands with `DATABASE_URL=file:local.db DATABASE_AUTH_TOKEN=`, or check `.env` first. `process.loadEnvFile` doesn't override variables that are already set, so a prefix always wins.
- Migrations live in `drizzle/` and run automatically on every Vercel deploy (`vercel-build`). Prefer additive changes (new nullable columns, indexes). Changing a column default or constraint in SQLite makes drizzle-kit rebuild the table, and on Turso the `PRAGMA foreign_keys=OFF` it relies on is a no-op inside the migration transaction, so `ON DELETE CASCADE` would wipe child rows (cards, progress). That's why `study_set.term_lang` still has a stale `'it'` default.
- `src/lib/server/db/auth.schema.ts` (Better Auth tables) is written by hand: the `auth generate` CLI can't load a SvelteKit 3 config.

## SvelteKit 3 conventions used here

- Env vars are declared in `src/env.ts` with `defineEnvVars` and imported from `$app/env/private`. Optional vars use a function schema (`(v) => v || undefined`).
- Internal imports use package `imports`: `#lib/...` **with the `.ts` extension** (e.g. `#lib/server/sets.ts`). The exception is `src/lib/server/db/schema.ts`, which uses relative extensionless imports because drizzle-kit loads it outside Vite.
- `redirect()` to another origin needs `{ external: [...] }` (see `signInGoogle` in `src/lib/server/auth-actions.ts`).
- Tailwind 4: shared component classes (`btn-primary`, `card`, `input`, `chip`, …) are defined with `@utility` in `src/routes/layout.css` so they can `@apply` each other (`@layer components` classes can't be `@apply`'d). Colours are theme tokens (`bg`, `surface`, `ink`, `muted`, `line`, `accent`, `good`, `warn`, `bad`); dark mode is `prefers-color-scheme` only.
- ESLint enforces Svelte 5 idioms (`SvelteSet` over mutable `Set`, writable `$derived` over `$state` + `$effect`); `svelte/no-navigation-without-resolve` is turned off because the app has no base path.

## Architecture

**Data model** (`src/lib/server/db/schema.ts`):

- **`study_set`:** `term_lang` is the set's **"Language"**, the foreign language it teaches; the UI never says "term language". `def_lang` is "Translated into". `level` is an optional CEFR level. `visibility` is `private | unlisted | public`.
- **`card`:** ordered by `position`.
- **`card_progress`:** keyed by (user, card); holds FSRS state plus `starred`. Progress is per user, so anyone can study a public set and get their own schedule. `updateSet` in `src/lib/server/sets.ts` keeps card ids when cards are edited so progress survives edits; cards removed from the list are deleted.

**Access rules:** all set queries and access checks live in `src/lib/server/sets.ts`.

- **Reading:** `canRead` / `getSetForUser` allow public, unlisted, or your own set.
- **Editing:** `getOwnedSet` returns 403 for other people's sets.
- **Listings:** Explore and public profiles (`listPublicSets`, `getPublicProfile`) show `public` sets only and never select email.
- **Shared load:** `src/routes/sets/[id]/+layout.server.ts` loads the set once for the overview and every study mode.

**Spaced repetition:**

- **Server:** `src/lib/server/srs.ts` wraps `ts-fsrs`; `schedule()` is pure and unit-tested.
- **Client:** study pages POST answers to `/api/review` (and stars to `/api/star`) via `src/lib/study/api.ts`, which duplicates the `Rating` numbers so `ts-fsrs` isn't bundled client-side.
- **Learn mode:** the queue logic (new cards go multiple choice → typed; requeue gap; verdict → rating) is in `src/lib/study/learn.ts`. The `LearnSession` component is shared by `/sets/[id]/learn` and `/review` (everything due across sets).

**Study pages** (`/sets/[id]/{flashcards,learn,write,test,match}`, `/review`):

- **Rendering:** they set `ssr = false` because sessions are shuffled per visit.
- **Preferences:** answer side, starred-only and shuffle live in `src/lib/study/prefs.svelte.ts` (localStorage); `sides()` turns a card into prompt/answer for the chosen direction.
- **Multiple choice:** options exclude cards with the same prompt (synonyms) so there's never a second correct option.

**Per-language behaviour** comes from one table in `src/lib/languages.ts`: name, flag emoji, TTS locale, accent buttons (`specialChars`) and leading articles. Adding a language is one entry there.

- **Grading:** `src/lib/grade.ts` returns `correct | accent | wrong`. It ignores case, punctuation, the answer language's leading articles, and anything in parentheses (hints like `(m.)` or `(di)`), splits alternatives on `;`, `/` and `, `, and treats accent-only differences as `accent`.
- **Levels:** `src/lib/levels.ts` defines the CEFR levels and a hue per level (green A1 → red C2) used by `LevelBadge`.

**Auth** (`src/lib/server/auth.ts`, `auth-actions.ts`):

- **Sessions:** `hooks.server.ts` puts `locals.user` / `locals.session` on each request; `requireUser` redirects to `/login?next=…` and `requireApiUser` returns 401.
- **Google:** enabled only when both Google env vars are set; it links to an existing email account automatically. A failed or cancelled OAuth attempt returns to the originating page with `?error=…`, which `AuthForm` turns into a message.

**Client-only extras:**

- **Pronunciation:** browser `speechSynthesis` (`src/lib/tts.ts`).
- **Sound effects:** synthesized with Web Audio (`src/lib/sound.svelte.ts`), with no audio files; volume and mute are stored in localStorage and controlled by `SoundControl` in the header.

## Seed word sets

- **Format:** `seed/<folder>/*.tsv`. Each file is one set: `# title:`, `# description:`, `# language:`, `# translated:` and optional `# level:` headers, then `term<TAB>definition` lines.
- **Validation:** `src/lib/seed.spec.ts` checks every file (headers valid, unique terms, every card answerable through `grade()`), so new seed content is tested automatically.
- **Loading:** `scripts/seed.js` is plain Node + `@libsql/client` with raw SQL, so it doesn't depend on the SvelteKit runtime. It skips sets the owner already has by title.
- **Content conventions:** nouns with articles, `(m.)`/`(f.)` for `l'` nouns, prepositions in parentheses, `/`-separated alternative meanings, and no duplicate meanings within a set.
