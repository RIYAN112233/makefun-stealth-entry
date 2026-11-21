// geometry.js — small 2D helpers for sight lines, cones and collisions.
// Nothing here knows about guards, the player or the canvas: it only
// answers questions about points, segments and rectangles.

/** Clamp a number into [lo, hi]. */
export function clamp(value, lo, hi) {
  return value < lo ? lo : value > hi ? hi : value;
}

/** Squared distance between two points. */
export function distSq(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}

/** Distance between two points. */
export function dist(ax, ay, bx, by) {
  return Math.sqrt(distSq(ax, ay, bx, by));
}

/**
 * Smallest absolute angle between two headings, in radians (0..PI).
 * Used to test whether a target sits inside a guard's vision cone.
 */
export function angleDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/**
 * Whether the point (px, py) lies inside a vision cone whose tip is at
 * (ox, oy), pointing along `facing` (radians), with the given range and
 * half-angle.
 */
export function pointInCone(px, py, ox, oy, facing, range, halfAngle) {
  const dx = px - ox;
  const dy = py - oy;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > range) return false;
  if (d < 1e-6) return true;
  const heading = Math.atan2(dy, dx);
  return angleDiff(heading, facing) <= halfAngle;
}

/**
 * Whether the segment (x1,y1)-(x2,y2) touches the axis-aligned rectangle.
 * Liang-Barsky clipping: the segment is clipped against the four slab
 * planes and survives only if some part of it lies inside the box.
 */
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const clip = (p, q) => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  if (!clip(-dx, x1 - rect.x)) return false;
  if (!clip(dx, rect.x + rect.w - x1)) return false;
  if (!clip(-dy, y1 - rect.y)) return false;
  if (!clip(dy, rect.y + rect.h - y1)) return false;
  return true;
}

/**
 * Whether a sight line from (x1,y1) to (x2,y2) is clear: true when no
 * sight-blocking rectangle in `blockers` intersects the segment.
 */
export function lineOfSightClear(x1, y1, x2, y2, blockers) {
  for (const rect of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return false;
  }
  return true;
}

/**
 * Push a circle (centre cx, cy, radius r) out of an axis-aligned rectangle.
 * Returns the corrected centre. Used one axis at a time by the player so
 * sliding along a wall still works.
 */
export function resolveCircleRect(cx, cy, r, rect) {
  const nearestX = clamp(cx, rect.x, rect.x + rect.w);
  const nearestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return { x: cx, y: cy };
  if (d2 < 1e-9) {
    // Centre is inside the rectangle: push out along the shallowest side.
    const left = cx - rect.x;
    const right = rect.x + rect.w - cx;
    const top = cy - rect.y;
    const bottom = rect.y + rect.h - cy;
    const m = Math.min(left, right, top, bottom);
    if (m === left) return { x: rect.x - r, y: cy };
    if (m === right) return { x: rect.x + rect.w + r, y: cy };
    if (m === top) return { x: cx, y: rect.y - r };
    return { x: cx, y: rect.y + rect.h + r };
  }
  const d = Math.sqrt(d2);
  return { x: cx + (dx / d) * (r - d), y: cy + (dy / d) * (r - d) };
}
