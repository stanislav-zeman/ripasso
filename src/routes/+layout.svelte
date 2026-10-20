<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import SoundControl from '#lib/components/SoundControl.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const links = [
		{ href: '/', label: 'Library' },
		{ href: '/review', label: 'Review' },
		{ href: '/explore', label: 'Explore' }
	];

	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="border-b border-line bg-surface">
	<nav class="mx-auto flex max-w-4xl items-center gap-1 px-4 py-3">
		<a href="/" class="mr-2 flex shrink-0 items-center gap-2 text-lg font-bold">
			<img src={favicon} alt="" class="size-7" />
			Ripasso
		</a>
		{#if data.user}
			{#each links as link (link.href)}
				<a
					href={link.href}
					class="hidden rounded-lg px-3 py-1.5 text-sm font-medium sm:block {isActive(link.href)
						? 'bg-accent-soft text-accent'
						: 'text-muted hover:text-ink'}">{link.label}</a
				>
			{/each}
			<div class="ml-auto flex items-center gap-1 sm:gap-2">
				<SoundControl />
				<a href="/sets/new" class="btn-primary px-3 py-1.5 whitespace-nowrap" aria-label="New set"
					>+<span class="hidden sm:inline"> New set</span></a
				>
				<form method="post" action="/logout">
					<button
						class="btn-ghost px-2.5 py-1.5 whitespace-nowrap sm:px-3"
						title="Log out ({data.user.name})">Log out</button
					>
				</form>
			</div>
		{:else}
			<a
				href="/explore"
				class="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:text-ink sm:block"
				>Explore</a
			>
			<div class="ml-auto flex items-center gap-1 sm:gap-2">
				<SoundControl />
				<a href="/login" class="btn-ghost px-2.5 py-1.5 whitespace-nowrap sm:px-3">Log in</a>
				<a href="/signup" class="btn-primary px-2.5 py-1.5 whitespace-nowrap sm:px-3">Sign up</a>
			</div>
		{/if}
	</nav>
	{#if data.user}
		<div class="flex justify-around border-t border-line sm:hidden">
			{#each links as link (link.href)}
				<a
					href={link.href}
					class="flex-1 py-2 text-center text-sm font-medium {isActive(link.href)
						? 'text-accent'
						: 'text-muted'}">{link.label}</a
				>
			{/each}
		</div>
	{/if}
</header>

<main class="mx-auto max-w-4xl px-4 py-6 sm:py-8">
	{@render children()}
</main>
