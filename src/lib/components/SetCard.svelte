<script lang="ts">
	import { languageFlag, languageName } from '#lib/languages.ts';
	import type { Level } from '#lib/levels.ts';
	import LevelBadge from './LevelBadge.svelte';

	interface Props {
		set: {
			id: string;
			title: string;
			termLang: string;
			level: Level | null;
			description: string;
			cards: number;
			ownerId?: string;
			ownerName?: string;
			visibility?: string;
			due?: number;
		};
		showOwner?: boolean;
	}

	let { set, showOwner = false }: Props = $props();
</script>

<!-- The title link stretches over the whole card; the author link sits above it. -->
<article
	class="relative flex flex-col gap-2 card p-4 transition focus-within:border-accent hover:-translate-y-0.5 hover:border-accent"
>
	<div class="flex items-start gap-2">
		<h3 class="flex-1 font-semibold">
			<a
				href="/sets/{set.id}"
				class="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
				>{set.title}</a
			>
		</h3>
		{#if set.due}<span class="chip shrink-0">{set.due} due</span>{/if}
	</div>
	<p class="flex flex-wrap items-center gap-1.5">
		<span
			class="inline-flex items-center gap-1.5 rounded-full bg-bg py-0.5 pr-2.5 pl-1.5 text-xs font-medium ring-1 ring-line"
			><span class="text-base leading-none" aria-hidden="true">{languageFlag(set.termLang)}</span
			>{languageName(set.termLang)}</span
		>
		{#if set.level}<LevelBadge level={set.level} />{/if}
	</p>
	{#if set.description}<p class="line-clamp-2 text-sm text-muted">{set.description}</p>{/if}
	<p class="mt-auto text-xs text-muted">
		{set.cards} card{set.cards === 1 ? '' : 's'}
		{#if showOwner && set.ownerName}
			· by
			{#if set.ownerId}<a
					href="/users/{set.ownerId}"
					class="relative z-10 font-medium text-ink/80 hover:text-accent hover:underline"
					>{set.ownerName}</a
				>{:else}{set.ownerName}{/if}
		{/if}
		{#if set.visibility && set.visibility !== 'private'}· {set.visibility}{/if}
	</p>
</article>
