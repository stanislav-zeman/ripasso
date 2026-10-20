<script lang="ts">
	import SetEditor from '#lib/components/SetEditor.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Edit {data.set.title} · Ripasso</title></svelte:head>

<div class="mb-6 flex items-center gap-3">
	<a href="/sets/{data.set.id}" class="btn-ghost px-2" aria-label="Back to set">←</a>
	<h1 class="text-2xl font-bold">Edit set</h1>
</div>
<SetEditor
	submitLabel="Save changes"
	message={form?.message}
	initial={{ ...data.set, cards: data.cards }}
/>
