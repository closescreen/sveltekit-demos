<script lang="ts">
	import { onMount } from 'svelte';
	let raw = `Кто
готов
бросить
жребий
`;
	let names: string[] = [];
	let spinning = false;
	let rotation = 0; // degrees applied to wheel
	let targetRotation = 0;
	let animationId: number | null = null;
	let resultName: string | null = null;
	let finalDeg: number | null = null;
	let sectorAngle: number | null = null;
	let index: number | null = null;

	// wheel visuals
	const size = 420; // px
	const center = size / 2;

	function parseNames() {
		names = raw
			.split(/\r?\n/)
			.map((s) => s.trim())
			.filter(Boolean);
		if (names.length === 0) {
			names = ['Пусто'];
		}
	}

	parseNames();

	// pick a random index, compute final rotation so that pointer points to that sector
	function pickTarget(): { index: number; finalRotation: number } {
		const n = names.length;
		const selected = Math.floor(Math.random() * n);
		const sectorAngle = 360 / n;

		// we want after rotation, one of points at pointer (assume pointer at top, angle 0)
		// Suppose wheel SVG sectors start at angle 0 at top and increase clockwise.
		// We'll rotate the wheel so that center of selected sector aligns with 0deg.
		// finalRotation (deg) = number of full turns * 360 + offset to bring selected sector to top
		const centerOfSector = selected * sectorAngle + sectorAngle / 2;
		// Because positive rotation here we will apply as CSS rotate(...deg) clockwise,
		// to bring that sector to top we need to rotate by -(centerOfSector) (mod 360).
		// Add several full spins for visual effect.
		const extraSpins = 3 + Math.floor(Math.random() * 5); // 5-7 full spins
		const finalRotation = extraSpins * 360 - centerOfSector;
		return { index: selected, finalRotation };
	}

	function spin() {
		if (spinning) return;
		parseNames();
		resultName = null;
		const pick = pickTarget();
		const duration = 5000 + Math.floor(Math.random() * 2000); // 5-7s
		const start = performance.now();
		const startRotation = rotation % 360;
		const endRotation = startRotation + pick.finalRotation;
		spinning = true;

		// easing: easeOutCubic
		const ease = (t: number) => 1 - Math.pow(1 - t, 3);

		function step(now: number) {
			const t = Math.min(1, (now - start) / duration);
			const eased = ease(t);
			rotation = startRotation + (endRotation - startRotation) * eased;
			if (t < 1) {
				animationId = requestAnimationFrame(step);
			} else {
				animationId = null;
				spinning = false;
				// normalize rotation and compute selected index just in case
				finalDeg = ((rotation % 360) + 360) % 360;
				sectorAngle = 360 / names.length;
				// the sector at top corresponds to angle ~0; sector index:
				// sectors numbered 0..n-1, with sector i covering angles [i*sectorAngle, (i+1)*sectorAngle)
				// but recall we placed sector centers at i*sectorAngle + sectorAngle/2. So compute:
				// index = Math.floor(((360 - finalDeg + sectorAngle / 2) % 360) / sectorAngle) % names.length; // orig
				index = Math.floor(((360 - finalDeg) % 360) / sectorAngle) % names.length;

				resultName = names[index];
			}
		}
		animationId = requestAnimationFrame(step);
	}

	function stopAnimation() {
		if (animationId) {
			cancelAnimationFrame(animationId);
			animationId = null;
			spinning = false;
		}
	}

	onMount(() => {
		// ensure parse on mount
		parseNames();
		return () => stopAnimation();
	});

	// helper for slice paths
	function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
		const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
		return {
			x: cx + r * Math.cos(angleRad),
			y: cy + r * Math.sin(angleRad)
		};
	}
	function describeSector(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
		const start = polarToCartesian(cx, cy, r, endAngle);
		const end = polarToCartesian(cx, cy, r, startAngle);
		const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
		return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
	}

	// generate colors
	function colorFor(i: number) {
		// simple HSL palette
		const hue = Math.round(((i * 360) / Math.max(1, names.length)) % 360);
		return `hsl(${hue} 70% 45%)`;
	}
</script>

<div class="container">
	<div class="controls">
		<div class="leftCol">
			<div class="controlsRow">
				<textarea bind:value={raw} placeholder="Введите имена, по одному на строку"></textarea>
				<div style="display:flex;flex-direction:column;gap:8px;">
					<button class="button" on:click={parseNames} disabled={spinning}>Применить</button>
					<button class="button" on:click={spin} disabled={spinning}>Запустить</button>
					<button
						class="button"
						on:click={() => {
							raw = '';
							parseNames();
						}}
						disabled={spinning}>Очистить</button
					>
				</div>
			</div>
		</div>
	</div>

	<div class="wheelWrap">
		<div style="display:flex;flex-direction:column;align-items:center;">
			<div class="pointer" aria-hidden="true"></div>
			<div class="wheel" style="width:{size}px;height:{size}px;">
				<svg
					class="svgWrap"
					width={size}
					height={size}
					viewBox={`0 0 ${size} ${size}`}
					style="transform: rotate({rotation}deg);"
				>
					{#if names.length > 0}
						{#each names as name, i}
							{@const n = names.length}
							{@const sectorAngle = 360 / n}
							{@const start = i * sectorAngle}
							{@const end = start + sectorAngle}
							<path
								d={describeSector(center, center, center, start, end)}
								fill={colorFor(i)}
								stroke="#fff"
								stroke-width="1"
							/>
							{@const mid = start + sectorAngle / 2}
							{@const labelPos = polarToCartesian(center, center, center * 0.65, mid)}
							<text
								x={labelPos.x}
								y={labelPos.y}
								class="sectorLabel labels"
								transform={`rotate(${mid} ${labelPos.x} ${labelPos.y})`}
								dominant-baseline="middle"
							>
								{name}
							</text>
						{/each}
					{/if}
					<!-- center circle -->
					<circle cx={center} cy={center} r={center * 0.18} fill="#fff" stroke="#ddd" />
				</svg>
			</div>
		</div>

		<div
			style="margin-left:16px; display:flex;flex-direction:column;gap:8px; align-items:flex-start;"
		>
			<div
				style="padding:12px;border-radius:8px;box-shadow:0 6px 12px rgba(0,0,0,0.06);min-width:180px;"
			>
				<div><strong>Участников:</strong> {names.length}</div>
				<div class="result">
					{#if resultName}Выбран: {resultName}{/if}
				</div>
			</div>
			<div style="font-size:12px;color:#555;max-width:220px;">
				Вставьте имена по одному на строке и нажмите «Запустить». Колесо выполнит несколько оборотов
				и остановится случайным образом.
			</div>
		</div>
	</div>
</div>

<style>
	@import './styles.css';
	.labels {
		font-family: inherit;
	}
	.controlsRow {
		display: flex;
		gap: 8px;
		align-items: flex-start;
	}
	.leftCol {
		flex: 1;
	}
	.rightCol {
		width: var(--wheel-size);
	}
	.svgWrap {
		transform-origin: center;
		transition: transform 0.1s linear;
	}
</style>
