// Screenshots a page of a running app (by default the sandbox from `npm run dev:sandbox`) and
// reports browser errors, so changes can be checked visually from the command line.
//
//   npm run screenshot -- <path> [--base http://localhost:5174] [--login demo|author]
//                          [--dark] [--mobile] [--full] [--out file.png]

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';

const USERS = {
	demo: { email: 'demo@ripasso.test', password: 'password123' },
	author: { email: 'author@ripasso.test', password: 'password123' }
};

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		base: { type: 'string', default: 'http://localhost:5174' },
		login: { type: 'string' },
		dark: { type: 'boolean', default: false },
		mobile: { type: 'boolean', default: false },
		full: { type: 'boolean', default: false },
		out: { type: 'string' }
	}
});

const path = positionals[0] ?? '/';
const slug = path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
const out =
	values.out ??
	`.sandbox/screenshots/${slug}${values.login ? `-${values.login}` : ''}-${values.dark ? 'dark' : 'light'}-${values.mobile ? 'mobile' : 'desktop'}.png`;

const browser = await chromium.launch();
const context = await browser.newContext({
	viewport: values.mobile ? { width: 390, height: 844 } : { width: 1280, height: 800 },
	colorScheme: values.dark ? 'dark' : 'light'
});
const page = await context.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && problems.push(`console error: ${m.text()}`));
page.on('response', (r) => r.status() >= 500 && problems.push(`HTTP ${r.status()}: ${r.url()}`));

if (values.login) {
	const user = USERS[values.login];
	if (!user) throw new Error(`--login must be one of ${Object.keys(USERS).join(', ')}`);
	// The auth endpoint sets the session cookie on this browser context.
	const res = await context.request.post(`${values.base}/api/auth/sign-in/email`, {
		data: user,
		headers: { origin: values.base }
	});
	if (!res.ok())
		throw new Error(`Login as ${user.email} failed: ${res.status()} ${await res.text()}`);
}

const res = await page.goto(values.base + path, { waitUntil: 'networkidle' });
await page.waitForTimeout(300); // let transitions settle
mkdirSync(dirname(out), { recursive: true });
await page.screenshot({ path: out, fullPage: values.full });
await browser.close();

console.log(`${res?.status()} ${values.base + path} -> ${out}`);
for (const problem of problems) console.log(`  ! ${problem}`);
process.exit(problems.length ? 1 : 0);
