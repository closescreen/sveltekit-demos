<script lang="ts">
	import { goto } from '$app/navigation';
	import { menuItems } from './MenuItems';
</script>

<div class="grid gap-6 h-screen p-6">
	{#each menuItems.filter(i=>!i.is_main) as i}
		<a
			href={i.href}
			class="hero bg-base-100 border border-base-300 rounded-2xl shadow-lg
    cursor-pointer transition-all duration-300
    hover:bg-base-200 hover:shadow-xl"
		>
			<div class="hero-content text-center">
				<div class="max-w-md">
					<h1 class="text-4xl font-semibold text-neutral-500">{i.text}</h1>
					<p class="py-6 text-neutral-600">
						Элегантный переход между информационными пространствами
					</p>
					<button class="btn btn-outline btn-primary" onclick={() => goto(i.href)}>
						Открыть
					</button>
				</div>
			</div>
		</a>
	{/each}
</div>
