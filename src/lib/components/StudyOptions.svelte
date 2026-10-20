<script lang="ts">
	import { languageName } from '#lib/languages.ts';
	import { prefs, savePrefs, type Langs } from '#lib/study/prefs.svelte.ts';

	interface Props {
		/** Omit when cards come from sets in different languages. */
		langs?: Langs;
		/** Which options to show. */
		show?: ('answerWith' | 'starredOnly' | 'shuffle')[];
		starredCount?: number;
		onchange?: () => void;
	}

	let {
		langs,
		show = ['answerWith', 'starredOnly', 'shuffle'],
		starredCount = 0,
		onchange
	}: Props = $props();

	function changed() {
		savePrefs();
		onchange?.();
	}
</script>

<details class="relative">
	<summary class="btn-ghost cursor-pointer list-none px-3">Options</summary>
	<div class="absolute right-0 z-10 mt-2 w-64 space-y-3 card p-4 text-sm shadow-lg">
		{#if show.includes('answerWith')}
			<label class="block">
				<span class="label">Answer with</span>
				<select class="input" bind:value={prefs.answerWith} onchange={changed}>
					<option value="term">Term{langs ? ` (${languageName(langs.termLang)})` : ''}</option>
					<option value="definition"
						>Definition{langs ? ` (${languageName(langs.defLang)})` : ''}</option
					>
				</select>
			</label>
		{/if}
		{#if show.includes('starredOnly')}
			<label class="flex items-center gap-2">
				<input
					type="checkbox"
					class="rounded text-accent"
					bind:checked={prefs.starredOnly}
					onchange={changed}
					disabled={!starredCount && !prefs.starredOnly}
				/>
				Starred only ({starredCount})
			</label>
		{/if}
		{#if show.includes('shuffle')}
			<label class="flex items-center gap-2">
				<input
					type="checkbox"
					class="rounded text-accent"
					bind:checked={prefs.shuffle}
					onchange={changed}
				/>
				Shuffle
			</label>
		{/if}
	</div>
</details>
