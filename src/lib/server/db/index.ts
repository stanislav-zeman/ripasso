import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { DATABASE_URL, DATABASE_AUTH_TOKEN } from '$app/env/private';
import { dev } from '$app/env';

if (!DATABASE_URL) throw new Error('DATABASE_URL is not set');
if (!DATABASE_URL.startsWith('file:') && !DATABASE_AUTH_TOKEN) {
	throw new Error('DATABASE_AUTH_TOKEN is not set');
}

if (dev && !DATABASE_URL.startsWith('file:')) {
	console.warn(
		`\n⚠️  The dev server is using a REMOTE database (${new URL(DATABASE_URL).host}).\n` +
			'   Everything you do in the app changes that data. Use DATABASE_URL="file:local.db" for local work.\n'
	);
}

const client = createClient({ url: DATABASE_URL, authToken: DATABASE_AUTH_TOKEN });

export const db = drizzle(client, { schema });
