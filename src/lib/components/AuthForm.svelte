<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';

	interface Props {
		mode: 'login' | 'signup';
		form: { message?: string; name?: string; email?: string } | null;
	}

	let { mode, form }: Props = $props();
	let pending = $state(false);

	const isSignup = $derived(mode === 'signup');
	// `?error=…` is added when a Google sign-in comes back unsuccessful.
	const query = $derived.by(() => {
		const kept = [...page.url.searchParams].filter(([key]) => key !== 'error');
		return kept.length ? `?${new URLSearchParams(kept)}` : '';
	});
	const oauthError = $derived(page.url.searchParams.get('error'));
	const message = $derived(
		form?.message ??
			(oauthError === 'access_denied'
				? 'Google sign-in was cancelled.'
				: oauthError
					? 'Google sign-in didn’t work. Please try again.'
					: null)
	);

	const submit = () => {
		pending = true;
		return async ({ update }: { update: () => Promise<void> }) => {
			await update();
			pending = false;
		};
	};
</script>

<div class="mx-auto mt-10 max-w-sm">
	<h1 class="mb-6 text-2xl font-bold">{isSignup ? 'Create your account' : 'Welcome back'}</h1>

	{#if page.data.googleEnabled}
		<form method="post" action="?/google{query ? '&' + query.slice(1) : ''}" use:enhance={submit}>
			<button class="btn-secondary w-full" disabled={pending}>
				<svg class="size-5" viewBox="0 0 48 48" aria-hidden="true">
					<path
						fill="#FFC107"
						d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
					/>
					<path
						fill="#FF3D00"
						d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
					/>
					<path
						fill="#4CAF50"
						d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
					/>
					<path
						fill="#1976D2"
						d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
					/>
				</svg>
				Continue with Google
			</button>
		</form>
		<div class="my-6 flex items-center gap-3 text-sm text-muted">
			<span class="h-px flex-1 bg-line"></span>or<span class="h-px flex-1 bg-line"></span>
		</div>
	{/if}

	<form
		method="post"
		action="?/email{query ? '&' + query.slice(1) : ''}"
		use:enhance={submit}
		class="space-y-4"
	>
		{#if isSignup}
			<label class="block">
				<span class="label">Name</span>
				<input
					class="input"
					name="name"
					autocomplete="name"
					required
					defaultValue={form?.name ?? ''}
				/>
			</label>
		{/if}
		<label class="block">
			<span class="label">Email</span>
			<input
				class="input"
				type="email"
				name="email"
				autocomplete="email"
				required
				defaultValue={form?.email ?? ''}
			/>
		</label>
		<label class="block">
			<span class="label">Password</span>
			<input
				class="input"
				type="password"
				name="password"
				minlength="8"
				autocomplete={isSignup ? 'new-password' : 'current-password'}
				required
			/>
			{#if isSignup}<span class="mt-1 block text-xs text-muted">At least 8 characters.</span>{/if}
		</label>
		{#if message}
			<p class="text-sm text-bad" role="alert">{message}</p>
		{/if}
		<button class="btn-primary w-full" disabled={pending}>{isSignup ? 'Sign up' : 'Log in'}</button>
	</form>

	<p class="mt-6 text-center text-sm text-muted">
		{#if isSignup}
			Already have an account? <a class="link" href="/login{query}">Log in</a>
		{:else}
			New here? <a class="link" href="/signup{query}">Create an account</a>
		{/if}
	</p>
</div>
