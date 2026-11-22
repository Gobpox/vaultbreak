// player.js — the thief. One job: move with WASD/arrows, collide with walls
// and cover, and pocket loot by standing on it.

import { PLAYER_RADIUS, PLAYER_SPEED, PLAYER_SPRINT_SPEED, LOOT_PICKUP_SECONDS } from './config.js';
import { pointInRect } from './vision.js';

export function createPlayer(x, y) {
  return { x, y, radius: PLAYER_RADIUS, moving: false, sprinting: false, pickupTarget: null };
}

function circleHitsRect(px, py, r, rect) {
  const cx = Math.max(rect.x, Math.min(px, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(py, rect.y + rect.h));
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy < r * r;
}

function blockedAt(x, y, r, solids) {
  for (const s of solids) {
    if (circleHitsRect(x, y, r, s)) return true;
  }
  return false;
}

export function movePlayer(player, keys, dt, solids) {
  let dx = 0;
  let dy = 0;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  player.moving = dx !== 0 || dy !== 0;
  player.sprinting = !!keys.sprint && player.moving;
  if (!player.moving) return;
  const len = Math.hypot(dx, dy);
  const speed = player.sprinting ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
  dx = (dx / len) * speed * dt;
  dy = (dy / len) * speed * dt;
  // Axis-separated movement so the thief slides along walls instead of sticking.
  const nx = player.x + dx;
  if (!blockedAt(nx, player.y, player.radius, solids)) player.x = nx;
  const ny = player.y + dy;
  if (!blockedAt(player.x, ny, player.radius, solids)) player.y = ny;
}

// Standing on loot pockets it after LOOT_PICKUP_SECONDS (instant with the
// Fast Fingers tool). Returns the loot item just taken, or null.
export function updateLootPickup(player, level, dt, instant) {
  for (const loot of level.loot) {
    if (loot.taken) continue;
    const d = Math.hypot(loot.x - player.x, loot.y - player.y);
    if (d < 30) {
      if (instant) {
        loot.taken = true;
        loot.progress = 1;
        return loot;
      }
      loot.progress += dt / LOOT_PICKUP_SECONDS;
      player.pickupTarget = loot;
      if (loot.progress >= 1) {
        loot.taken = true;
        return loot;
      }
      return null;
    }
    loot.progress = 0;
  }
  player.pickupTarget = null;
  return null;
}

export function playerOnExit(player, level) {
  return pointInRect(player.x, player.y, level.exit);
}
