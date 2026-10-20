<script lang="ts">
	import type { Snippet } from 'svelte';
	import SpeakButton from './SpeakButton.svelte';

	interface Face {
		text: string;
		lang: string;
	}

	interface Props {
		front: Face;
		back: Face;
		flipped: boolean;
		onflip: () => void;
		actions?: Snippet;
	}

	let { front, back, flipped, onflip, actions }: Props = $props();
</script>

{#snippet face(f: Face, label: string)}
	<div class="absolute top-3 right-3 flex items-center">
		{@render actions?.()}
		<SpeakButton text={f.text} lang={f.lang} />
	</div>
	<span class="absolute top-4 left-4 text-xs font-semibold tracking-wide text-muted uppercase"
		>{label}</span
	>
	<p class="px-6 text-center text-3xl font-semibold break-words sm:text-4xl" lang={f.lang}>
		{f.text}
	</p>
{/snippet}

<div
	class="group h-72 w-full cursor-pointer perspective-[1200px] sm:h-80"
	role="button"
	tabindex="0"
	aria-label="Flip card"
	onclick={onflip}
	onkeydown={(e) => {
		if (e.key === 'Enter') onflip();
	}}
>
	<div
		class="relative h-full w-full transition-transform duration-500 transform-3d motion-reduce:transition-none"
		class:rotate-y-180={flipped}
	>
		<div class="absolute inset-0 flex items-center justify-center card shadow-sm backface-hidden">
			{@render face(front, 'Front')}
		</div>
		<div
			class="absolute inset-0 flex rotate-y-180 items-center justify-center card bg-accent-soft/40 shadow-sm backface-hidden"
		>
			{@render face(back, 'Back')}
		</div>
	</div>
</div>
