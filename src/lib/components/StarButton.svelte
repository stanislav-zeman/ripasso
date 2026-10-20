<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { saveStar } from '#lib/study/api.ts';

	interface Props {
		cardId: string;
		starred: boolean;
		disabled?: boolean;
	}

	let { cardId, starred = $bindable(), disabled = false }: Props = $props();

	async function toggle(e: MouseEvent) {
		e.stopPropagation();
		starred = !starred;
		try {
			await saveStar(cardId, starred);
			// Refresh the set so other study modes see the change (e.g. "starred only").
			invalidateAll();
		} catch {
			starred = !starred;
		}
	}
</script>

<button
	type="button"
	class="rounded-full p-2 transition hover:bg-bg {starred
		? 'text-warn'
		: 'text-muted hover:text-warn'}"
	title={disabled ? 'Log in to star cards' : starred ? 'Unstar' : 'Star'}
	aria-label={starred ? 'Unstar card' : 'Star card'}
	aria-pressed={starred}
	{disabled}
	onclick={toggle}
>
	<svg
		class="size-5"
		viewBox="0 0 24 24"
		fill={starred ? 'currentColor' : 'none'}
		stroke="currentColor"
		stroke-width="2"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z" />
	</svg>
</button>
