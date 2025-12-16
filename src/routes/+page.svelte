<script lang="ts">
	import { menuItems } from './MenuItems';
</script>

<div class="container mx-auto p-4">
	<h1>Примеры SvelteKit</h1>
	<ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
		{#each menuItems as i}
			<li><a href={i.href}>{i.text}</a></li>
		{/each}
	</ul>
</div>
