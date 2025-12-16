<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { menuItems } from './MenuItems';
	import LocaleMenu from './LocaleMenu.svelte';
	import { m } from '$lib/paraglide/messages';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="navbar bg-base-100">
	<!-- Левая часть: выпадающее меню -->
	<div class="navbar-start">
		<div class="dropdown dropdown-hover">
			<div tabindex="0" role="button" class="btn btn-ghost">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</div>
			<ul
				tabindex="-1"
				class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm"
			>
				{#each menuItems as i}
					<li><a href={i.href}>{i.text}</a></li>
				{/each}
			</ul>
		</div>
	</div>

	<!-- Центр: название -->
	<div class="navbar-center">
		<p class="btn btn-ghost text-xl">{m.site_title()}</p>
	</div>

	<!-- Правая часть: переключатель языка -->
	<div class="navbar-end">
		<div class="dropdown dropdown-end dropdown-hover">
			<div tabindex="0" role="button" class="btn btn-ghost">Язык</div>
			<LocaleMenu />
		</div>
	</div>
</div>

{@render children()}
