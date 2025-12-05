<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import type { Action } from 'svelte/action';
	import * as variants from '$lib/variants';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	const { data }: PageProps = $props();

	let variantsDSL = $state(`
= вариант первый
    + это первый плюс варианта
    - а это минус варианта
    + это еще один плюс варианта, плюсы и минусы складыватся
    т? открытый вопрос про требуемое время на этот вариант
    c - минус балл от стоимости
= вариант второй
    - у этого варианта такой минус
    с+ и плюс один балл к строимости
    k+ бал к качеству
= третий вариант
    - минус номер один
    - минус номер два
        интересно а что если добавить строки внизу
        и у этих строк не будет обозначений
    с++ два балла к стоимости варианта
    т+ один балл к требуемуму времени
    t+ кажется еще на это время потратится
    k+ бал к качеству
    к+ еще бал к качеству
= вариант четыре
    + один плюс
    + еще один плюс
    ++ двойной плюс
    ? открытый вопрос
    ? еще один вопрос
    t- можно указывать минусы к времени (в сравнении с другими вариантами)
    c- можно минусить стоимость
    c- можно минусить еще
    `);

	const autoResize: Action<HTMLTextAreaElement> = (node) => {
		// Функция подгонки высоты
		const resize = () => {
			node.style.height = 'auto';
			node.style.height = node.scrollHeight + 'px';
		};

		// 1) Сразу подогнать (после первого рендера в DOM)
		//    через requestAnimationFrame, чтобы scrollHeight был корректен
		requestAnimationFrame(resize);

		// 2) Подгонять при каждом вводе
		node.addEventListener('input', resize);

		return {
			destroy() {
				node.removeEventListener('input', resize);
			}
		};
	};

	const sortings: {
		id: string;
		title: string;
		sort_func: (v: variants.Variant) => number;
		order: 'asc' | 'desc';
	}[] = [
		{
			id: 'score',
			title: 'По плюсам',
			sort_func: (v: variants.Variant): number => v.score, // v.pros - v.cons,
			order: 'desc'
		},
		{
			id: 'time',
			title: 'По скорости',
			sort_func: (v: variants.Variant): number => v.time,
			order: 'asc'
		},
		{
			id: 'cost',
			title: 'По дешевизне',
			sort_func: (v: variants.Variant): number => v.cost,
			order: 'asc'
		},
		{
			id: 'quality',
			title: 'По качеству',
			sort_func: (v: variants.Variant): number => v.quality,
			order: 'desc'
		},
		{
			id: 'questions',
			title: 'По понятности',
			sort_func: (v: variants.Variant): number => v.questions.length,
			order: 'asc'
		}
	];

	const currentSorting = $derived.by(() => {
		return sortings.find((s) => s.id == data.sortby) ?? sortings[0];
	});

	const variantsArray = $derived.by(() => {
		const collection = variants.parseDSL(variantsDSL);

		// return collection.orderBy((v) => v.pros - v.cons, true).toArray();
		return collection.orderBy(currentSorting.sort_func, currentSorting.order).toArray();
	});

	function selectSorting(sortingName: string) {
		const url = new URL(page.url);
		url.searchParams.set('sortby', sortingName);
		goto(`${url.pathname}?${url.searchParams.toString()}`, { replaceState: true });
	}
</script>

<div class="flex min-h-screen">
	<!-- Левая колонка -->
	<div class="bg-base-200 w-1/2 p-8">
		<h2 class="mb-4 text-lg font-bold">Левый контент</h2>
		<textarea
			use:autoResize
			bind:value={variantsDSL}
			class="textarea textarea-borderedw-full min-h-10 w-full"
		>
		</textarea>
	</div>

	<!-- Правая колонка -->
	<div class="bg-base-300 w-1/2 p-8">
		<div class="w-full">
			<div class="mb-4 space-x-2">
				{#each sortings as sorting}
					<button
						class={{ btn: true, outline: sorting.id === data.sortby }}
						onclick={() => selectSorting(sorting.id)}
					>
						{sorting.title}
					</button>
				{/each}
			</div>
		</div>

		{#each variantsArray as variant}
			<div class="card bg-base-100 card-md my-1 w-full shadow-sm">
				<div class="card-body p-4 pb-2">
					<div class="flex">
						<div class="w-9/12">
							<h2 class="text-lg font-semibold first-letter:uppercase">{variant.title}</h2>

							<p class="whitespace-pre-wrap">
								{#each variant.rawLines
									.filter((l) => l.type != 'title')
									.sort( (l1, l2) => (l1.type == l2.type ? 0 : l1.type == data.sortby ? -1 : 1) ) as line}
									<span
										class={{
											'opacity-50': line.type != data.sortby,
											'bg-success-content':
												(line.type == data.sortby &&
													currentSorting.order == 'desc' &&
													line.sign == '+') ||
												(line.type == data.sortby &&
													currentSorting.order == 'asc' &&
													line.sign == '-'),
											'bg-error-content':
												(line.type == data.sortby &&
													currentSorting.order == 'desc' &&
													line.sign == '-') ||
												(line.type == data.sortby &&
													currentSorting.order == 'asc' &&
													line.sign == '+'),
											'bg-info-content': line.type == 'questions'
										}}
									>
										{line.text.trim() + '\n'}
									</span>
								{/each}
							</p>
						</div>
						<div class="w-3/12">
							<span class={{ 'opacity-50': data.sortby != 'score' }}> Плюсы: {variant.score}<br/></span>

							<span class={{ 'opacity-50 p-1': data.sortby != 'time' }}> Время: {variant.time}<br/></span>

							<span class={{ 'opacity-50': data.sortby != 'cost' }}> Стоимость: {variant.time}<br/></span>

							<span class={{ 'opacity-50': data.sortby != 'quality' }}> Качество: {variant.time}<br/></span>

							<span class={{ 'opacity-50': data.sortby != 'questions' }}> Вопросы: {variant.questions.length}<br/></span>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
