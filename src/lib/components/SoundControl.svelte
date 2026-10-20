<script lang="ts">
	import { isSilent, play, saveSound, sound } from '#lib/sound.svelte.ts';

	let open = $state(false);
	let root = $state<HTMLElement>();

	const silent = $derived(isSilent());
	const percent = $derived(Math.round(sound.volume * 100));

	function setVolume(e: Event) {
		sound.volume = Number((e.currentTarget as HTMLInputElement).value) / 100;
		// Moving the slider up means you want to hear it.
		if (sound.volume > 0) sound.muted = false;
		saveSound();
	}

	function toggleMute() {
		if (sound.volume === 0) {
			sound.volume = 0.6;
			sound.muted = false;
		} else {
			sound.muted = !sound.muted;
		}
		saveSound();
		if (!sound.muted) play('correct');
	}

	function onwindowclick(e: MouseEvent) {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onclick={onwindowclick} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="relative" bind:this={root}>
	<button
		type="button"
		class="btn-ghost px-2.5 py-1.5"
		title="Sound effects"
		aria-label="Sound effects: {silent ? 'off' : `${percent}%`}"
		aria-expanded={open}
		aria-controls="sound-menu"
		onclick={() => (open = !open)}
	>
		<svg
			class="size-5"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M11 5 6 9H2v6h4l5 4V5z" />
			{#if silent}
				<path d="m22 9-6 6M16 9l6 6" />
			{:else}
				<path d="M15.5 8.5a5 5 0 0 1 0 7" />
				{#if sound.volume > 0.5}<path d="M19 5a10 10 0 0 1 0 14" />{/if}
			{/if}
		</svg>
	</button>

	{#if open}
		<div
			id="sound-menu"
			class="fixed inset-x-4 top-16 z-20 space-y-3 card p-4 shadow-lg sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-64"
		>
			<div class="flex items-center justify-between">
				<span class="text-sm font-semibold">Sound effects</span>
				<button type="button" class="btn-secondary px-2.5 py-1 text-xs" onclick={toggleMute}>
					{silent ? 'Turn on' : 'Mute'}
				</button>
			</div>
			<label class="flex items-center gap-3 text-sm text-muted">
				<span class="sr-only">Volume</span>
				<input
					type="range"
					min="0"
					max="100"
					step="5"
					value={sound.muted ? 0 : percent}
					oninput={setVolume}
					onchange={() => play('correct')}
					class="h-2 flex-1 cursor-pointer accent-accent"
					aria-valuetext="{sound.muted ? 0 : percent}%"
				/>
				<span class="w-9 text-right tabular-nums">{sound.muted ? 0 : percent}%</span>
			</label>
			<p class="text-xs text-muted">Plays when you answer. Saved in this browser.</p>
		</div>
	{/if}
</div>
