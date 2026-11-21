// player.js — the thief. Moves with the arrow keys or WASD, slides along
// walls and cover, and leaves a soft footstep sound every few steps so a
// listening player can feel the pace. The thief is a small circle; every
// solid rectangle in the level pushes it back out.

import { clamp, resolveCircleRect } from './geometry.js';

export const PLAYER_RADIUS = 13;
export const PLAYER_SPEED = 152;

/** Build a fresh thief at the level's start tile. */
export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    radius: PLAYER_RADIUS,
    speed: PLAYER_SPEED,
    moving: false,
    // Heading the thief last walked in, for drawing the figure.
    facing: 0,
    // Distance walked since the last footstep sound.
    stepAccum: 0,
    // 0..1 walk-cycle phase, for the little bob while moving.
    bob: 0,
  };
}

/**
 * Move the thief by dt seconds from the held keys. `solids` are the
 * rectangles that block movement (walls + cover). Returns true when a
 * footstep sound is due this frame.
 */
export function updatePlayer(player, keys, dt, solids, bounds) {
  let dx = 0;
  let dy = 0;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  player.moving = dx !== 0 || dy !== 0;
  if (!player.moving) return false;
  const len = Math.sqrt(dx * dx + dy * dy);
  dx /= len;
  dy /= len;
  player.facing = Math.atan2(dy, dx);
  const step = player.speed * dt;
  // Move one axis at a time so the thief slides along walls instead of
  // sticking to them.
  player.x = clamp(player.x + dx * step, player.radius, bounds.w - player.radius);
  for (const rect of solids) {
    const fixed = resolveCircleRect(player.x, player.y, player.radius, rect);
    player.x = fixed.x;
    player.y = fixed.y;
  }
  player.y = clamp(player.y + dy * step, player.radius, bounds.h - player.radius);
  for (const rect of solids) {
    const fixed = resolveCircleRect(player.x, player.y, player.radius, rect);
    player.x = fixed.x;
    player.y = fixed.y;
  }
  player.bob += dt * 11;
  player.stepAccum += step;
  if (player.stepAccum >= 34) {
    player.stepAccum = 0;
    return true;
  }
  return false;
}

/** Reset the thief to a level's start tile. */
export function resetPlayer(player, start) {
  player.x = start.x;
  player.y = start.y;
  player.moving = false;
  player.facing = 0;
  player.stepAccum = 0;
  player.bob = 0;
}
