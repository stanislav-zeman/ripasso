<script lang="ts">
	import SetEditor from '#lib/components/SetEditor.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head><title>New set · Ripasso</title></svelte:head>

<h1 class="mb-6 text-2xl font-bold">Create a new set</h1>
<SetEditor submitLabel="Create set" message={form?.message} />
