<script lang="ts">
	import type { PageProps } from './$types';
	import type { Action } from 'svelte/action';
	import * as variants from '$lib/variants';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages';
	import { fade, slide } from 'svelte/transition';

	const { data }: PageProps = $props();
	const { sortby = 'score' } = data;

	let advancedMode = $state(false);

	let variantsDSL = $state(
		`= 
+ 
- 

= 
+ 
- 
`
	);

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
		description: string;
		isAdvanced: boolean;
	}[] = [
		{
			id: 'score',
			title: 'По плюсам',
			sort_func: (v: variants.Variant): number => v.score,
			order: 'desc',
			description: 'В каком варианте больше сумма плюсов/минусов: + | - ',
			isAdvanced: false
		},
		{
			id: 'time',
			title: 'По скорости',
			sort_func: (v: variants.Variant): number => v.time,
			order: 'asc',
			description: 'В каком варианте меньше сумма плюсов/минусов после T: t+ | т-',
			isAdvanced: true
		},
		{
			id: 'cost',
			title: 'По дешевизне',
			sort_func: (v: variants.Variant): number => v.cost,
			order: 'asc',
			description: 'В каком варианте меньше сумма плюсов/минусов С: c+ |c-',
			isAdvanced: true
		},
		{
			id: 'quality',
			title: 'По качеству',
			sort_func: (v: variants.Variant): number => v.quality,
			order: 'desc',
			description: 'В каком варианте больше сумма плюсов/минусов по К: к+ | k-',
			isAdvanced: true
		},
		{
			id: 'questions',
			title: 'По понятности',
			sort_func: (v: variants.Variant): number => v.questions.length,
			order: 'asc',
			description: 'В каком варианте меньше вопросов: ?',
			isAdvanced: true
		}
	];

	const sortingsInMode = $derived.by(() =>
		advancedMode ? sortings : sortings.filter((s) => !s.isAdvanced)
	);

	const currentSorting = $derived.by(() => {
		return sortings.find((s) => s.id == sortby) ?? sortings[0];
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

	function addToText(targetText: string, stringToAdd: string, place?: 'atEnd') {
		if (place == 'atEnd') {
			variantsDSL += lineBreakIfNeed(variantsDSL) + stringToAdd;
		} else {
			if (!textareaElement) return;

			const cursorStartPosition = textareaElement.selectionStart ?? 0;
			const cursorEndPosition = textareaElement.selectionEnd ?? 0;

			const linebreak = lineBreakIfNeed(variantsDSL, cursorStartPosition);

			const newValue =
				variantsDSL.substring(0, cursorStartPosition) +
				linebreak +
				stringToAdd +
				variantsDSL.substring(cursorEndPosition);
			textareaElement.value = newValue;

			textareaElement.selectionStart = textareaElement.selectionEnd =
				cursorStartPosition + linebreak.length + stringToAdd.length;

			textareaElement?.dispatchEvent(new Event('input', { bubbles: true }));
		}

		textareaElement?.focus();

		function lineBreakIfNeed(targerText: string, startPos?: number) {
			if (!targerText || !startPos) {
				return !targerText || targerText.endsWith('\n') ? '' : '\n';
			}

			const ch = targerText.charAt(startPos - 1);
			console.log(ch);
			if (ch == '\n') {
				return '';
			} else {
				return '\n';
			}
		}
	}

	let textareaElement: HTMLTextAreaElement | null = null;
</script>

<div class="flex min-h-screen">
	<!-- Левая колонка -->
	<div class="bg-base-200 w-1/2 p-8">
		<textarea
			use:autoResize
			bind:value={variantsDSL}
			bind:this={textareaElement}
			class="textarea textarea-borderedw-full min-h-10 w-full"
		>
		</textarea>

		<div>
			Вариант:
			<button
				class="btn"
				onclick={() => addToText(variantsDSL, '= ', 'atEnd')}
				title="Добавить варинт">=</button
			>
		</div>
		<div>
			Плюсы / минусы:
			<button
				class="btn bg-success-content"
				onclick={() => addToText(variantsDSL, '++ ')}
				title="Двойной плюс варианта">++</button
			>
			<button
				class="btn bg-success-content"
				onclick={() => addToText(variantsDSL, '+ ')}
				title="Плюс варианта">+</button
			>
			<button
				class="btn bg-error-content"
				onclick={() => addToText(variantsDSL, '- ')}
				title="Минус варианта">-</button
			>
			<button
				class="btn bg-error-content"
				onclick={() => addToText(variantsDSL, '-- ')}
				title="Двойной минус варианта">--</button
			>
		</div>

		{#if advancedMode}
			<div transition:slide>
				Время:
				<button
					class="btn bg-success-content"
					onclick={() => addToText(variantsDSL, 'T-- ')}
					title="Намного ускорит">T--</button
				>
				<button
					class="btn bg-success-content"
					onclick={() => addToText(variantsDSL, 'T- ')}
					title="Ускорит">T-</button
				>
				<button class="btn" onclick={() => addToText(variantsDSL, 'T?')} title="Вопрос по времени"
					>T?</button
				>
				<button
					class="btn bg-error-content"
					onclick={() => addToText(variantsDSL, 'T+ ')}
					title="Потребует времени">T+</button
				>
				<button
					class="btn bg-error-content"
					onclick={() => addToText(variantsDSL, 'T++ ')}
					title="Потребует много времени">T++</button
				>
			</div>
			<div transition:slide>
				Стоимость:
				<button
					class="btn bg-success-content"
					onclick={() => addToText(variantsDSL, 'С-- ')}
					title="Сильно удешевит">C--</button
				>
				<button
					class="btn bg-success-content"
					onclick={() => addToText(variantsDSL, 'С- ')}
					title="Удешевит">C-</button
				>
				<button class="btn" onclick={() => addToText(variantsDSL, 'C?')} title="Вопрос по стоимости"
					>C?</button
				>
				<button
					class="btn bg-error-content"
					onclick={() => addToText(variantsDSL, 'С+ ')}
					title="Добавит стоимости">C+</button
				>
				<button
					class="btn bg-error-content"
					onclick={() => addToText(variantsDSL, 'С++ ')}
					title="Сильно добавит стоимости">C++</button
				>
			</div>

			<div transition:slide>
				Качество:
				<button
					class="btn bg-success-content"
					onclick={() => addToText(variantsDSL, 'K++ ')}
					title="Двойной плюс к качеству">K++</button
				>
				<button
					class="btn bg-success-content"
					onclick={() => addToText(variantsDSL, 'K+ ')}
					title="Плюс к качеству">K+</button
				>
				<button class="btn" onclick={() => addToText(variantsDSL, 'K?')} title="Вопрос по качеству"
					>K?</button
				>
				<button
					class="btn bg-error-content"
					onclick={() => addToText(variantsDSL, 'K- ')}
					title="Минус к качеству">K-</button
				>
				<button
					class="btn bg-error-content"
					onclick={() => addToText(variantsDSL, 'K-- ')}
					title="Двойной минус к качеству">K--</button
				>
			</div>
		{/if}

		<div class="my-3">
			<label for="advancedMode" class="cursor-pointer me-1"> {m.advancedMode()}</label>
			<input
				id="advancedMode"
				type="checkbox"
				class="toggle"
				bind:checked={advancedMode}
				title="Расширенный режим"
			/>
		</div>
	</div>

	<!-- Правая колонка -->
	<div class="bg-base-300 w-1/2 p-8">
		<div class="w-full">
			<div class="mb-4 space-x-2">
				{#each sortingsInMode as sorting}
					<button
						transition:slide
						class={{ btn: true, outline: sorting.id === sortby }}
						onclick={() => selectSorting(sorting.id)}
						title={sorting.description}
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
									.sort((l1, l2) => (l1.type == l2.type ? 0 : l1.type == sortby ? -1 : 1)) as line}
									<span
										class={{
											'opacity-50': line.type != sortby,
											'bg-success-content':
												(line.type == sortby &&
													currentSorting.order == 'desc' &&
													line.sign == '+') ||
												(line.type == sortby && currentSorting.order == 'asc' && line.sign == '-'),
											'bg-error-content':
												(line.type == sortby &&
													currentSorting.order == 'desc' &&
													line.sign == '-') ||
												(line.type == sortby && currentSorting.order == 'asc' && line.sign == '+'),
											'bg-info-content': line.type == 'questions'
										}}
									>
										{line.text.trim() + '\n'}
									</span>
								{/each}
							</p>
						</div>
						<div class="w-3/12">
							<span class={{ 'opacity-50': sortby != 'score' }}> Плюсы: {variant.score}<br /></span>

							<span class={{ 'opacity-50 p-1': sortby != 'time' }}>
								Время: {variant.time}<br /></span
							>

							<span class={{ 'opacity-50': sortby != 'cost' }}>
								Стоимость: {variant.time}<br /></span
							>

							<span class={{ 'opacity-50': sortby != 'quality' }}>
								Качество: {variant.time}<br /></span
							>

							<span class={{ 'opacity-50': sortby != 'questions' }}>
								Вопросы: {variant.questions.length}<br /></span
							>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
