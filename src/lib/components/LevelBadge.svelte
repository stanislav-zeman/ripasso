<script lang="ts">
	import { LEVEL_HUES, LEVEL_NAMES, type Level } from '#lib/levels.ts';

	let { level }: { level: Level } = $props();
</script>

<span
	class="badge inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
	style:--hue={LEVEL_HUES[level]}
	title="{level} · {LEVEL_NAMES[level]}">{level}</span
>

<style>
	.badge {
		background: oklch(94% 0.07 var(--hue));
		color: oklch(45% 0.12 var(--hue));
		box-shadow: inset 0 0 0 1px oklch(85% 0.09 var(--hue));
	}

	@media (prefers-color-scheme: dark) {
		.badge {
			background: oklch(33% 0.07 var(--hue));
			color: oklch(87% 0.13 var(--hue));
			box-shadow: inset 0 0 0 1px oklch(42% 0.08 var(--hue));
		}
	}
</style>
