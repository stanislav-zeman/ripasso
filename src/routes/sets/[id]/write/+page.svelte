<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import StudyHeader from '#lib/components/StudyHeader.svelte';
	import StudyOptions from '#lib/components/StudyOptions.svelte';
	import WriteQuestion from '#lib/components/WriteQuestion.svelte';
	import type { Verdict } from '#lib/grade.ts';
	import { Rating, recordReview } from '#lib/study/api.ts';
	import { prefs, sides } from '#lib/study/prefs.svelte.ts';
	import { shuffle } from '#lib/study/shuffle.ts';
	import type { PageProps } from './$types';

	type Card = PageProps['data']['cards'][number];

	let { data }: PageProps = $props();

	let round = $state(1);
	let items = $state<Card[]>([]);
	let index = $state(0);
	let missed = $state<Card[]>([]);
	let correct = $state(0);
	// Only the first answer to each card in a visit counts for spaced repetition.
	const reviewed = new SvelteSet<string>();

	const starredCount = $derived(data.cards.filter((c) => c.starred).length);
	const current = $derived(items[index]);

	function start(cards?: Card[]) {
		const pool =
			cards ??
			(prefs.starredOnly && starredCount ? data.cards.filter((c) => c.starred) : data.cards);
		items = prefs.shuffle ? shuffle(pool) : [...pool];
		index = 0;
		missed = [];
		correct = 0;
		round = cards ? round + 1 : 1;
	}
	start();

	function onresult(verdict: Verdict) {
		const card = items[index];
		if (data.user && !reviewed.has(card.id)) {
			reviewed.add(card.id);
			recordReview(
				card.id,
				verdict === 'correct' ? Rating.Good : verdict === 'accent' ? Rating.Hard : Rating.Again
			);
		}
		if (verdict === 'wrong') missed.push(card);
		else correct++;
		index++;
	}
</script>

<svelte:head><title>Write · {data.set.title}</title></svelte:head>

<StudyHeader
	title={data.set.title}
	mode="Write · round {round}"
	backHref="/sets/{data.set.id}"
	done={index}
	total={items.length}
>
	<StudyOptions langs={data.set} {starredCount} onchange={() => start()} />
</StudyHeader>

{#if current}
	{#key `${round}-${index}`}
		<WriteQuestion {...sides(current, data.set, prefs.answerWith)} {onresult} />
	{/key}
{:else}
	<div class="space-y-6 card p-6 text-center sm:p-8">
		<div>
			<p class="text-4xl" aria-hidden="true">{missed.length ? '💪' : '🏆'}</p>
			<h2 class="mt-2 text-xl font-semibold">
				Round {round} done: {correct}/{items.length} correct
			</h2>
		</div>
		{#if missed.length}
			<ul class="divide-y divide-line rounded-lg border border-line text-left">
				{#each missed as card (card.id)}
					<li class="grid grid-cols-2 gap-3 px-3 py-2">
						<span class="font-medium">{card.term}</span><span class="text-muted"
							>{card.definition}</span
						>
					</li>
				{/each}
			</ul>
		{/if}
		<div class="flex flex-wrap justify-center gap-2">
			{#if missed.length}
				<button class="btn-primary" onclick={() => start(missed)}
					>Retry {missed.length} missed</button
				>
			{/if}
			<button class="btn-secondary" onclick={() => start()}>Start over</button>
		</div>
	</div>
{/if}
