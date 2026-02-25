<script lang="ts">
	import * as gm from './GamepadManager';

	import { onDestroy, onMount } from 'svelte';

	onMount(() => {
		document.addEventListener('keydown', handleKeyPress);

		const gamepad = new gm.GamepadManager();

		// Subscribe to button events
		const unsubscribeButtonDown = gamepad.onButtonDown((event) => {
			console.log(`Gamepad ${event.gamepadIndex}: ${event.buttonName} pressed`);

			if (event.buttonName == 'Y') {
				move('right');
			}
			if (event.buttonName == 'A') {
				move('left');
			}
			if (event.buttonName == 'X') {
				move('up');
			}
			if (event.buttonName == 'B') {
				move('down');
			}
		});

		// const unsubscribeButtonUp = gamepad.onButtonUp((event) => {
		// 	console.log(`Gamepad ${event.gamepadIndex}: ${event.buttonName} released`);
		// });

		// // Subscribe to stick/axis movements
		// const unsubscribeAxis = gamepad.onAxisMove((event) => {
		// 	if (event.value !== 0) {
		// 		console.log(`${event.axisName}: ${event.value.toFixed(2)}`);
		// 	}
		// });

		// Subscribe to connection events
		// const unsubscribeConnection = gamepad.onGamepadConnection((event) => {
		// if (event.connected) {
		// console.log(`Gamepad connected: ${event.gamepadId}`);
		// } else {
		// console.log(`Gamepad disconnected: ${event.gamepadId}`);
		// }
		// });

		// Later: unsubscribe
		// unsubscribeButtonDown();
		// gamepad.destroy(); // Clean up all listeners

		// Удаляем обработчик при размонтировании
		return () => {
			document.removeEventListener('keydown', handleKeyPress);
			unsubscribeButtonDown();
			gamepad.destroy();
		};
	});

	type Direction = 'up' | 'down' | 'left' | 'right';

	// переназначение:
	let keyBindings = {
		up: 'ArrowUp',
		down: 'ArrowDown',
		left: 'ArrowLeft',
		right: 'ArrowRight'
	};

	let newKeyBindings = { ...keyBindings };

	function handleKeyChange(event, direction: Direction) {
		event.preventDefault(); // Всегда предотвращаем действие по умолчанию
		if (!direction) {
			return;
		}
		newKeyBindings[direction] = event.key;
	}

	function saveBindings() {
		keyBindings = { ...newKeyBindings };
		alert('Настройки клавиш сохранены!');
	}

	function handleKeyPress(event) {
		// Ваша логика для перемещения в игре
		switch (event.key) {
			case keyBindings.up:
				move('up');
				break;
			case keyBindings.down:
				move('down');
				break;
			case keyBindings.left:
				move('left');
				break;
			case keyBindings.right:
				move('right');
				break;
		}
	}

	// --------  игра: -------
	let board = $state(
		Array(4)
			.fill(0)
			.map(() => Array(4).fill(0))
	);

	const maxTile = () => Math.max(...board.map((row) => Math.max(...row)));
	let score = $state(0);
	let win = $state(false);
	let maxList = $state([2]);

	const bgColors = {
		0: 'bg-gray-200',
		2: 'bg-yellow-400',
		4: 'bg-green-400',
		8: 'bg-blue-400',
		16: 'bg-purple-400',
		32: 'bg-red-400',
		64: 'bg-orange-400',
		128: 'bg-pink-400',
		256: 'bg-indigo-400',
		512: 'bg-teal-400',
		1024: 'bg-gray-800',
        2048: 'bg-fuchsia-900',
        4096: 'bg-bg-fuchsia-950',
	};

	function addRandomTile() {
		const emptyTiles = [];
		for (let i = 0; i < 4; i++) {
			for (let j = 0; j < 4; j++) {
				if (board[i][j] === 0) {
					emptyTiles.push({ x: i, y: j });
				}
			}
		}
		const randTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
		board[randTile.x][randTile.y] = Math.random() < 0.9 ? 2 : 4;
	}

	function move(direction: Direction) {
		let moved = false;

		const combineTiles = (row) => {
			console.log('before combineTiles: ', row);
			for (let i = 0; i < row.length - 1; i++) {
				if (row[i] !== 0 && row[i] === row[i + 1]) {
					row[i] *= 2;
					row[i + 1] = 0;
					score += row[i];
					moved = true;
				}
			}
			console.log('after', row);
		};

		const slideTiles = (row) => {
			const newRow = row
				.filter((tile) => tile !== 0)
				.concat(Array(4).fill(0))
				.slice(0, 4);

			if (!arraysEquals(row, newRow)) {
				moved = true;
			}

			return newRow;
		};

		const arraysEquals = (arr1: Array, arr2: Array) =>
			JSON.stringify(arr1) === JSON.stringify(arr2);

		if (direction === 'left') {
			for (let i = 0; i < 4; i++) {
				board[i] = slideTiles(board[i]);
				combineTiles(board[i]);
			}
		}

		if (direction === 'right') {
			for (let i = 0; i < 4; i++) {
				board[i] = [...board[i]].reverse();
				board[i] = slideTiles(board[i]);
				combineTiles(board[i]);
				board[i] = [...board[i]].reverse();
			}
		}

		if (direction === 'up') {
			for (let j = 0; j < 4; j++) {
				let column = [board[0][j], board[1][j], board[2][j], board[3][j]];
				column = slideTiles(column);
				for (let i = 0; i < 4; i++) {
					board[i][j] = column[i] !== 0 ? column[i] : 0;
				}

				column = [board[0][j], board[1][j], board[2][j], board[3][j]];
				combineTiles(column);

				for (let i = 0; i < 4; i++) {
					board[i][j] = column[i] !== 0 ? column[i] : 0;
				}
			}
		}

		if (direction === 'down') {
			for (let j = 0; j < 4; j++) {
				let column = [board[0][j], board[1][j], board[2][j], board[3][j]];
				column.reverse();

				column = slideTiles(column);
				column.reverse();

				for (let i = 0; i < 4; i++) {
					board[i][j] = column[i] !== 0 ? column[i] : 0;
				}

				column = [board[0][j], board[1][j], board[2][j], board[3][j]];
				column.reverse();
				combineTiles(column);
				column.reverse();

				for (let i = 0; i < 4; i++) {
					board[i][j] = column[i] !== 0 ? column[i] : 0;
				}
			}
		}

		if (moved) {
			addRandomTile();
			if (maxList.at(-1) < maxTile()) {
				maxList.push(maxTile());
			}
			win = maxTile() >= 1024;
		}
	}

	function startNewGame() {
		maxList = [2];
		board = Array(4)
			.fill(0)
			.map(() => Array(4).fill(0));
		score = 0;
		addRandomTile();
		addRandomTile();
	}

	// Инициализация игры при запуске
	startNewGame();
</script>

<div class="flex flex-row items-center justify-center gap-7">
	<div class="flex flex-col flex-col-reverse items-center text-4xl font-bold">
		{#each maxList as cell}
			<div class={`p-4 ${bgColors[cell] || 'bg-blue-500'}`}>{cell}</div>
		{/each}
	</div>
	<div class="flex flex-col items-center m-3">
		<h1 class="text-4xl font-bold mb-4">Score: {score}</h1>
		{#if win}
			<h1 class="text-4xl font-bold mb-4 bg-emerald-600">YOU WIN!</h1>
		{/if}
		<div class="grid grid-cols-4 gap-2">
			{#each board as row}
				{#each row as tile}
					<div
						class={`w-30 h-30 flex items-center justify-center text-white font-bold text-3xl 
                        ${bgColors[tile] || 'bg-blue-500'}
                        `}
					>
						{tile !== 0 ? tile : ''}
					</div>
				{/each}
			{/each}
		</div>
		<button class="mt-4 bg-blue-500 text-white py-2 px-4 rounded" on:click={startNewGame}>
			Новая игра
		</button>
	</div>
</div>

<div class="p-4">
	<h1 class="text-xl font-bold mb-4">Переназначение клавиш</h1>
	<div class="grid grid-cols-4 gap-2 mb4">
		<div class="mb-4">
			<label class="block mb-1">Клавиша для движения вверх:</label>
			<input
				type="text"
				value={newKeyBindings.up}
				on:keydown={(event) => handleKeyChange(event, 'up')}
				class="border p-2 w-full"
			/>
			<div class="col"></div>
		</div>

		<div class="mb-4">
			<label class="block mb-1">Клавиша для движения вниз:</label>
			<input
				type="text"
				value={newKeyBindings.down}
				on:keydown={(event) => handleKeyChange(event, 'down')}
				class="border p-2 w-full"
			/>
		</div>

		<div class="mb-4">
			<label class="block mb-1">Клавиша для движения влево:</label>
			<input
				type="text"
				value={newKeyBindings.left}
				on:keydown={(event) => handleKeyChange(event, 'left')}
				class="border p-2 w-full"
			/>
		</div>

		<div class="mb-4">
			<label class="block mb-1">Клавиша для движения вправо:</label>
			<input
				type="text"
				value={newKeyBindings.right}
				on:keydown={(event) => handleKeyChange(event, 'right')}
				class="border p-2 w-full"
			/>
		</div>
	</div>

	<button on:click={saveBindings} class="bg-blue-500 text-white py-2 px-4 rounded">
		Сохранить настройки
	</button>
</div>

<style>
	.board {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
	}
</style>
