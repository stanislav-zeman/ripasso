<script lang="ts">
	interface Props {
		/** The input that receives the characters. */
		target: HTMLInputElement | undefined;
		chars?: string[];
	}

	let { target, chars = ['à', 'è', 'é', 'ì', 'ò', 'ù'] }: Props = $props();

	function insert(char: string) {
		if (!target) return;
		const start = target.selectionStart ?? target.value.length;
		const end = target.selectionEnd ?? start;
		target.setRangeText(char, start, end, 'end');
		target.dispatchEvent(new Event('input', { bubbles: true }));
		target.focus();
	}
</script>

<div class="flex flex-wrap gap-1.5">
	{#each chars as char (char)}
		<button
			type="button"
			class="min-w-9 rounded-md border border-line bg-surface px-2 py-1 font-medium hover:border-accent"
			onmousedown={(e) => e.preventDefault()}
			onclick={() => insert(char)}>{char}</button
		>
	{/each}
</div>
