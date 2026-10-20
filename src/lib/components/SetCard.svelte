<script lang="ts">
	interface Props {
		set: {
			id: string;
			title: string;
			description: string;
			cards: number;
			ownerName?: string;
			visibility?: string;
			due?: number;
		};
		showOwner?: boolean;
	}

	let { set, showOwner = false }: Props = $props();
</script>

<a
	href="/sets/{set.id}"
	class="flex flex-col gap-2 card p-4 transition hover:-translate-y-0.5 hover:border-accent"
>
	<div class="flex items-start gap-2">
		<h3 class="flex-1 font-semibold">{set.title}</h3>
		{#if set.due}<span class="chip shrink-0">{set.due} due</span>{/if}
	</div>
	{#if set.description}<p class="line-clamp-2 text-sm text-muted">{set.description}</p>{/if}
	<p class="mt-auto text-xs text-muted">
		{set.cards} card{set.cards === 1 ? '' : 's'}
		{#if showOwner && set.ownerName}· by {set.ownerName}{/if}
		{#if set.visibility && set.visibility !== 'private'}· {set.visibility}{/if}
	</p>
</a>
