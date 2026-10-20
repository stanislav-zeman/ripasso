<script lang="ts">
	import { untrack } from 'svelte';
	import MultipleChoice from './MultipleChoice.svelte';
	import WriteQuestion from './WriteQuestion.svelte';
	import SpeakButton from './SpeakButton.svelte';
	import type { Verdict } from '#lib/grade.ts';
	import { play } from '#lib/sound.svelte.ts';
	import { recordReview } from '#lib/study/api.ts';
	import {
		initialQueue,
		ratingFor,
		requeue,
		type LearnCard,
		type LearnItem
	} from '#lib/study/learn.ts';
	import { prefs, sides } from '#lib/study/prefs.svelte.ts';
	import { choices } from '#lib/study/shuffle.ts';

	interface Props {
		cards: LearnCard[];
		/** Extra cards to draw multiple-choice distractors from. */
		pool?: LearnCard[];
		onrestart?: () => void;
	}

	let { cards, pool = [], onrestart }: Props = $props();

	// The session is keyed by its parent, so the queue is seeded once from `cards`.
	let queue = $state<LearnItem[]>(untrack(() => initialQueue(cards)));
	let finished = $state<LearnItem[]>([]);
	let turn = $state(0);

	const current = $derived(queue[0]);
	const q = $derived(current && sides(current.card, current.card, prefs.answerWith));
	const options = $derived.by(() => {
		if (!current || current.stage !== 'choice') return [];
		const others = [...cards, ...pool].map((c) => sides(c, c, prefs.answerWith).answer);
		return choices(q!.answer, others);
	});

	function next(update: LearnItem[]) {
		queue = update;
		turn++;
	}

	function onchoice(correct: boolean) {
		const item = queue[0];
		if (correct) next(requeue(queue, { ...item, stage: 'write' }));
		else next(requeue(queue, { ...item, misses: item.misses + 1 }));
	}

	function onwrite(verdict: Verdict, ms: number) {
		const item = queue[0];
		recordReview(item.card.id, ratingFor(verdict, item, ms));
		if (verdict === 'wrong') {
			next(requeue(queue, { ...item, misses: item.misses + 1 }));
		} else {
			finished.push(item);
			next(queue.slice(1));
			if (!queue.length) play('complete');
		}
	}
</script>

<div class="mb-4 flex items-center gap-3">
	<div class="h-2 flex-1 overflow-hidden rounded-full bg-line">
		<div
			class="h-full bg-accent transition-all"
			style:width="{(finished.length / cards.length) * 100}%"
		></div>
	</div>
	<span class="text-sm text-muted tabular-nums">{finished.length}/{cards.length}</span>
</div>

{#if current && q}
	{#key turn}
		{#if current.stage === 'choice'}
			<MultipleChoice
				prompt={q.prompt}
				promptLang={q.promptLang}
				answer={q.answer}
				{options}
				onresult={onchoice}
			/>
		{:else}
			<WriteQuestion {...q} onresult={onwrite} />
		{/if}
	{/key}
{:else}
	{@const perfect = finished.filter((i) => i.misses === 0).length}
	<div class="space-y-6 card p-6 sm:p-8">
		<div class="text-center">
			<p class="text-4xl" aria-hidden="true">🎉</p>
			<h2 class="mt-2 text-xl font-semibold">Session complete</h2>
			<p class="text-muted">{perfect} of {finished.length} right on the first try</p>
		</div>
		{#if finished.some((i) => i.misses)}
			<div>
				<h3 class="mb-2 text-sm font-semibold text-muted">Words to keep an eye on</h3>
				<ul class="divide-y divide-line rounded-lg border border-line">
					{#each finished
						.filter((i) => i.misses)
						.sort((a, b) => b.misses - a.misses) as item (item.card.id)}
						<li class="flex items-center gap-3 px-3 py-2">
							<span class="flex items-center font-medium"
								>{item.card.term}<SpeakButton
									text={item.card.term}
									lang={item.card.termLang}
									class="p-1"
								/></span
							>
							<span class="flex-1 text-muted">{item.card.definition}</span>
							<span class="text-xs text-bad">missed {item.misses}×</span>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
		<div class="flex flex-wrap justify-center gap-2">
			{#if onrestart}<button class="btn-primary" onclick={onrestart}>Keep going</button>{/if}
			<a class="btn-secondary" href="/">Back to library</a>
		</div>
	</div>
{/if}
