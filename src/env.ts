import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value || undefined;

export const variables = defineEnvVars({
	DATABASE_URL: {
		description: 'The database connection string, e.g. `libsql://…turso.io` or `file:local.db`.'
	},
	DATABASE_AUTH_TOKEN: {
		description:
			'Auth token for the [Turso](https://turso.tech) database. Not needed for `file:` URLs.',
		schema: optional
	},
	ORIGIN: {
		description: 'The app origin (base URL), e.g. `http://localhost:5173`.'
	},
	BETTER_AUTH_SECRET: {
		description:
			'Secret used to sign tokens. For production use 32 characters generated with high entropy. See [Better Auth installation](https://www.better-auth.com/docs/installation).'
	},
	GOOGLE_CLIENT_ID: {
		description: 'Google OAuth client ID. Google sign-in is hidden when unset.',
		schema: optional
	},
	GOOGLE_CLIENT_SECRET: {
		description: 'Google OAuth client secret.',
		schema: optional
	}
});
