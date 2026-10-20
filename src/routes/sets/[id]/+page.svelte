<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import SpeakButton from '#lib/components/SpeakButton.svelte';
	import StarButton from '#lib/components/StarButton.svelte';
	import { languageName } from '#lib/languages.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const cards = $derived(data.cards);

	let copied = $state(false);
	const learned = $derived(cards.filter((c) => c.state >= 2).length);
	const learning = $derived(cards.filter((c) => c.state === 1 || c.state === 3).length);
	const signedIn = $derived(Boolean(data.user));

	const modes = [
		{ slug: 'flashcards', label: 'Flashcards', icon: '🃏', hint: 'Flip through the cards' },
		{ slug: 'learn', label: 'Learn', icon: '🧠', hint: 'Spaced repetition', auth: true },
		{ slug: 'write', label: 'Write', icon: '✍️', hint: 'Type the answer' },
		{ slug: 'test', label: 'Test', icon: '✅', hint: 'Multiple choice' },
		{ slug: 'match', label: 'Match', icon: '⏱️', hint: 'Beat the clock' }
	];

	async function share() {
		await navigator.clipboard.writeText(page.url.href);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<svelte:head><title>{data.set.title} · Ripasso</title></svelte:head>

<div class="space-y-6">
	<div>
		<div class="flex flex-wrap items-start gap-3">
			<h1 class="flex-1 text-2xl font-bold sm:text-3xl">{data.set.title}</h1>
			<span class="chip">{data.set.visibility}</span>
		</div>
		{#if data.set.description}<p class="mt-2 text-muted">{data.set.description}</p>{/if}
		<p class="mt-2 text-sm text-muted">
			{cards.length} cards · {languageName(data.set.termLang)} → {languageName(data.set.defLang)}
			{#if !data.isOwner}· by {data.ownerName}{/if}
		</p>
	</div>

	<nav class="grid grid-cols-2 gap-3 sm:grid-cols-5" aria-label="Study modes">
		{#each modes as mode (mode.slug)}
			{@const locked = mode.auth && !signedIn}
			<a
				href={locked
					? `/login?next=/sets/${data.set.id}/${mode.slug}`
					: `/sets/${data.set.id}/${mode.slug}`}
				class="flex flex-col items-center gap-1 card p-4 text-center transition last:col-span-2 hover:-translate-y-0.5 hover:border-accent sm:last:col-span-1"
			>
				<span class="text-2xl" aria-hidden="true">{mode.icon}</span>
				<span class="font-semibold">{mode.label}</span>
				<span class="text-xs text-muted">{locked ? 'Log in to track progress' : mode.hint}</span>
			</a>
		{/each}
	</nav>

	{#if signedIn && cards.length}
		<div class="card p-4">
			<div class="mb-2 flex justify-between text-sm">
				<span
					><b>{learned}</b> learned · <b>{learning}</b> learning ·
					<b>{cards.length - learned - learning}</b> not started</span
				>
			</div>
			<div class="flex h-2 overflow-hidden rounded-full bg-line">
				<div class="bg-good" style:width="{(learned / cards.length) * 100}%"></div>
				<div class="bg-warn" style:width="{(learning / cards.length) * 100}%"></div>
			</div>
		</div>
	{/if}

	<div class="flex flex-wrap gap-2">
		{#if data.isOwner}
			<a href="/sets/{data.set.id}/edit" class="btn-secondary">Edit</a>
		{/if}
		{#if data.set.visibility !== 'private'}
			<button class="btn-secondary" onclick={share}>{copied ? 'Link copied!' : 'Copy link'}</button>
		{/if}
		{#if signedIn}
			<form method="post" action="?/copy" use:enhance>
				<button class="btn-secondary">{data.isOwner ? 'Duplicate' : 'Copy to my library'}</button>
			</form>
		{/if}
		{#if data.isOwner}
			<form
				method="post"
				action="?/delete"
				class="ml-auto"
				use:enhance={({ cancel }) => {
					if (!confirm(`Delete “${data.set.title}” and all its cards?`)) cancel();
				}}
			>
				<button class="btn-danger">Delete</button>
			</form>
		{/if}
	</div>

	<section>
		<h2 class="mb-3 font-semibold">Terms in this set</h2>
		<ul class="space-y-2">
			{#each cards as c (c.id)}
				<li
					class="grid grid-cols-[1fr_auto] items-center gap-2 card p-3 sm:grid-cols-[1fr_1.5fr_auto]"
				>
					<div class="flex items-center gap-1 font-medium">
						{c.term}
						<SpeakButton text={c.term} lang={data.set.termLang} class="p-1" />
					</div>
					<div class="col-span-2 row-start-2 text-muted sm:col-span-1 sm:row-start-auto">
						{c.definition}
					</div>
					<div class="col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto">
						<StarButton cardId={c.id} starred={c.starred} disabled={!signedIn} />
					</div>
				</li>
			{/each}
		</ul>
	</section>
</div>
