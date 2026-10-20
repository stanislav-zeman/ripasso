<script lang="ts">
	import SetCard from '#lib/components/SetCard.svelte';
	import { languageLabel, languageName } from '#lib/languages.ts';
	import { LEVELS, levelLabel } from '#lib/levels.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Keep a filtered-for language in the list even if it has no public sets (e.g. from a shared link).
	const options = $derived(
		data.lang && !data.languages.some((l) => l.code === data.lang)
			? [...data.languages, { code: data.lang, sets: 0 }]
			: data.languages
	);
	// Levels in CEFR order, only those with sets (plus the one filtered for).
	const levelOptions = $derived(
		LEVELS.flatMap((level) => {
			const sets = data.levels.find((l) => l.level === level)?.sets ?? 0;
			return sets || level === data.level ? [{ level, sets }] : [];
		})
	);
	const filtered = $derived(Boolean(data.q || data.lang || data.level));
	const submit = (e: Event & { currentTarget: HTMLSelectElement }) =>
		e.currentTarget.form?.requestSubmit();
</script>

<svelte:head><title>Explore · Ripasso</title></svelte:head>

<h1 class="text-2xl font-bold">Explore public sets</h1>
<form
	class="mt-4 flex flex-col gap-2 sm:flex-row"
	data-sveltekit-keepfocus
	data-sveltekit-replacestate
>
	<input
		class="input mt-0 flex-1"
		type="search"
		name="q"
		value={data.q}
		placeholder="Search, e.g. “verbs”, “food”, “A1”"
		aria-label="Search sets"
	/>
	<div class="grid grid-cols-2 gap-2 sm:flex">
		<select
			class="input mt-0 min-w-0 sm:w-44"
			name="lang"
			value={data.lang}
			aria-label="Language"
			onchange={submit}
		>
			<option value="">All languages</option>
			{#each options as l (l.code)}
				<option value={l.code}>{languageLabel(l.code)} ({l.sets})</option>
			{/each}
		</select>
		<select
			class="input mt-0 min-w-0 sm:w-44"
			name="level"
			value={data.level}
			aria-label="Level"
			onchange={submit}
		>
			<option value="">All levels</option>
			{#each levelOptions as l (l.level)}
				<option value={l.level}>{levelLabel(l.level)} ({l.sets})</option>
			{/each}
		</select>
		<button class="col-span-2 btn-primary">Search</button>
	</div>
</form>

{#if data.sets.length}
	<p class="mt-6 text-sm text-muted">
		{data.sets.length}
		{data.sets.length === 1 ? 'set' : 'sets'}{#if data.lang}&nbsp;in {languageName(
				data.lang
			)}{/if}{#if data.level}&nbsp;at {data.level}{/if}
		{#if filtered}· <a class="link" href="/explore">Clear filters</a>{/if}
	</p>
	<div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.sets as set (set.id)}<SetCard {set} showOwner />{/each}
	</div>
{:else}
	<p class="mt-8 text-center text-muted">
		{#if filtered}
			No public sets{data.lang ? ` in ${languageName(data.lang)}` : ''}{data.level
				? ` at ${data.level}`
				: ''}{data.q ? ` match “${data.q}”` : ''}.
			<a class="link" href="/explore">Clear filters</a>
		{:else}
			No public sets yet. Make one of yours public to share it here.
		{/if}
	</p>
{/if}
