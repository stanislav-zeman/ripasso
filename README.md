# Ripasso

A small, self-hosted Quizlet alternative for learning vocabulary in any language.

- **Sets** of term/definition cards, created by pasting a list (Quizlet export, `word - meaning`, CSV-ish) or with the card editor
- **Study modes:** Flashcards, Learn (spaced repetition with [FSRS](https://github.com/open-spaced-repetition/ts-fsrs)), Write (accent-aware grading), Test (multiple choice), Match (timed game)
- **Daily review** of everything that's due across all your sets
- **Pronunciation** through the browser's built-in text-to-speech
- **Accounts:** email + password and/or Google; sets can be private, unlisted (link only) or public (listed in Explore)

Stack: SvelteKit 3 (Svelte 5) · Drizzle ORM · Turso (libSQL) · Better Auth · Tailwind CSS 4 · Vercel.

## Development

Requires Node 22.17+ (see `.node-version`). Use npm 11 (`npx npm@11 install`): npm 10 crashes resolving this dependency tree.

```sh
cp .env.example .env          # then set BETTER_AUTH_SECRET
npm install
npm run db:migrate            # creates local.db
npm run dev
```

| Command                              | What it does                                                   |
| ------------------------------------ | -------------------------------------------------------------- |
| `npm run dev`                        | Dev server on http://localhost:5173                            |
| `npm run check` / `npm run lint`     | Type check / Prettier + ESLint                                 |
| `npm run test:unit`                  | Vitest (parser, grader, scheduler, learn queue)                |
| `npm run test:e2e`                   | Playwright against a throwaway `e2e.db`                        |
| `npm run db:generate`                | Create a migration after editing `src/lib/server/db/schema.ts` |
| `npm run db:migrate`                 | Apply migrations to the database in `DATABASE_URL`             |
| `npm run db:studio`                  | Browse the database                                            |
| `npm run db:seed -- --owner <email>` | Load the ready-made word sets from `seed/` (see below)         |

## Ready-made word sets

`seed/` contains word sets you can load into any database. `seed/italian-b1/` has eight Italian B1 sets (work, feelings, useful verbs, connectors, environment and society, health, media, idioms), about 220 cards.

```sh
npm run db:seed -- --owner you@example.com                        # local database (.env)
npm run db:seed -- --owner you@example.com --visibility private   # only visible to you
DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… npm run db:seed -- --owner you@example.com   # production
```

The owner must already have an account (sign up in the app first). Sets are public by default, so they show up in Explore. Running the command again skips sets the owner already has. Each file is a plain TSV (`term<TAB>definition`, with `# title:`, `# language:`, `# translated:` and optional `# level:` headers), so it can also be pasted into the app's import box. Text in parentheses, like `(m.)` or `(di)`, is shown as a hint and is optional when typing answers.

## Deploying (Vercel + Turso)

1. **Database:** install the [Turso CLI](https://docs.turso.tech/cli/introduction), then
   ```sh
   turso db create ripasso
   turso db show ripasso --url        # → DATABASE_URL
   turso db tokens create ripasso     # → DATABASE_AUTH_TOKEN
   ```
2. **Google sign-in (optional):** in Google Cloud Console create an OAuth client (type _Web application_) with the redirect URIs `http://localhost:5173/api/auth/callback/google` and `https://<your-domain>/api/auth/callback/google`. Vercel preview URLs change per deploy, so Google login works on the production domain and localhost only (email login works everywhere).
3. **Vercel:** import the Git repository and set the environment variables from `.env.example`: `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `ORIGIN` (e.g. `https://ripasso.vercel.app`), `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), and optionally `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
4. **Deploy.** The `vercel-build` script runs `drizzle-kit migrate` before building, so schema changes are applied on every deploy.

## Notes

- There is no email verification or password reset yet (both need an email provider). Someone who forgets their password can sign in with Google using the same email: the accounts are linked automatically.
- `src/lib/server/db/auth.schema.ts` is maintained by hand because the Better Auth CLI can't load a SvelteKit 3 config. Check it against the [Better Auth core schema](https://www.better-auth.com/docs/concepts/database#core-schema) when upgrading `better-auth`.
