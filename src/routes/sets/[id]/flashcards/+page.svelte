<script lang="ts">
	import { untrack } from 'svelte';
	import Flashcard from '#lib/components/Flashcard.svelte';
	import StarButton from '#lib/components/StarButton.svelte';
	import StudyHeader from '#lib/components/StudyHeader.svelte';
	import StudyOptions from '#lib/components/StudyOptions.svelte';
	import { Rating, recordReview } from '#lib/study/api.ts';
	import { prefs } from '#lib/study/prefs.svelte.ts';
	import { shuffle } from '#lib/study/shuffle.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Local copy so starring a card updates it in the deck too.
	let cards = $state(untrack(() => data.cards.map((c) => ({ ...c }))));
	let deck = $state<typeof cards>([]);
	let index = $state(0);
	let flipped = $state(false);
	let known = $state(0);
	let stillLearning = $state<string[]>([]);

	const signedIn = $derived(Boolean(data.user));
	const current = $derived(deck[index]);
	const starredCount = $derived(cards.filter((c) => c.starred).length);
	// Flashcards show the prompt side first: the opposite of what you'd answer with.
	const showTermFirst = $derived(prefs.answerWith === 'definition');

	function start(only?: Set<string>) {
		let pool = prefs.starredOnly && starredCount ? cards.filter((c) => c.starred) : cards;
		if (only) pool = pool.filter((c) => only.has(c.id));
		deck = prefs.shuffle ? shuffle(pool) : [...pool];
		index = 0;
		flipped = false;
		known = 0;
		stillLearning = [];
	}
	start();

	function go(delta: number) {
		const next = index + delta;
		if (next < 0 || next > deck.length) return;
		index = next;
		flipped = false;
	}

	function mark(knowIt: boolean) {
		if (!current) return;
		recordReview(current.id, knowIt ? Rating.Good : Rating.Again);
		if (knowIt) known++;
		else stillLearning.push(current.id);
		go(1);
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
		if (e.key === ' ') {
			e.preventDefault();
			flipped = !flipped;
		} else if (e.key === 'ArrowRight') go(1);
		else if (e.key === 'ArrowLeft') go(-1);
		else if (signedIn && flipped && e.key === '1') mark(false);
		else if (signedIn && flipped && e.key === '2') mark(true);
	}
</script>

<svelte:head><title>Flashcards · {data.set.title}</title></svelte:head>
<svelte:window {onkeydown} />

<StudyHeader
	title={data.set.title}
	mode="Flashcards"
	backHref="/sets/{data.set.id}"
	done={Math.min(index, deck.length)}
	total={deck.length}
>
	<StudyOptions langs={data.set} {starredCount} onchange={() => start()} />
</StudyHeader>

{#if current}
	<Flashcard
		front={showTermFirst
			? { text: current.term, lang: data.set.termLang }
			: { text: current.definition, lang: data.set.defLang }}
		back={showTermFirst
			? { text: current.definition, lang: data.set.defLang }
			: { text: current.term, lang: data.set.termLang }}
		{flipped}
		onflip={() => (flipped = !flipped)}
	>
		{#snippet actions()}
			{#if signedIn}<StarButton cardId={current.id} bind:starred={current.starred} />{/if}
		{/snippet}
	</Flashcard>

	<div class="mt-6 flex items-center justify-between gap-3">
		<button
			class="btn-secondary"
			onclick={() => go(-1)}
			disabled={index === 0}
			aria-label="Previous card">←</button
		>
		{#if signedIn && flipped}
			<div class="flex gap-2">
				<button class="btn-secondary border-bad/40 text-bad" onclick={() => mark(false)}
					>Still learning <kbd class="text-xs opacity-60">1</kbd></button
				>
				<button class="btn-secondary border-good/40 text-good" onclick={() => mark(true)}
					>Know it <kbd class="text-xs opacity-60">2</kbd></button
				>
			</div>
		{:else}
			<p class="text-center text-sm text-muted">Tap the card or press <kbd>Space</kbd> to flip</p>
		{/if}
		<button class="btn-secondary" onclick={() => go(1)} aria-label="Next card">→</button>
	</div>
{:else if deck.length}
	<div class="space-y-4 card p-8 text-center">
		<p class="text-4xl" aria-hidden="true">🎉</p>
		<h2 class="text-xl font-semibold">You went through all {deck.length} cards</h2>
		{#if signedIn && (known || stillLearning.length)}
			<p class="text-muted">{known} known · {stillLearning.length} still learning</p>
		{/if}
		<div class="flex flex-wrap justify-center gap-2">
			{#if stillLearning.length}
				<button class="btn-primary" onclick={() => start(new Set(stillLearning))}
					>Review {stillLearning.length} still learning</button
				>
			{/if}
			<button class="btn-secondary" onclick={() => start()}>Start over</button>
			<a class="btn-secondary" href="/sets/{data.set.id}/learn">Continue to Learn</a>
		</div>
	</div>
{:else}
	<p class="text-muted">This set has no cards.</p>
{/if}
