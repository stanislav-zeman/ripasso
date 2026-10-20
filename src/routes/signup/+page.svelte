<script lang="ts">
	import AuthForm from '#lib/components/AuthForm.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head><title>Sign up · Ripasso</title></svelte:head>

<AuthForm mode="signup" {form} />
