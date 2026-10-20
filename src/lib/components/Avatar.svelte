<script lang="ts">
	interface Props {
		name: string;
		image?: string | null;
		/** Size in pixels. */
		size?: number;
	}

	let { name, image, size = 40 }: Props = $props();

	let failed = $state(false);
	const initials = $derived(
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]!.toUpperCase())
			.join('')
	);
	// A stable colour per name, so the same person always looks the same.
	const hue = $derived([...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7));
</script>

{#if image && !failed}
	<img
		src={image}
		alt=""
		width={size}
		height={size}
		class="shrink-0 rounded-full object-cover"
		style:width="{size}px"
		style:height="{size}px"
		referrerpolicy="no-referrer"
		onerror={() => (failed = true)}
	/>
{:else}
	<span
		class="avatar inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
		style:--hue={hue}
		style:width="{size}px"
		style:height="{size}px"
		style:font-size="{size * 0.4}px"
		aria-hidden="true">{initials}</span
	>
{/if}

<style>
	.avatar {
		background: oklch(90% 0.06 var(--hue));
		color: oklch(40% 0.1 var(--hue));
	}

	@media (prefers-color-scheme: dark) {
		.avatar {
			background: oklch(35% 0.07 var(--hue));
			color: oklch(88% 0.08 var(--hue));
		}
	}
</style>
