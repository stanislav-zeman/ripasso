<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		mode: string;
		backHref: string;
		done?: number;
		total?: number;
		children?: Snippet;
	}

	let { title, mode, backHref, done, total, children }: Props = $props();
</script>

<div class="mb-6 space-y-3">
	<div class="flex items-center gap-3">
		<a href={backHref} class="btn-ghost px-2" aria-label="Back">←</a>
		<div class="min-w-0 flex-1">
			<p class="text-xs font-semibold tracking-wide text-accent uppercase">{mode}</p>
			<h1 class="truncate font-semibold">{title}</h1>
		</div>
		{@render children?.()}
	</div>
	{#if total}
		<div class="flex items-center gap-3">
			<div class="h-2 flex-1 overflow-hidden rounded-full bg-line">
				<div
					class="h-full bg-accent transition-all"
					style:width="{((done ?? 0) / total) * 100}%"
				></div>
			</div>
			<span class="text-sm text-muted tabular-nums">{done}/{total}</span>
		</div>
	{/if}
</div>
