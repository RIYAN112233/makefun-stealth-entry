// main.js — Nightglass: boot, game loop and state machine. The game runs
// in four states: the title menu, playing, won and lost, plus a staged
// scene mode (?scene=1..4) that freezes a composed moment for screenshots.
// The loop ticks the sentries, the thief and the alarm meter, and hands
// every pixel to render.js.

import { buildLevel, levelCount, COLS, ROWS, TILE } from './levels.js';
import { createGuard, updateGuard, guardSees } from './guard.js';
import { createPlayer, updatePlayer } from './player.js';
import { createDetection, updateDetection } from './detection.js';
import { createInput, bindInput, consumeInput } from './input.js';
import { ensureAudio, footstepSound, warningSound, alarmSound, winSound, clickSound } from './audio.js';
import { drawWorld, drawMenu, drawWin, drawLose, drawSceneCaption } from './render.js';
import { buildScene } from './scenes.js';
import { dist } from './geometry.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput();

/** Save the canvas as a PNG file (the S key). */
function saveShot() {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'nightglass-shot.png';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  }, 'image/png');
}

bindInput(input, canvas, saveShot);

/** Fresh run state for one level. */
function loadLevel(index) {
  const level = buildLevel(index);
  const guards = level.patrols.map((patrol) =>
    createGuard(patrol, level.guardSpeed, level.guardRange, level.guardHalfAngle),
  );
  return {
    level,
    levelIndex: index,
    totalLevels: levelCount(),
    guards,
    player: createPlayer(level.start),
    detection: createDetection(),
    elapsed: 0,
    menuLevel: 0,
  };
}

let world = loadLevel(0);
let state = 'menu';
let scene = null;

// Staged scene mode: ?scene=1..4 freezes a composed moment. No input is
// needed and nothing moves, so a screenshot is stable.
const sceneParam = Number(new URLSearchParams(window.location.search).get('scene'));
if (sceneParam >= 1 && sceneParam <= 4) {
  scene = buildScene(sceneParam);
  if (scene) {
    world = scene.world;
    state = 'scene';
  }
}

/** Start a level from the menu. */
function startLevel(index) {
  world = loadLevel(index);
  world.menuLevel = index;
  state = 'playing';
  ensureAudio();
  clickSound();
}

/** Replay the current level from its start. */
function restartLevel() {
  const index = world.levelIndex;
  world = loadLevel(index);
  world.menuLevel = index;
  state = 'playing';
  ensureAudio();
  clickSound();
}

/** Back to the title screen. */
function toMenu() {
  world = loadLevel(world.menuLevel);
  state = 'menu';
}

let last = performance.now();

/** One frame: read input, tick the world, draw it. */
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;

  if (state === 'scene') {
    // Frozen on purpose: the same composed frame, every time.
    if (scene.screen === 'win') drawWin(ctx, world, 1.2);
    else drawWorld(ctx, world, 1.2);
    drawSceneCaption(ctx, scene.caption);
    consumeInput(input);
    requestAnimationFrame(frame);
    return;
  }

  if (state === 'menu') {
    if (input.pressed.has('level1')) world.menuLevel = 0;
    if (input.pressed.has('level2')) world.menuLevel = 1;
    if (input.pressed.has('confirm') || input.clicked) startLevel(world.menuLevel);
  } else if (state === 'playing') {
    world.elapsed += dt;
    for (const guard of world.guards) updateGuard(guard, dt);
    const stepped = updatePlayer(world.player, input, dt, world.level.walls.concat(world.level.cover), {
      w: COLS * TILE,
      h: ROWS * TILE,
    });
    if (stepped) footstepSound();
    const sightings = world.guards.map((guard) => {
      const seen = guardSees(guard, world.player.x, world.player.y, world.level.sightBlockers);
      guard.sight = seen;
      return seen;
    });
    const event = updateDetection(world.detection, sightings, dt);
    if (event === 'rising') warningSound(world.detection.lastBand);
    if (event === 'alarm') {
      state = 'lost';
      alarmSound();
    }
    if (state === 'playing' && dist(world.player.x, world.player.y, world.level.exit.x, world.level.exit.y) < 26) {
      state = 'won';
      winSound();
    }
    if (input.pressed.has('restart')) restartLevel();
    if (input.pressed.has('menu')) toMenu();
  } else if (state === 'won') {
    if (input.pressed.has('confirm') || input.clicked) {
      const next = world.levelIndex + 1;
      if (next < world.totalLevels) startLevel(next);
      else startLevel(0);
    }
    if (input.pressed.has('restart')) restartLevel();
    if (input.pressed.has('menu')) toMenu();
  } else if (state === 'lost') {
    if (input.pressed.has('restart') || input.pressed.has('confirm') || input.clicked) restartLevel();
    if (input.pressed.has('menu')) toMenu();
  }

  if (state === 'menu') drawMenu(ctx, world, now / 1000);
  else if (state === 'won') drawWin(ctx, world, now / 1000);
  else if (state === 'lost') drawLose(ctx, world, now / 1000);
  else drawWorld(ctx, world, now / 1000);

  consumeInput(input);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
