<script lang="ts">
	import MultipleChoice from '#lib/components/MultipleChoice.svelte';
	import StudyHeader from '#lib/components/StudyHeader.svelte';
	import StudyOptions from '#lib/components/StudyOptions.svelte';
	import { play } from '#lib/sound.svelte.ts';
	import { prefs, sides } from '#lib/study/prefs.svelte.ts';
	import { choices, shuffle } from '#lib/study/shuffle.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	interface Question {
		id: string;
		prompt: string;
		promptLang: string;
		answer: string;
		options: string[];
	}

	let questions = $state<Question[]>([]);
	let index = $state(0);
	let wrong = $state<Question[]>([]);
	let length = $state(20);

	const starredCount = $derived(data.cards.filter((c) => c.starred).length);
	const current = $derived(questions[index]);
	const score = $derived(
		questions.length ? Math.round(((questions.length - wrong.length) / questions.length) * 100) : 0
	);

	function start() {
		const pool =
			prefs.starredOnly && starredCount ? data.cards.filter((c) => c.starred) : data.cards;
		const all = data.cards.map((c) => sides(c, data.set, prefs.answerWith));
		questions = shuffle(pool)
			.slice(0, length || undefined)
			.map((c) => {
				const s = sides(c, data.set, prefs.answerWith);
				return {
					id: c.id,
					prompt: s.prompt,
					promptLang: s.promptLang,
					answer: s.answer,
					// Cards with the same prompt (synonyms) would also be right, so they can't be distractors.
					options: choices(
						s.answer,
						all.filter((o) => o.prompt !== s.prompt).map((o) => o.answer)
					)
				};
			});
		index = 0;
		wrong = [];
	}
	start();

	function onresult(correct: boolean) {
		if (!correct) wrong.push(current);
		index++;
		if (index === questions.length) play('complete');
	}
</script>

<svelte:head><title>Test · {data.set.title}</title></svelte:head>

<StudyHeader
	title={data.set.title}
	mode="Test"
	backHref="/sets/{data.set.id}"
	done={index}
	total={questions.length}
>
	<StudyOptions
		langs={data.set}
		{starredCount}
		show={['answerWith', 'starredOnly']}
		onchange={start}
	/>
</StudyHeader>

{#if data.cards.length < 2}
	<p class="text-muted">Add at least two cards to take a test.</p>
{:else if current}
	{#key index}
		<MultipleChoice
			prompt={current.prompt}
			promptLang={current.promptLang}
			options={current.options}
			answer={current.answer}
			{onresult}
		/>
	{/key}
{:else}
	<div class="space-y-6 card p-6 sm:p-8">
		<div class="text-center">
			<p
				class="text-5xl font-bold {score >= 80
					? 'text-good'
					: score >= 50
						? 'text-warn'
						: 'text-bad'}"
			>
				{score}%
			</p>
			<p class="mt-2 text-muted">{questions.length - wrong.length} of {questions.length} correct</p>
		</div>
		{#if wrong.length}
			<div>
				<h3 class="mb-2 text-sm font-semibold text-muted">Review your mistakes</h3>
				<ul class="divide-y divide-line rounded-lg border border-line">
					{#each wrong as question (question.id)}
						<li class="grid grid-cols-2 gap-3 px-3 py-2">
							<span>{question.prompt}</span><span class="font-medium text-good"
								>{question.answer}</span
							>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
		<div class="flex flex-wrap items-center justify-center gap-2">
			<label class="flex items-center gap-2 text-sm">
				Questions
				<select class="input mt-0 w-auto py-1" bind:value={length}>
					<option value={10}>10</option>
					<option value={20}>20</option>
					<option value={50}>50</option>
					<option value={0}>All</option>
				</select>
			</label>
			<button class="btn-primary" onclick={start}>New test</button>
		</div>
	</div>
{/if}
