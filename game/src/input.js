// input.js — keyboard and mouse state. One job: turn raw DOM events into the
// small state object the game loop reads (arrows/WASD, sprint, clicks, keys).

export function createInput(canvas) {
  const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    sprint: false,
  };
  const state = {
    keys,
    mouse: { x: 0, y: 0, inside: false },
    clicked: null, // {x, y} in canvas coordinates, consumed by the game loop
    pressed: {}, // one-shot keys: 'enter', 'digit1'..'digit6', 'r', 'escape'
  };

  const KEYMAP = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    ShiftLeft: 'sprint',
    ShiftRight: 'sprint',
  };

  window.addEventListener('keydown', (e) => {
    const mapped = KEYMAP[e.code];
    if (mapped) {
      keys[mapped] = true;
      e.preventDefault();
    }
    if (e.code === 'Enter') state.pressed.enter = true;
    if (e.code === 'KeyR') state.pressed.r = true;
    if (e.code === 'Escape') state.pressed.escape = true;
    if (e.code.startsWith('Digit')) state.pressed[e.code.toLowerCase()] = true;
  });
  window.addEventListener('keyup', (e) => {
    const mapped = KEYMAP[e.code];
    if (mapped) keys[mapped] = false;
  });

  function canvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('mousemove', (e) => {
    const p = canvasPos(e);
    state.mouse.x = p.x;
    state.mouse.y = p.y;
    state.mouse.inside = true;
  });
  canvas.addEventListener('click', (e) => {
    state.clicked = canvasPos(e);
  });

  return state;
}

export function consumePressed(state) {
  const out = state.pressed;
  state.pressed = {};
  return out;
}

export function consumeClick(state) {
  const out = state.clicked;
  state.clicked = null;
  return out;
}
