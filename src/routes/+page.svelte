<script lang="ts">
	import SetCard from '#lib/components/SetCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const mine = $derived(data.sets.filter((s) => s.ownerId === data.user?.id));
	const others = $derived(data.sets.filter((s) => s.ownerId !== data.user?.id));
	const due = $derived(data.sets.reduce((sum, s) => sum + s.due, 0));
</script>

<svelte:head><title>Ripasso – study Italian words</title></svelte:head>

{#if data.user}
	<div class="space-y-8">
		<section class="flex flex-col gap-4 card bg-accent-soft/40 p-6 sm:flex-row sm:items-center">
			<div class="flex-1">
				<h1 class="text-xl font-bold">Ciao, {data.user.name.split(' ')[0]}!</h1>
				<p class="text-muted">
					{#if due}You have <b class="text-ink">{due}</b> card{due === 1 ? '' : 's'} to review today.{:else if data.sets.length}No
						reviews due. Learn something new?{:else}Create your first set to get started.{/if}
				</p>
			</div>
			{#if due}
				<a href="/review" class="btn-primary">Start daily review</a>
			{:else if !data.sets.length}
				<a href="/sets/new" class="btn-primary">Create a set</a>
			{/if}
		</section>

		<section>
			<h2 class="mb-3 text-lg font-semibold">Your sets</h2>
			{#if mine.length}
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each mine as set (set.id)}<SetCard {set} />{/each}
				</div>
			{:else}
				<div class="card border-dashed p-8 text-center text-muted">
					You don't have any sets yet. <a class="link" href="/sets/new">Create one</a> by pasting
					your word list, or
					<a class="link" href="/explore">find one to study</a>.
				</div>
			{/if}
		</section>

		{#if others.length}
			<section>
				<h2 class="mb-3 text-lg font-semibold">Sets you're studying</h2>
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each others as set (set.id)}<SetCard {set} showOwner />{/each}
				</div>
			</section>
		{/if}
	</div>
{:else}
	<section class="mx-auto max-w-2xl py-10 text-center sm:py-16">
		<p class="mb-4 chip">🇮🇹 Free & open</p>
		<h1 class="text-4xl font-bold tracking-tight sm:text-5xl">Learn Italian words that stick.</h1>
		<p class="mt-4 text-lg text-muted">
			Ripasso turns your word lists into flashcards, quizzes and games – and uses spaced repetition
			to bring each word back right before you'd forget it.
		</p>
		<div class="mt-8 flex flex-wrap justify-center gap-3">
			<a href="/signup" class="btn-primary px-6 py-3 text-base">Get started</a>
			<a href="/explore" class="btn-secondary px-6 py-3 text-base">Browse sets</a>
		</div>
	</section>
	<section class="grid gap-4 sm:grid-cols-3">
		{#each [['📋', 'Paste your list', 'Import straight from a Quizlet export or any “word – meaning” list.'], ['🧠', 'Learn smarter', 'Multiple choice, typing with accent help, and FSRS spaced repetition.'], ['🔊', 'Hear it', 'Every word can be read aloud with an Italian voice.']] as [icon, title, text] (title)}
			<div class="card p-5">
				<p class="text-2xl" aria-hidden="true">{icon}</p>
				<h2 class="mt-2 font-semibold">{title}</h2>
				<p class="mt-1 text-sm text-muted">{text}</p>
			</div>
		{/each}
	</section>
{/if}
