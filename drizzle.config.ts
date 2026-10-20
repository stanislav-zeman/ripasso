import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

// Locally, read .env; on Vercel the variables come from the project settings.
if (existsSync('.env')) process.loadEnvFile('.env');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'turso',
	dbCredentials: {
		authToken: process.env.DATABASE_AUTH_TOKEN,
		url: process.env.DATABASE_URL
	},
	verbose: true,
	strict: true
});
