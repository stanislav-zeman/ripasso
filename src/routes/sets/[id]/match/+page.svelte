<script lang="ts">
	import { onDestroy } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import StudyHeader from '#lib/components/StudyHeader.svelte';
	import { shuffle } from '#lib/study/shuffle.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const PAIRS = 6;
	const PENALTY_MS = 1000;

	interface Tile {
		key: string;
		cardId: string;
		text: string;
		lang: string;
	}

	let tiles = $state<Tile[]>([]);
	const matched = new SvelteSet<string>();
	let selected = $state<Tile | null>(null);
	let mismatch = $state<string[]>([]);
	let startedAt = $state(0);
	let penalty = $state(0);
	let now = $state(0);
	let finishedMs = $state<number | null>(null);
	let best = $state<number | null>(null);
	let frame = 0;

	const bestKey = $derived(`ripasso:match-best:${data.set.id}`);
	const elapsed = $derived((finishedMs ?? now - startedAt) + penalty);

	function readBest() {
		try {
			const v = Number(localStorage.getItem(bestKey));
			return v > 0 ? v : null;
		} catch {
			return null;
		}
	}

	function tickClock() {
		now = performance.now();
		frame = requestAnimationFrame(tickClock);
	}

	function start() {
		const cards = shuffle(data.cards).slice(0, PAIRS);
		tiles = shuffle(
			cards.flatMap((c) => [
				{ key: `${c.id}:t`, cardId: c.id, text: c.term, lang: data.set.termLang },
				{ key: `${c.id}:d`, cardId: c.id, text: c.definition, lang: data.set.defLang }
			])
		);
		matched.clear();
		selected = null;
		mismatch = [];
		penalty = 0;
		finishedMs = null;
		best = readBest();
		startedAt = now = performance.now();
		cancelAnimationFrame(frame);
		tickClock();
	}
	start();
	onDestroy(() => cancelAnimationFrame(frame));

	function pick(tile: Tile) {
		if (matched.has(tile.cardId) || mismatch.length || finishedMs !== null) return;
		if (!selected) {
			selected = tile;
		} else if (selected.key === tile.key) {
			selected = null;
		} else if (selected.cardId === tile.cardId) {
			matched.add(tile.cardId);
			selected = null;
			if (matched.size * 2 === tiles.length) finish();
		} else {
			mismatch = [selected.key, tile.key];
			penalty += PENALTY_MS;
			selected = null;
			setTimeout(() => (mismatch = []), 450);
		}
	}

	function finish() {
		cancelAnimationFrame(frame);
		finishedMs = performance.now() - startedAt;
		const total = finishedMs + penalty;
		if (!best || total < best) {
			try {
				localStorage.setItem(bestKey, String(Math.round(total)));
			} catch {
				// Best time is a nicety; ignore storage failures.
			}
		}
	}

	const seconds = (ms: number) => (ms / 1000).toFixed(1);
</script>

<svelte:head><title>Match · {data.set.title}</title></svelte:head>

<StudyHeader title={data.set.title} mode="Match" backHref="/sets/{data.set.id}">
	<span class="text-2xl font-semibold tabular-nums">{seconds(elapsed)}s</span>
</StudyHeader>

{#if data.cards.length < 2}
	<p class="text-muted">Add at least two cards to play.</p>
{:else if finishedMs === null}
	<p class="mb-4 text-sm text-muted">
		Match each word with its meaning. Every wrong pair adds {PENALTY_MS / 1000} second.
	</p>
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
		{#each tiles as tile (tile.key)}
			{@const done = matched.has(tile.cardId)}
			<button
				type="button"
				lang={tile.lang}
				class="flex min-h-24 items-center justify-center rounded-xl border-2 p-3 text-center font-medium transition
					{done ? 'invisible' : ''}
					{selected?.key === tile.key
					? 'border-accent bg-accent-soft'
					: 'border-line bg-surface hover:border-accent/60'}
					{mismatch.includes(tile.key) ? 'animate-[shake_0.4s] border-bad bg-bad/10' : ''}"
				disabled={done}
				onclick={() => pick(tile)}>{tile.text}</button
			>
		{/each}
	</div>
{:else}
	{@const total = finishedMs + penalty}
	<div class="space-y-4 card p-8 text-center">
		<p class="text-4xl" aria-hidden="true">⏱️</p>
		<h2 class="text-xl font-semibold">{seconds(total)} seconds</h2>
		<p class="text-muted">
			{#if !best || total < best}New personal best!{:else}Your best: {seconds(best)}s{/if}
			{#if penalty}· includes {seconds(penalty)}s penalty{/if}
		</p>
		<button class="btn-primary" onclick={start}>Play again</button>
	</div>
{/if}

<style>
	@keyframes -global-shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-6px);
		}
		75% {
			transform: translateX(6px);
		}
	}
</style>
