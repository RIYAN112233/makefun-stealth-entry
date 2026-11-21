// levels.js — the museum wings. Each level is a hand-drawn tile map plus
// the patrol routes its sentries walk. Tiles:
//   '#' wall (blocks movement and sight)
//   'C' display crate (cover: blocks movement and sight)
//   'P' tall plant (cover: blocks movement and sight)
//   'S' marble statue (cover: blocks movement and sight)
//   '.' open floor
//   '@' the thief's starting tile
//   'E' the glowing exit skylight
// Waypoints are [column, row] tile centres; a sentry walks them in order,
// pauses at each one, then loops. Routes are drawn on open floor only.

export const TILE = 40;
export const COLS = 24;
export const ROWS = 15;

const LEVELS = [
  {
    name: 'Level 1 — The Gallery',
    shortName: 'THE GALLERY',
    parSeconds: 75,
    guardSpeed: 62,
    guardRange: 172,
    guardHalfAngle: 0.62,
    map: [
      '########################',
      '#..........#...........#',
      '#.@....C...#.....P....E#',
      '#..........#...........#',
      '#..C.......#..C........#',
      '#..........#......C....#',
      '#....####.....####.....#',
      '#......................#',
      '#..C....P.....C....P...#',
      '#..........#...........#',
      '#..P.......#..C........#',
      '#..........#......C....#',
      '#..C....P..#....P......#',
      '#......................#',
      '########################',
    ],
    patrols: [
      // Hall sentry: sweeps the long central corridor, left to right.
      { waypoints: [[2, 7], [21, 7]], pause: 1.6 },
      // East-wing sentry: walks the tall gallery beside the exit.
      { waypoints: [[18, 2], [18, 10]], pause: 1.2 },
    ],
  },
  {
    name: 'Level 2 — The Vault Wing',
    shortName: 'THE VAULT WING',
    parSeconds: 110,
    guardSpeed: 80,
    guardRange: 192,
    guardHalfAngle: 0.58,
    map: [
      '########################',
      '#....#......#.....#....#',
      '#.@..#..C...#..P..#..E.#',
      '#....#......#.....#....#',
      '#.C..#..P...#.C...#..C.#',
      '#....#......#.....#....#',
      '#....####....###....#..#',
      '#......................#',
      '#..P....C......P....C..#',
      '#....#......#.....#....#',
      '#.C..#..P...#.C...#..C.#',
      '#....#......#.....#....#',
      '#..C.#...C..#..P..#....#',
      '#......................#',
      '########################',
    ],
    patrols: [
      // Hall sentry: faster, shorter pauses — the corridor is no longer safe.
      { waypoints: [[2, 7], [21, 7]], pause: 0.8 },
      // West sentry: guards the thief's own wing, top to bottom.
      { waypoints: [[7, 1], [7, 5]], pause: 1.0 },
      // Vault sentry: paces the lower vault rooms.
      { waypoints: [[19, 9], [19, 13]], pause: 1.0 },
    ],
  },
];

/** Centre of a tile, in pixels. */
export function tileCentre(col, row) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

/** Whether a tile character blocks movement. */
function blocksMovement(ch) {
  return ch === '#' || ch === 'C' || ch === 'P' || ch === 'S';
}

/** Whether a tile character blocks a sentry's line of sight. */
function blocksSight(ch) {
  return ch === '#' || ch === 'C' || ch === 'P' || ch === 'S';
}

/**
 * Turn a level definition into the rectangles and actors the game runs on.
 * Returns walls (movement + sight), cover (movement + sight, drawn
 * distinctly), the thief's start, the exit tile, and sentry patrols in
 * pixel coordinates.
 */
export function buildLevel(index) {
  const def = LEVELS[index % LEVELS.length];
  const walls = [];
  const cover = [];
  let start = { x: TILE * 1.5, y: TILE * 1.5 };
  let exit = { x: TILE * 22.5, y: TILE * 2.5 };
  for (let row = 0; row < ROWS; row++) {
    const line = def.map[row];
    for (let col = 0; col < COLS; col++) {
      const ch = line[col];
      const rect = { x: col * TILE, y: row * TILE, w: TILE, h: TILE, kind: ch };
      if (ch === '#') walls.push(rect);
      else if (ch === 'C' || ch === 'P' || ch === 'S') cover.push(rect);
      else if (ch === '@') start = tileCentre(col, row);
      else if (ch === 'E') exit = tileCentre(col, row);
    }
  }
  const sightBlockers = walls.concat(cover);
  const patrols = def.patrols.map((p) => ({
    waypoints: p.waypoints.map(([c, r]) => tileCentre(c, r)),
    pause: p.pause,
  }));
  return {
    index,
    name: def.name,
    shortName: def.shortName,
    parSeconds: def.parSeconds,
    guardSpeed: def.guardSpeed,
    guardRange: def.guardRange,
    guardHalfAngle: def.guardHalfAngle,
    walls,
    cover,
    sightBlockers,
    start,
    exit,
    patrols,
  };
}

/** How many levels the game holds. */
export function levelCount() {
  return LEVELS.length;
}

/**
 * Validate a level definition: every row is COLS wide, the map is ROWS
 * tall, there is exactly one start and one exit, and every patrol
 * waypoint sits on open floor. Throws on the first problem found.
 */
export function validateLevel(index) {
  const def = LEVELS[index];
  if (!def) throw new Error(`no level ${index}`);
  if (def.map.length !== ROWS) throw new Error(`level ${index}: ${def.map.length} rows, expected ${ROWS}`);
  let starts = 0;
  let exits = 0;
  const walkable = (col, row) => {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
    return !blocksMovement(def.map[row][col]);
  };
  for (let row = 0; row < ROWS; row++) {
    const line = def.map[row];
    if (line.length !== COLS) throw new Error(`level ${index} row ${row}: ${line.length} columns, expected ${COLS}`);
    for (let col = 0; col < COLS; col++) {
      const ch = line[col];
      if (ch === '@') starts++;
      if (ch === 'E') exits++;
      if (!'.#CPS@E'.includes(ch)) throw new Error(`level ${index} row ${row} col ${col}: unknown tile '${ch}'`);
    }
  }
  if (starts !== 1) throw new Error(`level ${index}: ${starts} starts, expected 1`);
  if (exits !== 1) throw new Error(`level ${index}: ${exits} exits, expected 1`);
  def.patrols.forEach((p, i) => {
    if (p.waypoints.length < 2) throw new Error(`level ${index} patrol ${i}: needs at least 2 waypoints`);
    p.waypoints.forEach(([c, r], j) => {
      if (!walkable(c, r)) throw new Error(`level ${index} patrol ${i} waypoint ${j} (${c},${r}) is not open floor`);
    });
  });
  return true;
}
