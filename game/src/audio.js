// audio.js — the whole soundtrack, generated in code with WebAudio.
// No sound files: every blip is a short oscillator envelope. The context
// is created lazily on the first key press or click, so browsers' autoplay
// rules never block the page from loading.

let ctx = null;
let master = null;

/** Create (or reuse) the audio context. Safe to call before any gesture. */
export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
    return true;
  } catch {
    return false;
  }
}

/** One short tone: frequency, length in seconds, wave shape, volume. */
function blip(freq, seconds, type, volume, slideTo) {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + seconds);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + seconds + 0.02);
}

/** A soft footstep: a low thud that alternates pitch, left then right. */
let stepFlip = false;
export function footstepSound() {
  stepFlip = !stepFlip;
  blip(stepFlip ? 150 : 120, 0.07, 'sine', 0.5);
}

/** The detection meter crossed a new band: a rising warning tick. */
export function warningSound(band) {
  blip(320 + band * 140, 0.12, 'triangle', 0.7, 320 + band * 200);
}

/** The alarm: a two-tone siren that says the run is over. */
export function alarmSound() {
  if (!ctx || !master) return;
  blip(620, 0.5, 'sawtooth', 0.5, 420);
  setTimeout(() => blip(620, 0.5, 'sawtooth', 0.5, 420), 260);
}

/** The getaway: a small rising arpeggio when the thief slips out. */
export function winSound() {
  if (!ctx || !master) return;
  [523, 659, 784, 1047].forEach((freq, i) => {
    setTimeout(() => blip(freq, 0.22, 'triangle', 0.6), i * 110);
  });
}

/** A quiet click for menu confirmations. */
export function clickSound() {
  blip(880, 0.06, 'sine', 0.4);
}
