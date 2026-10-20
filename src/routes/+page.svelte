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
		<a
			href="https://github.com/stanislav-zeman/ripasso"
			class="mt-6 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
			target="_blank"
			rel="noopener noreferrer"
		>
			<svg class="size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
				<path
					d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
				/>
			</svg>
			Open source on GitHub
		</a>
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
