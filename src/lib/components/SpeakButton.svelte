<script lang="ts">
	import { onMount } from 'svelte';
	import { canSpeak, speak } from '#lib/tts.ts';

	interface Props {
		text: string;
		lang: string;
		class?: string;
	}

	let { text, lang, class: className = '' }: Props = $props();
	let supported = $state(false);

	onMount(() => (supported = canSpeak()));
</script>

{#if supported}
	<button
		type="button"
		class="rounded-full p-2 text-muted transition hover:bg-bg hover:text-accent {className}"
		title="Listen"
		aria-label="Listen to “{text}”"
		onclick={(e) => {
			e.stopPropagation();
			speak(text, lang);
		}}
	>
		<svg
			class="size-5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path
				d="M19 5a10 10 0 0 1 0 14"
			/>
		</svg>
	</button>
{/if}
