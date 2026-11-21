// detection.js — the alarm meter. One number, 0..100, shared by the whole
// room: it climbs while any sentry has the thief in its cone with a clear
// line of sight, faster the closer the nearest sighting is, and it falls
// away while the thief stays hidden, so a near miss can still be recovered
// from. At 100 the alarm goes up and the run is over.

export const DETECTION_MAX = 100;

/** A fresh, calm meter. */
export function createDetection() {
  return {
    value: 0,
    // The strongest sighting this frame (0..1), for the HUD and cones.
    strongest: 0,
    // How many sentries can see the thief right now.
    watchers: 0,
    // The last threshold crossed (25/50/75), so the sound plays once each.
    lastBand: 0,
  };
}

/**
 * Advance the meter by dt seconds. `sightings` is an array of 0..1 values,
 * one per sentry. Returns 'alarm' when the meter hits the top, 'rising'
 * when it crossed a new 25-point band upward, otherwise 'calm'.
 */
export function updateDetection(detection, sightings, dt) {
  let strongest = 0;
  let watchers = 0;
  for (const s of sightings) {
    if (s > 0) watchers++;
    if (s > strongest) strongest = s;
  }
  detection.strongest = strongest;
  detection.watchers = watchers;
  let event = 'calm';
  if (watchers > 0) {
    // Close sightings fill the meter in about a second and a half;
    // a far glimpse at the cone's edge takes closer to four seconds.
    const rate = 26 + strongest * 48;
    detection.value += rate * dt;
    const band = Math.floor(detection.value / 25);
    if (band > detection.lastBand && detection.value < DETECTION_MAX) {
      detection.lastBand = band;
      event = 'rising';
    }
  } else {
    // Hidden again: the meter drains in a little over three seconds.
    detection.value -= 30 * dt;
    if (detection.value < 0) detection.value = 0;
    detection.lastBand = Math.floor(detection.value / 25);
  }
  if (detection.value >= DETECTION_MAX) {
    detection.value = DETECTION_MAX;
    return 'alarm';
  }
  return event;
}

/** Start the meter over for a new attempt. */
export function resetDetection(detection) {
  detection.value = 0;
  detection.strongest = 0;
  detection.watchers = 0;
  detection.lastBand = 0;
}
