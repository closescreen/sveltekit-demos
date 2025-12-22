<script lang="ts">
	import { slide } from 'svelte/transition';
	import { m } from '$lib/paraglide/messages';

	interface CartItem {
		id: string;
		name: string;
		price: number;
		quantity: number;
		category?: string;
		tags?: string[];
		isSelected?: boolean; // Для подмножества товаров к оформлению
	}

	interface Coupon {
		id: string;
		code: string;
		type: 'percentage' | 'fixed';
		discount: number;
		conditions?: {
			minTotalPrice?: number;
			requiredCategories?: string[];
			requiredTags?: string[];
			excludedCategories?: string[];
		};
	}

	interface CrossSellItem {
		triggerProductIds: string[]; // Какие товары активируют кросс-селл
		recommendedProducts: CartItem[];
	}

	interface Cart {
		items: CartItem[];
		availableCoupons?: Coupon[];
		appliedCoupon?: Coupon;
		crossSellOffers?: CrossSellItem[];
	}

	let cart: Cart = $state({
		items: [
			{
				id: 'smXYZ01',
				name: 'Смартфон XYZ',
				price: 6500,
				quantity: 1,
				category: 'Электроника',
				isSelected: false
			},

			{
				id: 'cvFXYZ',
				name: 'Чехол для смартфона XYZ',
				price: 400,
				quantity: 1,
				category: 'Аксессуары',
				isSelected: true
			}
		],
		availableCoupons: [],
		appliedCoupon: undefined,
		crossSellOffers: [
			{
				triggerProductIds: ['smXYZ01'],
				recommendedProducts: [
					{ id: 'ch12345', name: 'Зарядное устройство', price: 350, quantity: 1 },
					{ id: 'gl12345', name: 'Защитное стекло', price: 150, quantity: 1 },
					{ id: 'whp12345', name: 'Беспровозные наушники', price: 750, quantity: 1 }
				]
			},
			{
				triggerProductIds: ['cvFXYZ'],
				recommendedProducts: [
					{ id: 'ch12345', name: 'Трапочка для чехла', price: 50, quantity: 1 },
					{ id: 'gl12345', name: 'Наклейка на чехол', price: 70, quantity: 1 },
					{ id: 'whp12345', name: 'Магнитный держатель', price: 150, quantity: 1 }
				]
			}
		]
	});

	let crossSellOffers: CartItem[] = $derived.by(() => {
		for (const item of cart.items.filter((i) => i.isSelected)) {
			for (const offer of cart.crossSellOffers ?? []) {
				if (offer.triggerProductIds.includes(item.id)) {
					return offer.recommendedProducts;
				}
			}
		}
		return [];
	});

	let summ = $derived(
		(cart.items.filter((i) => i.isSelected) ?? []).reduce(
			(total, item) => total + item.price * item.quantity,
			0
		)
	);

	let discountPercent = $state(3); // todo вынести в структуру cart
	let discount = $derived(Math.floor(summ * (discountPercent / 100)));

	let toPay = $derived(summ - discount);
</script>

<div class="container mx-auto max-w-4xl">
	<div class="card bg-base-200 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-2xl mb-6">{m['cart.cart']()}</h2>

			<div class="space-y-4">
				<!-- Товар -->
				{#each cart.items as i}
					<div id={i.id} class="flex items-center justify-between bg-base-100 p-4 rounded-lg">
						<input
							type="checkbox"
							class="checkbox checkbox-primary me-2"
							bind:checked={i.isSelected}
							onchange={() => {
								if (i.quantity == 0) i.quantity++;
							}}
						/>
						<div class="grow">
							<h3 class="font-bold">{i.name}</h3>
							<p class="text-sm text-gray-500">{i.category}</p>
						</div>
						<div class="flex items-center space-x-4">
							<div class="join">
								<button
									class="btn btn-xs btn-square join-item"
									onclick={() => {
										if (i.quantity > 0) i.quantity--;
										if (i.quantity == 0) i.isSelected = false;
									}}>-</button
								>
								<input
									type="number"
									min="0"
									disabled
									bind:value={i.quantity}
									class="input input-xs input-bordered w-12 text-center join-item"
								/>
								<button
									class="btn btn-xs btn-square join-item"
									onclick={() => {
										if (i.quantity == 0) i.isSelected = true;
										i.quantity++;
									}}>+</button
								>
							</div>
							<div class="font-semibold">{i.price} ₽</div>
							<button
								class="btn btn-ghost btn-xs text-error me-2"
								title={m['cart.remove_from_cart']()}
								onclick={() =>
									cart.items.splice(
										cart.items.findIndex((x) => x.id == i.id),
										1
									)}
							>
								x
							</button>
							<!-- todo по кнопке x отщелкивать товар   -->
						</div>
						<div class="font-semibold">{i.price * i.quantity} ₽</div>
					</div>
				{/each}
			</div>

			<!-- Итого -->
			<div class="mt-6 bg-base-100 p-4 rounded-lg">
				<div class="flex justify-between mb-2">
					<span>{m['cart.sum']()}</span>
					<span>{summ} ₽</span>
				</div>
				<div class="flex justify-between mb-2">
					<span>{m['cart.discount']()}</span>
					<span>{discount} ₽</span>
				</div>
				<div class="divider my-1"></div>
				<div class="flex justify-between font-bold">
					<span>{m['cart.total']()}</span>
					<span>{toPay} ₽</span>
				</div>
			</div>

			<!-- Кнопки действий -->
			<div class="card-actions justify-end mt-6">
				<button class="btn btn-ghost">{m['cart.continue_shoping']()}</button>
				<button class="btn btn-primary" disabled={!cart.items.filter((i) => i.isSelected).length}
					>{m['cart.order']()}</button
				>
			</div>

			<!-- Рекомендации -->
			{#if crossSellOffers.length}
				<div class="mt-6" transition:slide>
					<h3 class="text-xl mb-4">{m['cart.recommendations']()}</h3>
					<div class="grid grid-cols-3 gap-4">
						{#each crossSellOffers as o}
							<div class="card bg-base-100 shadow-xl">
								<div class="card-body items-center text-center">
									<h2 class="card-title">{o.name}</h2>
									<span class=" text-gray-400">{o.price} ₽</span>
									<div class="card-actions">
										<button
											class="btn btn-primary btn-sm"
											onclick={() => {
												cart.items.push(o);
												o.isSelected = true;
											}}>{m['cart.add']()}</button
										>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
</style>
