// render.js — everything the eye sees, drawn on one canvas. Dark moody
// museum at night: a tiled floor in near-black blue, warm pools of lamp
// light, amber vision cones that flush red as the alarm meter climbs,
// cover you can read at a glance (crates, plants, statues), sentries in
// dark uniforms with amber visors, the thief in teal, and the exit as a
// glowing skylight door. The HUD is drawn on the canvas too, so a
// screenshot carries the whole game.

import { TILE, COLS, ROWS } from './levels.js';
import { DETECTION_MAX } from './detection.js';

const W = COLS * TILE;
const H = ROWS * TILE;
const HUD_H = 36;

/** Mix amber (calm) into red (alarm) by t 0..1; returns [r, g, b]. */
function alarmColour(t) {
  const r = Math.round(245 + (235 - 245) * t);
  const g = Math.round(166 + (60 - 166) * t);
  const b = Math.round(35 + (50 - 35) * t);
  return [r, g, b];
}

/** Format seconds as m:ss. */
function fmtTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** The floor: dark tiles with a faint checker and grid, plus lamp pools. */
function drawFloor(ctx, level, time) {
  ctx.fillStyle = '#0b101c';
  ctx.fillRect(0, 0, W, H);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if ((col + row) % 2 === 0) {
        ctx.fillStyle = '#0e1524';
        ctx.fillRect(col * TILE, row * TILE, TILE, TILE);
      }
    }
  }
  ctx.strokeStyle = 'rgba(130, 160, 210, 0.055)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let col = 0; col <= COLS; col++) {
    ctx.moveTo(col * TILE + 0.5, 0);
    ctx.lineTo(col * TILE + 0.5, H);
  }
  for (let row = 0; row <= ROWS; row++) {
    ctx.moveTo(0, row * TILE + 0.5);
    ctx.lineTo(W, row * TILE + 0.5);
  }
  ctx.stroke();
  // Warm pools of lamplight on the gallery floor.
  const lamps = [
    [4.5, 3.5, 150], [12.5, 1.5, 130], [19.5, 5.5, 150],
    [7.5, 10.5, 140], [15.5, 12.5, 150], [21.5, 10.5, 130],
  ];
  for (const [c, r, rad] of lamps) {
    const x = c * TILE;
    const y = r * TILE;
    const grad = ctx.createRadialGradient(x, y, 8, x, y, rad);
    grad.addColorStop(0, 'rgba(255, 196, 110, 0.075)');
    grad.addColorStop(1, 'rgba(255, 196, 110, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  void time;
}

/** Walls: heavy stone blocks with a lit top edge. */
function drawWalls(ctx, level) {
  for (const wall of level.walls) {
    ctx.fillStyle = '#1b2540';
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = '#27375e';
    ctx.fillRect(wall.x, wall.y, wall.w, 4);
    ctx.fillStyle = '#121a2e';
    ctx.fillRect(wall.x, wall.y + wall.h - 3, wall.w, 3);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(wall.x + 0.5, wall.y + 0.5, wall.w - 1, wall.h - 1);
  }
}

/** One crate: nailed wooden box with cross planks. */
function drawCrate(ctx, rect) {
  ctx.fillStyle = '#5d3f1e';
  ctx.fillRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
  ctx.fillStyle = '#7a5426';
  ctx.fillRect(rect.x + 3, rect.y + 3, rect.w - 6, 8);
  ctx.strokeStyle = '#3a2712';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rect.x + 5, rect.y + 5);
  ctx.lineTo(rect.x + rect.w - 5, rect.y + rect.h - 5);
  ctx.moveTo(rect.x + rect.w - 5, rect.y + 5);
  ctx.lineTo(rect.x + 5, rect.y + rect.h - 5);
  ctx.stroke();
  ctx.strokeStyle = '#8a6234';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(rect.x + 3.5, rect.y + 3.5, rect.w - 7, rect.h - 7);
}

/** One tall plant: terracotta pot with a burst of dark leaves. */
function drawPlant(ctx, rect) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.fillStyle = '#4a2c1c';
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy + 12);
  ctx.lineTo(cx + 9, cy + 12);
  ctx.lineTo(cx + 6, cy + 2);
  ctx.lineTo(cx - 6, cy + 2);
  ctx.closePath();
  ctx.fill();
  const leaves = [
    [0, -12, 11], [-9, -7, 9], [9, -7, 9], [-5, -15, 8], [5, -15, 8], [0, -6, 9],
  ];
  for (const [dx, dy, r] of leaves) {
    ctx.fillStyle = dx === 0 && dy === -6 ? '#2f8a4c' : '#1f6b38';
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#3fae62';
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 13, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

/** One marble statue: pedestal and a pale bust. */
function drawStatue(ctx, rect) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.fillStyle = '#3c3c48';
  ctx.fillRect(cx - 11, cy + 4, 22, 12);
  ctx.fillStyle = '#55555f';
  ctx.fillRect(cx - 11, cy + 4, 22, 3);
  ctx.fillStyle = '#9a9aa8';
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7e7e8c';
  ctx.beginPath();
  ctx.arc(cx - 3, cy - 8, 3, 0, Math.PI * 2);
  ctx.fill();
}

/** Cover pieces, each kind drawn so it reads at a glance. */
function drawCover(ctx, level) {
  for (const piece of level.cover) {
    if (piece.kind === 'C') drawCrate(ctx, piece);
    else if (piece.kind === 'P') drawPlant(ctx, piece);
    else drawStatue(ctx, piece);
  }
}

/** The glowing exit skylight: teal portal, rings and a soft halo. */
function drawExit(ctx, level, time) {
  const { x, y } = level.exit;
  const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
  const halo = ctx.createRadialGradient(x, y, 6, x, y, 74 + pulse * 14);
  halo.addColorStop(0, 'rgba(53, 242, 200, 0.34)');
  halo.addColorStop(1, 'rgba(53, 242, 200, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x - 90, y - 90, 180, 180);
  ctx.fillStyle = '#0d3b32';
  ctx.fillRect(x - 17, y - 17, 34, 34);
  ctx.strokeStyle = '#35f2c8';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x - 17.5, y - 17.5, 35, 35);
  ctx.strokeStyle = `rgba(53, 242, 200, ${0.45 + pulse * 0.4})`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 23.5, y - 23.5, 47, 47);
  ctx.fillStyle = '#35f2c8';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('EXIT', x, y - 26);
}

/** A sentry's patrol route, faintly dotted so the player can learn it. */
function drawPatrolRoutes(ctx, guards) {
  ctx.save();
  ctx.setLineDash([3, 7]);
  ctx.strokeStyle = 'rgba(245, 166, 35, 0.20)';
  ctx.lineWidth = 1.5;
  for (const guard of guards) {
    const pts = guard.patrol.waypoints;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

/** One vision cone: a wedge of light, amber when calm, red when alarmed. */
function drawCone(ctx, guard, alarmT) {
  const [r, g, b] = alarmColour(alarmT);
  const grad = ctx.createRadialGradient(guard.x, guard.y, 6, guard.x, guard.y, guard.range);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.34)`);
  grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.05)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, guard.range, guard.facing - guard.halfAngle, guard.facing + guard.halfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, guard.range, guard.facing - guard.halfAngle, guard.facing + guard.halfAngle);
  ctx.closePath();
  ctx.stroke();
}

/** One sentry: dark uniform, amber visor, and an alarm bar when seen. */
function drawGuard(ctx, guard, detection) {
  const alarmT = detection.value / DETECTION_MAX;
  drawCone(ctx, guard, alarmT);
  // Soft shadow under the sentry.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y + 12, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: dark uniform with a lit rim.
  ctx.fillStyle = '#232c44';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f5a623';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 13, 0, Math.PI * 2);
  ctx.stroke();
  // Visor: an amber wedge showing where the sentry looks.
  ctx.fillStyle = '#f5a623';
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, 9, guard.facing - 0.5, guard.facing + 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0b101c';
  ctx.beginPath();
  ctx.arc(guard.x + Math.cos(guard.facing) * 4, guard.y + Math.sin(guard.facing) * 4, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Alarm bar above the head while this sentry is spotting the thief.
  if (guard.sight > 0 || detection.value > 0) {
    const w = 38;
    const frac = Math.max(guard.sight, detection.value / DETECTION_MAX);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(guard.x - w / 2, guard.y - 30, w, 6);
    const [r, g, b] = alarmColour(frac);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(guard.x - w / 2 + 1, guard.y - 29, (w - 2) * frac, 4);
  }
}

/** The thief: a teal hooded figure with a soft shadow and a walk bob. */
function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(player.bob) * 1.5 : Math.sin(time * 1.5) * 0.8;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 12, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d8f7a';
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob * 0.4, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#35e0c0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob * 0.4, player.radius, 0, Math.PI * 2);
  ctx.stroke();
  // Hood point and face shadow, turned toward the walk direction.
  const hx = player.x + Math.cos(player.facing) * 6;
  const hy = player.y + bob * 0.4 + Math.sin(player.facing) * 6;
  ctx.fillStyle = '#0e2b25';
  ctx.beginPath();
  ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#35e0c0';
  ctx.beginPath();
  ctx.arc(hx + Math.cos(player.facing) * 2, hy + Math.sin(player.facing) * 2, 2, 0, Math.PI * 2);
  ctx.fill();
}

/** The top HUD bar: level, alarm meter, watchers and the clock. */
function drawHud(ctx, world) {
  ctx.fillStyle = 'rgba(5, 8, 15, 0.88)';
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = 'rgba(120, 150, 200, 0.25)';
  ctx.fillRect(0, HUD_H - 1, W, 1);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#c8d4e8';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(world.level.shortName, 14, HUD_H / 2 + 1);
  // Alarm meter.
  const barX = 250;
  const barW = 260;
  const barY = 11;
  const frac = world.detection.value / DETECTION_MAX;
  ctx.fillStyle = '#8a93a8';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText('DETECTION', barX - 82, HUD_H / 2 + 1);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fillRect(barX, barY, barW, 14);
  const [r, g, b] = alarmColour(frac);
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(barX + 1, barY + 1, Math.max(0, (barW - 2) * frac), 12);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, 13);
  ctx.fillStyle = '#e8eef8';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${Math.round(world.detection.value)}`, barX + barW + 10, HUD_H / 2 + 1);
  // Watchers and clock, right aligned.
  ctx.textAlign = 'right';
  ctx.fillStyle = world.detection.watchers > 0 ? '#f5a623' : '#8a93a8';
  ctx.font = 'bold 12px system-ui, sans-serif';
  const eyes = world.detection.watchers > 0 ? `EYES ON YOU ×${world.detection.watchers}` : 'UNSEEN';
  ctx.fillText(eyes, W - 110, HUD_H / 2 + 1);
  ctx.fillStyle = '#c8d4e8';
  ctx.fillText(fmtTime(world.elapsed), W - 16, HUD_H / 2 + 1);
  // Hint line under the bar while playing.
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(200, 212, 232, 0.55)';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText('WASD / arrows to move · R restart · S save a picture', 14, H - 12);
}

/** A dim veil over the level, for the menu and end screens. */
function veil(ctx, alpha) {
  ctx.fillStyle = `rgba(4, 7, 13, ${alpha})`;
  ctx.fillRect(0, 0, W, H);
}

/** Centred title text with a soft glow. */
function titleText(ctx, text, y, size, colour) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.shadowColor = colour;
  ctx.shadowBlur = 18;
  ctx.fillStyle = colour;
  ctx.fillText(text, W / 2, y);
  ctx.shadowBlur = 0;
}

/** The title screen, over a dimmed view of the first level. */
export function drawMenu(ctx, world, time) {
  drawWorld(ctx, world, time);
  veil(ctx, 0.72);
  titleText(ctx, 'NIGHTGLASS', 128, 64, '#e8eef8');
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f5a623';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('A QUIET MUSEUM HEIST', W / 2, 168);
  ctx.fillStyle = '#c8d4e8';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Slip past the sentries. Stay out of the amber cones.', W / 2, 214);
  ctx.fillText('Hide behind crates, plants and statues. Reach the glowing exit unseen.', W / 2, 238);
  ctx.fillStyle = '#8a93a8';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('WASD or arrow keys to move · R to restart · S to save a picture', W / 2, 272);
  // Level cards.
  const cards = [
    { key: '1', label: 'LEVEL 1 — THE GALLERY', note: 'two sentries · learn the patrols' },
    { key: '2', label: 'LEVEL 2 — THE VAULT WING', note: 'three sentries · faster, longer cones' },
  ];
  cards.forEach((card, i) => {
    const x = W / 2 - 260 + i * 280;
    const y = 310;
    const selected = world.menuLevel === i;
    ctx.fillStyle = selected ? 'rgba(53, 224, 192, 0.14)' : 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(x, y, 240, 86);
    ctx.strokeStyle = selected ? '#35e0c0' : 'rgba(200, 212, 232, 0.35)';
    ctx.lineWidth = selected ? 2 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, 239, 85);
    ctx.fillStyle = '#e8eef8';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(card.label, x + 120, y + 30);
    ctx.fillStyle = '#8a93a8';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(card.note, x + 120, y + 54);
    ctx.fillStyle = '#f5a623';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(`press ${card.key}`, x + 120, y + 72);
  });
  ctx.fillStyle = '#e8eef8';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('Press ENTER or click to begin', W / 2, 448);
  ctx.fillStyle = 'rgba(200, 212, 232, 0.6)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('If a sentry sees you, break line of sight — the alarm meter drains while you hide.', W / 2, 476);
}

/** The win screen after a level: time, and what comes next. */
export function drawWin(ctx, world, time) {
  drawWorld(ctx, world, time);
  veil(ctx, 0.66);
  titleText(ctx, 'CLEAN GETAWAY', 170, 52, '#35f2c8');
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c8d4e8';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(`${world.level.name} — slipped out in ${fmtTime(world.elapsed)}.`, W / 2, 226);
  if (world.levelIndex + 1 < world.totalLevels) {
    ctx.fillText('The vault wing is still ahead. The patrols there are faster.', W / 2, 254);
    ctx.fillStyle = '#e8eef8';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('Press ENTER for the next level · R to replay this one', W / 2, 320);
  } else {
    ctx.fillText('Both wings cleared. Not a single alarm raised — the night is yours.', W / 2, 254);
    ctx.fillStyle = '#e8eef8';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('Press ENTER to play again · R to replay the vault wing', W / 2, 320);
  }
}

/** The lose screen: the alarm went up. */
export function drawLose(ctx, world, time) {
  drawWorld(ctx, world, time);
  veil(ctx, 0.7);
  titleText(ctx, 'CAUGHT!', 170, 60, '#eb3c32');
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c8d4e8';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('The alarm meter filled — the sentries closed in.', W / 2, 232);
  ctx.fillText('Watch the patrols, wait for the cone to pass, then move.', W / 2, 260);
  ctx.fillStyle = '#e8eef8';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('Press R or click to try again', W / 2, 322);
}

/** The live game: floor, cover, exit, patrols, cones, actors, HUD. */
export function drawWorld(ctx, world, time) {
  drawFloor(ctx, world.level, time);
  drawPatrolRoutes(ctx, world.guards);
  drawCover(ctx, world.level);
  drawExit(ctx, world.level, time);
  drawWalls(ctx, world.level);
  for (const guard of world.guards) drawGuard(ctx, guard, world.detection);
  drawPlayer(ctx, world.player, time);
  // A soft vignette: the edges of the museum fall away into dark.
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 0.95);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  drawHud(ctx, world);
}

/** A small caption chip for the staged demo scenes. */
export function drawSceneCaption(ctx, text) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px system-ui, sans-serif';
  const w = ctx.measureText(text).width + 28;
  ctx.fillStyle = 'rgba(5, 8, 15, 0.85)';
  ctx.fillRect(12, H - 44, w, 30);
  ctx.strokeStyle = 'rgba(245, 166, 35, 0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(12.5, H - 43.5, w - 1, 29);
  ctx.fillStyle = '#f5c86e';
  ctx.fillText(text, 26, H - 29);
}
