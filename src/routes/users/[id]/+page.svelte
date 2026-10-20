<script lang="ts">
	import Avatar from '#lib/components/Avatar.svelte';
	import SetCard from '#lib/components/SetCard.svelte';
	import { languageFlag, languageLabel, languageName } from '#lib/languages.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let lang = $state('');

	const cards = $derived(data.sets.reduce((sum, s) => sum + s.cards, 0));
	// Languages they teach, most sets first.
	const languages = $derived(
		Object.entries(
			data.sets.reduce<Record<string, number>>((acc, s) => {
				acc[s.termLang] = (acc[s.termLang] ?? 0) + 1;
				return acc;
			}, {})
		).sort((a, b) => b[1] - a[1])
	);
	const shown = $derived(lang ? data.sets.filter((s) => s.termLang === lang) : data.sets);
	const memberSince = $derived(
		new Date(data.profile.createdAt).toLocaleDateString(undefined, {
			month: 'long',
			year: 'numeric'
		})
	);
</script>

<svelte:head><title>{data.profile.name} · Ripasso</title></svelte:head>

<section class="flex flex-col items-center gap-4 card p-6 text-center sm:flex-row sm:text-left">
	<Avatar name={data.profile.name} image={data.profile.image} size={72} />
	<div class="min-w-0 flex-1">
		<h1 class="text-2xl font-bold">{data.profile.name}</h1>
		<p class="mt-1 text-sm text-muted">
			{data.sets.length} public set{data.sets.length === 1 ? '' : 's'} · {cards} card{cards === 1
				? ''
				: 's'} · Member since {memberSince}
		</p>
		{#if languages.length}
			<p
				class="mt-2 text-xl"
				title="Teaches {languages.map(([code]) => languageName(code)).join(', ')}"
			>
				{#each languages as [code] (code)}<span class="mr-1">{languageFlag(code)}</span>{/each}
			</p>
		{/if}
	</div>
	{#if data.isMe}
		<a href="/" class="btn-secondary">Your library</a>
	{/if}
</section>

{#if data.isMe}
	<p class="mt-3 text-sm text-muted">
		This is how others see your profile. Only sets marked <b>Public</b> appear here; your email is never
		shown.
	</p>
{/if}

<section class="mt-8">
	<div class="mb-3 flex flex-wrap items-center gap-2">
		<h2 class="mr-auto text-lg font-semibold">Sets</h2>
		{#if languages.length > 1}
			<div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter by language">
				<button
					type="button"
					class="rounded-full px-3 py-1 text-sm ring-1 ring-line {lang === ''
						? 'bg-accent-soft font-medium text-accent ring-accent/40'
						: 'bg-surface text-muted hover:text-ink'}"
					aria-pressed={lang === ''}
					onclick={() => (lang = '')}>All</button
				>
				{#each languages as [code, count] (code)}
					<button
						type="button"
						class="rounded-full px-3 py-1 text-sm ring-1 ring-line {lang === code
							? 'bg-accent-soft font-medium text-accent ring-accent/40'
							: 'bg-surface text-muted hover:text-ink'}"
						aria-pressed={lang === code}
						onclick={() => (lang = code)}>{languageLabel(code)} ({count})</button
					>
				{/each}
			</div>
		{/if}
	</div>

	{#if shown.length}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each shown as set (set.id)}<SetCard {set} />{/each}
		</div>
	{:else}
		<p class="card border-dashed p-8 text-center text-muted">
			{data.isMe
				? "You haven't shared any public sets yet. Set a set's visibility to Public to show it here."
				: `${data.profile.name} hasn't shared any public sets yet.`}
		</p>
	{/if}
</section>
