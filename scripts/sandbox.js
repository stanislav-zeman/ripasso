// A throwaway copy of the app for trying changes: fresh SQLite database in .sandbox/, two demo
// accounts, every seed set loaded, dev server on its own port. Never touches .env's database.
//
//   npm run dev:sandbox [-- --port 5174] [--keep] [--no-seed]
//
// --keep reuses the existing sandbox database instead of starting fresh.

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
	options: {
		port: { type: 'string', default: '5174' },
		keep: { type: 'boolean', default: false },
		'no-seed': { type: 'boolean', default: false }
	}
});

const SANDBOX_USERS = {
	demo: { name: 'Demo Learner', email: 'demo@ripasso.test', password: 'password123' },
	author: { name: 'Ada Author', email: 'author@ripasso.test', password: 'password123' }
};

const port = values.port;
const origin = `http://localhost:${port}`;
const dbFile = '.sandbox/sandbox.db';
const env = {
	...process.env,
	DATABASE_URL: `file:${dbFile}`,
	DATABASE_AUTH_TOKEN: '',
	ORIGIN: origin,
	BETTER_AUTH_SECRET: 'sandbox-secret-not-for-production-use',
	// Google sign-in can't work on this origin; hide the button.
	GOOGLE_CLIENT_ID: '',
	GOOGLE_CLIENT_SECRET: ''
};

function run(args, label) {
	const result = spawnSync(process.execPath, args, { env, encoding: 'utf8' });
	if (result.status !== 0) {
		console.error(`${label} failed:\n${result.stdout}\n${result.stderr}`);
		process.exit(1);
	}
	return result.stdout;
}

mkdirSync('.sandbox', { recursive: true });
const fresh = !values.keep || !existsSync(dbFile);
if (fresh) {
	for (const suffix of ['', '-wal', '-shm', '-journal']) rmSync(dbFile + suffix, { force: true });
}
run(['node_modules/drizzle-kit/bin.cjs', 'migrate'], 'Migration');

const server = spawn(
	process.execPath,
	['node_modules/vite/bin/vite.js', 'dev', '--port', port, '--strictPort'],
	{ env, stdio: ['ignore', 'inherit', 'inherit'] }
);
const stop = () => server.kill('SIGTERM');
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
server.on('exit', (code) => process.exit(code ?? 0));

async function waitForServer() {
	for (let i = 0; i < 120; i++) {
		try {
			if ((await fetch(origin)).ok) return;
		} catch {
			// Not up yet.
		}
		await new Promise((r) => setTimeout(r, 500));
	}
	console.error(`The dev server did not start on ${origin}.`);
	stop();
}

await waitForServer();

if (fresh) {
	// Accounts are created through the app's own sign-up endpoint, so passwords are hashed properly.
	for (const user of Object.values(SANDBOX_USERS)) {
		const res = await fetch(`${origin}/api/auth/sign-up/email`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', origin },
			body: JSON.stringify(user)
		});
		if (!res.ok) console.error(`Could not create ${user.email}: ${res.status} ${await res.text()}`);
	}
	if (!values['no-seed']) {
		const out = run(['scripts/seed.js', '--owner', SANDBOX_USERS.author.email], 'Seeding');
		console.log(out.trim().split('\n').at(-1));
	}
}

console.log(`
  Sandbox ready: ${origin}   (database: ${dbFile}${fresh ? ', fresh' : ', kept'})
  Log in as   ${SANDBOX_USERS.demo.email} / ${SANDBOX_USERS.demo.password}    (learner, no sets)
              ${SANDBOX_USERS.author.email} / ${SANDBOX_USERS.author.password}  (owns the public seed sets)
  Screenshots: npm run screenshot -- /explore --base ${origin} [--login demo] [--dark] [--mobile]
`);
