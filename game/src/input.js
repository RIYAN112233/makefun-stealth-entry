// input.js — keyboard and mouse. WASD and the arrow keys move the thief;
// R restarts the level, S saves a PNG of the canvas, Enter confirms a
// screen, 1/2 pick a level on the title screen, Escape goes back to it.
// The page never scrolls on arrow keys or space while the game has focus.

export function createInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    // Edge-triggered actions, consumed by the game loop each frame.
    pressed: new Set(),
    // Mouse click position on the canvas, consumed the same way.
    clicked: null,
  };
}

/** Normalise a key event into one of the game's actions, or null. */
function actionOf(event) {
  const key = event.key;
  if (key === 'ArrowUp' || key === 'w' || key === 'W') return 'up';
  if (key === 'ArrowDown' || key === 's' || key === 'S') return 'down';
  if (key === 'ArrowLeft' || key === 'a' || key === 'A') return 'left';
  if (key === 'ArrowRight' || key === 'd' || key === 'D') return 'right';
  if (key === 'Enter') return 'confirm';
  if (key === 'r' || key === 'R') return 'restart';
  if (key === 'Escape') return 'menu';
  if (key === '1') return 'level1';
  if (key === '2') return 'level2';
  return null;
}

/**
 * Wire the keyboard and the canvas click to an input state. `onShot` is
 * called when the player presses S (handled here, not as a game action,
 * so it works on every screen including the staged scenes).
 */
export function bindInput(input, canvas, onShot) {
  window.addEventListener('keydown', (event) => {
    // S saves a picture on every screen, including the staged scenes, so
    // check it before the movement branch claims the key. A held S must
    // not save a picture on every key repeat.
    if ((event.key === 's' || event.key === 'S') && !event.repeat) {
      onShot();
    }
    const action = actionOf(event);
    if (action === null) return;
    if (['up', 'down', 'left', 'right'].includes(action)) {
      event.preventDefault();
      input[action] = true;
      return;
    }
    event.preventDefault();
    input.pressed.add(action);
  });
  window.addEventListener('keyup', (event) => {
    const action = actionOf(event);
    if (action && ['up', 'down', 'left', 'right'].includes(action)) input[action] = false;
  });
  window.addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = false;
  });
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.clicked = {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  });
}

/** Clear the frame's edge-triggered actions after the game reads them. */
export function consumeInput(input) {
  input.pressed.clear();
  input.clicked = null;
}
