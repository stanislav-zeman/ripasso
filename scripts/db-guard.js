// Shared by drizzle.config.ts and scripts/seed.js: database commands only touch a remote
// (non-file:) database when asked to explicitly, so a stray .env can't hit production.
//
// Allowed when: the URL is a local file:, ALLOW_REMOTE_DB=1 (set by the npm run *:prod
// scripts), or the command runs in a Vercel build (VERCEL=1), which migrates on deploy.

/** @param {string | undefined} url */
export function assertDatabaseAllowed(url) {
	if (!url || url.startsWith('file:')) return;
	if (process.env.ALLOW_REMOTE_DB === '1' || process.env.VERCEL === '1') return;
	let host;
	try {
		host = new URL(url).host;
	} catch {
		// Never print a malformed URL in full: it may contain a token.
		host = url.split(':')[0] + ':…';
	}
	throw new Error(
		`Refusing to use the remote database ${host}.\n` +
			'Local work should use DATABASE_URL="file:local.db" in .env. To target production on purpose, ' +
			'use the :prod scripts (npm run db:migrate:prod / db:seed:prod / db:studio:prod), which read .env.production.'
	);
}
