<script lang="ts">
	import SetCard from '#lib/components/SetCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Explore · Ripasso</title></svelte:head>

<h1 class="text-2xl font-bold">Explore public sets</h1>
<form class="mt-4 flex gap-2" data-sveltekit-keepfocus data-sveltekit-replacestate>
	<input
		class="input mt-0 flex-1"
		type="search"
		name="q"
		value={data.q}
		placeholder="Search, e.g. “verbs”, “food”, “A1”"
		aria-label="Search sets"
	/>
	<button class="btn-primary">Search</button>
</form>

{#if data.sets.length}
	<div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.sets as set (set.id)}<SetCard {set} showOwner />{/each}
	</div>
{:else}
	<p class="mt-8 text-center text-muted">
		{data.q
			? `No public sets match “${data.q}”.`
			: 'No public sets yet. Make one of yours public to share it here.'}
	</p>
{/if}
