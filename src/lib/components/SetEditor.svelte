<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { isLanguage, LANGUAGES, languageName } from '#lib/languages.ts';
	import { MAX_CARDS, parseCards, SEPARATORS, type Separator } from '#lib/parse.ts';

	interface EditorCard {
		key: string;
		id?: string;
		term: string;
		definition: string;
	}

	interface Props {
		initial?: {
			title: string;
			description: string;
			termLang: string;
			defLang: string;
			visibility: string;
			cards: { id: string; term: string; definition: string }[];
		};
		message?: string;
		submitLabel: string;
	}

	let { initial, message, submitLabel }: Props = $props();

	const IMPORT_EXAMPLE = 'el perro\tthe dog\nla casa\tthe house\ngracias\tthank you';
	const LANGS_KEY = 'ripasso:last-langs';

	// Editor state is seeded once from `initial`; later prop changes shouldn't overwrite edits.
	const seed = (() => initial)();
	let title = $state(seed?.title ?? '');
	let description = $state(seed?.description ?? '');
	// New sets start without a term language, so it's chosen deliberately (then remembered).
	let termLang = $state(seed?.termLang ?? '');
	let defLang = $state(seed?.defLang ?? 'en');
	let visibility = $state(seed?.visibility ?? 'private');
	let cards = $state<EditorCard[]>(seed?.cards.map((c) => ({ key: c.id, ...c })) ?? []);

	let importOpen = $state(!seed);
	let importText = $state('');
	let separator = $state<Separator>('auto');
	let pending = $state(false);

	const parsed = $derived(parseCards(importText, separator));
	const serialize = () =>
		JSON.stringify(cards.map(({ id, term, definition }) => ({ id, term, definition })));
	const payload = $derived(serialize());
	// Lines still waiting in the import box are added on save, so they count too.
	const filled = $derived(
		cards.filter((c) => c.term.trim() && c.definition.trim()).length + parsed.cards.length
	);

	onMount(() => {
		if (seed) return;
		try {
			const last = JSON.parse(localStorage.getItem(LANGS_KEY) ?? 'null');
			if (isLanguage(last?.termLang)) termLang = last.termLang;
			if (isLanguage(last?.defLang)) defLang = last.defLang;
			else {
				// Default definitions to the browser's language, if we know it.
				const browser = navigator.language.slice(0, 2);
				if (isLanguage(browser)) defLang = browser;
			}
		} catch {
			// Storage can be unavailable; the defaults are fine.
		}
	});

	function rememberLangs() {
		try {
			localStorage.setItem(LANGS_KEY, JSON.stringify({ termLang, defLang }));
		} catch {
			// Remembering the languages is a convenience only.
		}
	}

	function addCard() {
		cards.push({ key: crypto.randomUUID(), term: '', definition: '' });
	}

	function importCards() {
		// Replace trailing blank rows instead of leaving them above the imported cards.
		cards = cards.filter((c) => c.term.trim() || c.definition.trim());
		cards.push(...parsed.cards.map((c) => ({ key: crypto.randomUUID(), ...c })));
		importText = '';
		importOpen = false;
	}

	function move(index: number, delta: number) {
		const to = index + delta;
		if (to < 0 || to >= cards.length) return;
		[cards[index], cards[to]] = [cards[to], cards[index]];
	}

	function swapSides() {
		cards = cards.map((c) => ({ ...c, term: c.definition, definition: c.term }));
		[termLang, defLang] = [defLang, termLang];
	}
</script>

<form
	method="post"
	use:enhance={({ formData }) => {
		if (parsed.cards.length) {
			importCards();
			formData.set('cards', serialize());
		}
		rememberLangs();
		pending = true;
		return async ({ update }) => {
			await update({ reset: false });
			pending = false;
		};
	}}
	class="space-y-6"
>
	<input type="hidden" name="cards" value={payload} />

	<section class="space-y-4 card p-4 sm:p-6">
		<label class="block">
			<span class="label">Title</span>
			<input
				class="input text-lg"
				name="title"
				bind:value={title}
				required
				maxlength="200"
				placeholder="e.g. Food & drink – A1"
			/>
		</label>
		<label class="block">
			<span class="label">Description <span class="font-normal text-muted">(optional)</span></span>
			<textarea class="input" name="description" rows="2" bind:value={description} maxlength="2000"
			></textarea>
		</label>
		<div class="grid gap-4 sm:grid-cols-3">
			<label class="block">
				<span class="label">Term language</span>
				<select class="input" name="termLang" bind:value={termLang} required>
					<option value="" disabled>Choose…</option
					>{#each Object.entries(LANGUAGES) as [code, lang] (code)}<option value={code}
							>{lang.name}</option
						>{/each}
				</select>
			</label>
			<label class="block">
				<span class="label">Definition language</span>
				<select class="input" name="defLang" bind:value={defLang} required>
					{#each Object.entries(LANGUAGES) as [code, lang] (code)}<option value={code}
							>{lang.name}</option
						>{/each}
				</select>
			</label>
			<label class="block">
				<span class="label">Visibility</span>
				<select class="input" name="visibility" bind:value={visibility}>
					<option value="private">Private – only you</option>
					<option value="unlisted">Unlisted – anyone with the link</option>
					<option value="public">Public – listed in Explore</option>
				</select>
			</label>
		</div>
	</section>

	<section class="card p-4 sm:p-6">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h2 class="font-semibold">Import from text</h2>
			<button type="button" class="btn-ghost" onclick={() => (importOpen = !importOpen)}>
				{importOpen ? 'Hide' : 'Show'}
			</button>
		</div>
		{#if importOpen}
			<p class="mt-1 text-sm text-muted">
				One card per line, term first. Paste a Quizlet export (“Tab” between term and definition) or
				lines like
				<code class="rounded bg-bg px-1 whitespace-nowrap">la casa - the house</code>.
			</p>
			<textarea
				class="input mt-3 font-mono text-sm"
				rows="8"
				bind:value={importText}
				placeholder={IMPORT_EXAMPLE}></textarea>
			<div class="mt-3 flex flex-wrap items-center gap-3">
				<label class="flex items-center gap-2 text-sm">
					Separator
					<select class="input mt-0 w-auto py-1" bind:value={separator}>
						{#each Object.entries(SEPARATORS) as [key, label] (key)}<option value={key}
								>{label}</option
							>{/each}
					</select>
				</label>
				<span class="text-sm text-muted">
					{parsed.cards.length} card{parsed.cards.length === 1 ? '' : 's'} found{#if parsed.skipped.length},
						{parsed.skipped.length} line{parsed.skipped.length === 1 ? '' : 's'} skipped{/if}
				</span>
				<button
					type="button"
					class="ml-auto btn-secondary"
					disabled={!parsed.cards.length}
					onclick={importCards}
				>
					Add {parsed.cards.length || ''} cards
				</button>
			</div>
			{#if parsed.cards.length}
				<ul
					class="mt-3 max-h-40 divide-y divide-line overflow-auto rounded-lg border border-line text-sm"
				>
					{#each parsed.cards.slice(0, 50) as c, i (i)}
						<li class="grid grid-cols-2 gap-3 px-3 py-1.5">
							<span>{c.term}</span><span class="text-muted">{c.definition}</span>
						</li>
					{/each}
				</ul>
			{/if}
		{/if}
	</section>

	<section class="space-y-3">
		<div class="flex items-center justify-between">
			<h2 class="font-semibold">
				Cards <span class="font-normal text-muted">({cards.length})</span>
			</h2>
			{#if cards.length}
				<button type="button" class="btn-ghost" onclick={swapSides}
					>⇄ Swap terms and definitions</button
				>
			{/if}
		</div>
		{#each cards as c, i (c.key)}
			<div class="flex gap-3 card p-3">
				<span class="w-6 pt-3 text-right text-sm text-muted">{i + 1}</span>
				<div class="grid flex-1 gap-2 sm:grid-cols-2">
					<input
						class="input mt-0"
						bind:value={c.term}
						placeholder={termLang ? `Term (${languageName(termLang)})` : 'Term'}
						aria-label="Term {i + 1}"
					/>
					<input
						class="input mt-0"
						bind:value={c.definition}
						placeholder={defLang ? `Definition (${languageName(defLang)})` : 'Definition'}
						aria-label="Definition {i + 1}"
					/>
				</div>
				<div class="flex flex-col sm:flex-row">
					<button
						type="button"
						class="btn-ghost px-2"
						title="Move up"
						disabled={i === 0}
						onclick={() => move(i, -1)}>↑</button
					>
					<button
						type="button"
						class="btn-ghost px-2"
						title="Move down"
						disabled={i === cards.length - 1}
						onclick={() => move(i, 1)}>↓</button
					>
					<button
						type="button"
						class="btn-ghost px-2 hover:text-bad"
						title="Delete card"
						onclick={() => cards.splice(i, 1)}>✕</button
					>
				</div>
			</div>
		{/each}
		<button
			type="button"
			class="btn-secondary w-full border-dashed py-3"
			onclick={addCard}
			disabled={cards.length >= MAX_CARDS}
		>
			+ Add card
		</button>
	</section>

	<div
		class="sticky bottom-3 flex items-center justify-end gap-3 card bg-surface/90 px-4 py-3 shadow-lg backdrop-blur"
	>
		{#if message}<p class="mr-auto text-sm text-bad" role="alert">{message}</p>{/if}
		<span class="text-sm text-muted">
			{#if !termLang}Choose a term language to save{:else}{filled} complete card{filled === 1
					? ''
					: 's'}{/if}
		</span>
		<button class="btn-primary" disabled={pending || !title.trim() || !termLang || !filled}
			>{submitLabel}</button
		>
	</div>
</form>
