// Диагностика: выведет все нажатия
window.addEventListener('gamepadconnected', () => {
  setInterval(() => {
    const gamepad = navigator.getGamepads()[0];
    gamepad?.buttons.forEach((btn, idx) => {
      if (btn.pressed) console.log(`Button ${idx} pressed`);
    });
  }, 16);
});
// диагностику запустить и посмотреть что выводит