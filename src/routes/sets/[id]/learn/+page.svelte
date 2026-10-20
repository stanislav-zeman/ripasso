<script lang="ts">
	import { untrack } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import LearnSession from '#lib/components/LearnSession.svelte';
	import StudyHeader from '#lib/components/StudyHeader.svelte';
	import StudyOptions from '#lib/components/StudyOptions.svelte';
	import { prefs } from '#lib/study/prefs.svelte.ts';
	import { shuffle } from '#lib/study/shuffle.ts';
	import type { LearnCard } from '#lib/study/learn.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const NEW_PER_SESSION = 10;

	let session = $state(0);
	let practiceAhead = $state(false);

	const all = $derived<(LearnCard & { due: Date | null; starred: boolean })[]>(
		data.cards.map((c) => ({ ...c, termLang: data.set.termLang, defLang: data.set.defLang }))
	);
	const starredCount = $derived(all.filter((c) => c.starred).length);

	function pick(): LearnCard[] {
		const now = Date.now();
		const pool = prefs.starredOnly && starredCount ? all.filter((c) => c.starred) : all;
		const due = pool.filter((c) => c.state !== 0 && c.due && c.due.getTime() <= now);
		const fresh = pool.filter((c) => c.state === 0).slice(0, NEW_PER_SESSION);
		const picked = [...shuffle(due), ...fresh];
		if (picked.length || !practiceAhead) return picked;
		// Nothing due: practise the cards that will be due soonest.
		return [...pool]
			.sort((a, b) => (a.due?.getTime() ?? 0) - (b.due?.getTime() ?? 0))
			.slice(0, NEW_PER_SESSION);
	}

	let cards = $state.raw(untrack(pick));

	function newSession() {
		cards = pick();
		session++;
	}

	const nextDue = $derived(
		all
			.filter((c) => c.due)
			.reduce<Date | null>((min, c) => (!min || c.due! < min ? c.due : min), null)
	);

	async function restart() {
		await invalidateAll();
		newSession();
	}
</script>

<svelte:head><title>Learn · {data.set.title}</title></svelte:head>

<StudyHeader title={data.set.title} mode="Learn" backHref="/sets/{data.set.id}">
	<StudyOptions
		langs={data.set}
		{starredCount}
		show={['answerWith', 'starredOnly']}
		onchange={newSession}
	/>
</StudyHeader>

{#if cards.length}
	{#key session}
		<LearnSession {cards} pool={all} onrestart={restart} />
	{/key}
{:else}
	<div class="space-y-4 card p-8 text-center">
		<p class="text-4xl" aria-hidden="true">✨</p>
		<h2 class="text-xl font-semibold">All caught up!</h2>
		<p class="text-muted">
			You've learned every card in this set.
			{#if nextDue}Next review {nextDue.toLocaleString(undefined, {
					dateStyle: 'medium',
					timeStyle: 'short'
				})}.{/if}
		</p>
		<div class="flex flex-wrap justify-center gap-2">
			<button
				class="btn-primary"
				onclick={() => {
					practiceAhead = true;
					newSession();
				}}>Practise anyway</button
			>
			<a class="btn-secondary" href="/sets/{data.set.id}/write">Try Write mode</a>
		</div>
	</div>
{/if}
