<script lang="ts">
	import { LEVEL_NAMES, type Level } from '#lib/levels.ts';

	let { level }: { level: Level } = $props();
</script>

<span
	class="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent"
	title="{level} · {LEVEL_NAMES[level]}">{level}</span
>
