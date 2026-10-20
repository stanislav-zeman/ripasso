import { defineConfig } from '@playwright/test';

// E2E runs against a throwaway SQLite file, never the dev or production database.
const env = {
	DATABASE_URL: 'file:e2e.db',
	ORIGIN: 'http://localhost:4173',
	BETTER_AUTH_SECRET: 'e2e-secret-e2e-secret-e2e-secret'
};

export default defineConfig({
	webServer: {
		command: 'rm -f e2e.db && drizzle-kit migrate && npm run build && npm run preview',
		port: 4173,
		env,
		timeout: 180_000
	},
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: { baseURL: env.ORIGIN, trace: 'retain-on-failure' },
	testDir: 'e2e',
	testMatch: '**/*.e2e.{ts,js}'
});
