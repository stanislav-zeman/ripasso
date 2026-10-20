<script lang="ts">
	import { untrack } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import LearnSession from '#lib/components/LearnSession.svelte';
	import StudyHeader from '#lib/components/StudyHeader.svelte';
	import StudyOptions from '#lib/components/StudyOptions.svelte';
	import { shuffle } from '#lib/study/shuffle.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let session = $state(0);
	let cards = $state.raw(untrack(() => shuffle(data.cards)));

	function newSession() {
		cards = shuffle(data.cards);
		session++;
	}

	async function restart() {
		await invalidateAll();
		newSession();
	}
</script>

<svelte:head><title>Daily review · Ripasso</title></svelte:head>

<StudyHeader title="Everything due today" mode="Daily review" backHref="/">
	<StudyOptions show={['answerWith']} onchange={newSession} />
</StudyHeader>

{#if cards.length}
	{#key session}
		<LearnSession {cards} onrestart={restart} />
	{/key}
{:else}
	<div class="space-y-4 card p-8 text-center">
		<p class="text-4xl" aria-hidden="true">☕</p>
		<h2 class="text-xl font-semibold">Nothing to review right now</h2>
		<p class="text-muted">
			Cards you've learned come back here when they're due. Learn some new words in the meantime.
		</p>
		<a class="btn-primary" href="/">Go to your library</a>
	</div>
{/if}
