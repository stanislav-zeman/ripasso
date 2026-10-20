<script lang="ts">
	import { play } from '#lib/sound.svelte.ts';
	import SpeakButton from './SpeakButton.svelte';

	interface Props {
		prompt: string;
		promptLang: string;
		options: string[];
		answer: string;
		onresult: (correct: boolean) => void;
	}

	let { prompt, promptLang, options, answer, onresult }: Props = $props();
	let picked = $state<string | null>(null);

	function pick(option: string) {
		if (picked !== null) return;
		picked = option;
		const correct = option === answer;
		play(correct ? 'correct' : 'wrong');
		setTimeout(() => onresult(correct), correct ? 600 : 1500);
	}

	function onkeydown(e: KeyboardEvent) {
		const n = Number(e.key);
		if (n >= 1 && n <= options.length && !(e.target instanceof HTMLInputElement))
			pick(options[n - 1]);
	}

	function style(option: string) {
		if (picked === null) return 'hover:border-accent';
		if (option === answer) return 'border-good bg-good/10';
		if (option === picked) return 'border-bad bg-bad/10';
		return 'opacity-50';
	}
</script>

<svelte:window {onkeydown} />

<div class="card p-5 sm:p-8">
	<div class="flex items-start justify-between gap-2">
		<p class="text-2xl font-semibold sm:text-3xl">{prompt}</p>
		<SpeakButton text={prompt} lang={promptLang} />
	</div>
	<p class="mt-8 mb-3 text-sm text-muted">Choose the matching answer</p>
	<div class="grid gap-3 sm:grid-cols-2">
		{#each options as option, i (option)}
			<button
				type="button"
				class="flex items-center gap-3 rounded-lg border-2 border-line p-4 text-left transition {style(
					option
				)}"
				disabled={picked !== null}
				onclick={() => pick(option)}
			>
				<span
					class="flex size-6 shrink-0 items-center justify-center rounded-full bg-bg text-xs text-muted"
					>{i + 1}</span
				>
				{option}
			</button>
		{/each}
	</div>
</div>
