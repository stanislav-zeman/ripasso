<script lang="ts">
	import { tick } from 'svelte';
	import { grade, type Verdict } from '#lib/grade.ts';
	import AccentBar from './AccentBar.svelte';
	import SpeakButton from './SpeakButton.svelte';

	interface Props {
		prompt: string;
		promptLang: string;
		answer: string;
		answerLang: string;
		/** Called once the learner moves on. `verdict` includes a manual "I was right" override. */
		onresult: (verdict: Verdict, ms: number) => void;
	}

	let { prompt, promptLang, answer, answerLang, onresult }: Props = $props();

	let value = $state('');
	let verdict = $state<Verdict | null>(null);
	let input = $state<HTMLInputElement>();
	let continueButton = $state<HTMLButtonElement>();
	const started = performance.now();
	let elapsed = 0;

	$effect(() => {
		input?.focus();
	});

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (verdict) return finish(verdict);
		elapsed = performance.now() - started;
		verdict = grade(value, answer);
		if (verdict === 'correct') {
			setTimeout(() => finish('correct'), 700);
		} else {
			await tick();
			continueButton?.focus();
		}
	}

	let finished = false;
	function finish(v: Verdict) {
		if (finished) return;
		finished = true;
		onresult(v, elapsed);
	}
</script>

<div class="card p-5 sm:p-8">
	<div class="flex items-start justify-between gap-2">
		<p class="text-2xl font-semibold sm:text-3xl">{prompt}</p>
		<SpeakButton text={prompt} lang={promptLang} />
	</div>

	<form class="mt-8 space-y-3" onsubmit={submit}>
		<label class="block">
			<span class="label text-muted">Type the answer</span>
			<input
				bind:this={input}
				bind:value
				class="input text-lg {verdict === 'correct'
					? 'border-good ring-1 ring-good'
					: verdict === 'wrong'
						? 'border-bad'
						: ''}"
				autocomplete="off"
				autocapitalize="off"
				spellcheck="false"
				lang={answerLang}
				readonly={verdict !== null}
			/>
		</label>
		{#if !verdict}
			<div class="flex flex-wrap items-center justify-between gap-3">
				{#if answerLang === 'it'}<AccentBar target={input} />{:else}<span></span>{/if}
				<div class="flex gap-2">
					<button
						type="button"
						class="btn-ghost"
						onclick={() => {
							elapsed = performance.now() - started;
							verdict = 'wrong';
							tick().then(() => continueButton?.focus());
						}}
					>
						Don't know
					</button>
					<button class="btn-primary">Answer</button>
				</div>
			</div>
		{:else if verdict === 'correct'}
			<p class="font-semibold text-good" role="status">Correct!</p>
		{:else}
			<div
				class="space-y-3 rounded-lg p-4 {verdict === 'accent' ? 'bg-warn/10' : 'bg-bad/10'}"
				role="status"
			>
				<p class="font-semibold {verdict === 'accent' ? 'text-warn' : 'text-bad'}">
					{verdict === 'accent' ? 'Almost – watch the accents' : 'Not quite'}
				</p>
				<div class="flex items-center gap-1">
					<span class="text-sm text-muted">Correct answer:</span>
					<span class="text-lg font-semibold">{answer}</span>
					<SpeakButton text={answer} lang={answerLang} class="p-1" />
				</div>
				<div class="flex flex-wrap justify-end gap-2">
					{#if verdict === 'wrong' && value.trim()}
						<button type="button" class="btn-ghost" onclick={() => finish('correct')}
							>I was right</button
						>
					{/if}
					<button bind:this={continueButton} class="btn-primary">Continue</button>
				</div>
			</div>
		{/if}
	</form>
</div>
