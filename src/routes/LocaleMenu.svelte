<script lang="ts">
	import { setLocale } from '$lib/paraglide/runtime';
</script>

<ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
	<li>
		<button type="button" onclick={() => setLocale('ru')}>Русский</button>
	</li>
	<li>
		<button type="button" onclick={() => setLocale('en')}>English</button>
	</li>
</ul>
