// guard.js — a museum sentry. A sentry walks a fixed patrol route its
// player can learn: waypoint to waypoint, pausing at each one and slowly
// scanning the room while it waits. Its vision cone reaches out ahead of
// it; the cone only counts when nothing solid stands between the sentry
// and the thief.

import { angleDiff, dist, lineOfSightClear, pointInCone } from './geometry.js';

/** Build a sentry from a patrol route and the level's vision settings. */
export function createGuard(patrol, speed, range, halfAngle) {
  const first = patrol.waypoints[0];
  const second = patrol.waypoints[1];
  return {
    x: first.x,
    y: first.y,
    facing: Math.atan2(second.y - first.y, second.x - first.x),
    waypointIndex: 1,
    pauseLeft: 0,
    scanPhase: 0,
    patrol,
    speed,
    range,
    halfAngle,
    // How clearly this sentry sees the thief right now (0..1).
    // Drives the cone's colour and the alarm bar above its head.
    sight: 0,
    moving: true,
  };
}

/** Advance one sentry by dt seconds. */
export function updateGuard(guard, dt) {
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    guard.moving = false;
    // While waiting, the sentry slowly sweeps its gaze across the room.
    guard.scanPhase += dt;
    const base = guard.facing;
    guard.facing = base + Math.sin(guard.scanPhase * 1.4) * 0.55;
    if (guard.pauseLeft <= 0) {
      // Resume walking from the scanned direction back toward the route.
      const target = guard.patrol.waypoints[guard.waypointIndex];
      guard.facing = Math.atan2(target.y - guard.y, target.x - guard.x);
    }
    return;
  }
  const target = guard.patrol.waypoints[guard.waypointIndex];
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  const step = guard.speed * dt;
  guard.moving = true;
  if (d <= step) {
    guard.x = target.x;
    guard.y = target.y;
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.patrol.waypoints.length;
    guard.pauseLeft = guard.patrol.pause;
    guard.scanPhase = 0;
  } else {
    guard.x += (dx / d) * step;
    guard.y += (dy / d) * step;
    guard.facing = Math.atan2(dy, dx);
  }
}

/**
 * How clearly this sentry sees the thief (0 = not at all, 1 = point blank).
 * The thief must be inside the cone and have a clear line of sight; the
 * closer they are, the stronger the sighting.
 */
export function guardSees(guard, playerX, playerY, sightBlockers) {
  const d = dist(guard.x, guard.y, playerX, playerY);
  if (d > guard.range) return 0;
  if (!pointInCone(playerX, playerY, guard.x, guard.y, guard.facing, guard.range, guard.halfAngle)) return 0;
  if (!lineOfSightClear(guard.x, guard.y, playerX, playerY, sightBlockers)) return 0;
  // Near the sentry the sighting is unmistakable; at the cone's edge it is faint.
  return 1 - (d / guard.range) * 0.7;
}

/** The sentry's heading right now, for drawing its cone and body. */
export function guardFacing(guard) {
  return guard.facing;
}
