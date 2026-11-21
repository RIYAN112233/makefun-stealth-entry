// scenes.js — four deterministic staged moments for screenshots, reached
// as ?scene=1..4. Nothing here moves or rolls dice: each scene fixes the
// level, the sentries' places and headings, the thief's place and the
// alarm meter, so a screenshot taken of it is the same every time.
// Scene 1: sneaking behind cover. Scene 2: a near miss, meter nearly full.
// Scene 3: the second wing with all three sentries. Scene 4: the getaway.

import { buildLevel, levelCount, tileCentre } from './levels.js';
import { createGuard } from './guard.js';
import { createPlayer } from './player.js';
import { createDetection } from './detection.js';

/** Place a sentry from a patrol route, then freeze it at a staged spot. */
function stageGuard(level, patrolIndex, col, row, facing, sight) {
  const guard = createGuard(level.patrols[patrolIndex], level.guardSpeed, level.guardRange, level.guardHalfAngle);
  const spot = tileCentre(col, row);
  guard.x = spot.x;
  guard.y = spot.y;
  guard.facing = facing;
  guard.sight = sight;
  guard.moving = false;
  guard.pauseLeft = 0;
  return guard;
}

/** A world object shaped like the live game's, frozen for a screenshot. */
function stageWorld(levelIndex, guardSpecs, playerCol, playerRow, playerFacing, detectionValue, watchers, elapsed) {
  const level = buildLevel(levelIndex);
  const guards = guardSpecs.map((spec) =>
    stageGuard(level, spec.patrol, spec.col, spec.row, spec.facing, spec.sight),
  );
  const player = createPlayer(level.start);
  const spot = tileCentre(playerCol, playerRow);
  player.x = spot.x;
  player.y = spot.y;
  player.facing = playerFacing;
  player.moving = false;
  const detection = createDetection();
  detection.value = detectionValue;
  detection.watchers = watchers;
  detection.strongest = guardSpecs.reduce((m, s) => Math.max(m, s.sight), 0);
  return {
    level,
    levelIndex,
    totalLevels: levelCount(),
    guards,
    player,
    detection,
    elapsed,
    menuLevel: 0,
  };
}

const CAPTIONS = {
  1: 'SNEAKING — the crate breaks the sentry\u2019s line of sight',
  2: 'SPOTTED — the cone burns red as the alarm meter climbs',
  3: 'THE VAULT WING — three sentries, tighter patrols',
  4: 'CLEAN GETAWAY — the skylight exit, reached unseen',
};

/**
 * Build staged scene n (1..4). Returns { world, caption, screen } where
 * screen is 'world' for a live-looking frame or 'win' for the getaway
 * screen. Returns null for any other number.
 */
export function buildScene(n) {
  if (n === 1) {
    return {
      screen: 'world',
      caption: CAPTIONS[1],
      world: stageWorld(
        0,
        [
          { patrol: 0, col: 9, row: 7, facing: 0, sight: 0 },
          { patrol: 1, col: 18, row: 5, facing: Math.PI / 2, sight: 0 },
        ],
        5, 8, 0, 0, 0, 23,
      ),
    };
  }
  if (n === 2) {
    return {
      screen: 'world',
      caption: CAPTIONS[2],
      world: stageWorld(
        0,
        [
          { patrol: 0, col: 12, row: 7, facing: 0, sight: 0.85 },
          { patrol: 1, col: 18, row: 6, facing: Math.PI / 2, sight: 0 },
        ],
        15, 7, Math.PI, 78, 1, 41,
      ),
    };
  }
  if (n === 3) {
    return {
      screen: 'world',
      caption: CAPTIONS[3],
      world: stageWorld(
        1,
        [
          { patrol: 0, col: 10, row: 7, facing: Math.PI, sight: 0 },
          { patrol: 1, col: 7, row: 3, facing: Math.PI / 2, sight: 0.1 },
          { patrol: 2, col: 19, row: 11, facing: -Math.PI / 2, sight: 0 },
        ],
        13, 7, Math.PI / 2, 12, 0, 58,
      ),
    };
  }
  if (n === 4) {
    const world = stageWorld(
      0,
      [
        { patrol: 0, col: 4, row: 7, facing: Math.PI, sight: 0 },
        { patrol: 1, col: 18, row: 12, facing: -Math.PI / 2, sight: 0 },
      ],
      22, 2, -Math.PI / 2, 0, 0, 61,
    );
    return { screen: 'win', caption: CAPTIONS[4], world };
  }
  return null;
}
