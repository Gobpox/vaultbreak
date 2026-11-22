// guards.js — patrol movement and the "seen" check for one guard.
// One job: move a guard along its waypoints (or spin in place) and report
// whether it can see the thief right now.

import { GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE } from './config.js';
import { coneSees } from './vision.js';

export function guardWatcher(guard) {
  return {
    x: guard.x,
    y: guard.y,
    angle: guard.angle,
    range: GUARD_CONE_RANGE,
    halfAngle: GUARD_CONE_HALF_ANGLE,
  };
}

export function guardSeesPlayer(guard, player, blockers) {
  return coneSees(guardWatcher(guard), player.x, player.y, blockers);
}

// dt seconds; time is absolute game time (drives the spinner).
export function updateGuard(guard, dt, time) {
  if (guard.spin) {
    guard.angle = time * 0.9;
    return;
  }
  if (guard.distracted) {
    // Walk toward the decoy coin, then stand and stare at it.
    const tx = guard.distracted.x;
    const ty = guard.distracted.y;
    const dx = tx - guard.x;
    const dy = ty - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 14) {
      guard.angle = Math.atan2(dy, dx);
      guard.x += (dx / dist) * guard.speed * 0.8 * dt;
      guard.y += (dy / dist) * guard.speed * 0.8 * dt;
    }
    return;
  }
  if (guard.pause > 0) {
    guard.pause -= dt;
    return;
  }
  const target = guard.waypoints[guard.targetIndex];
  if (!target) return;
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const step = guard.speed * dt;
  if (dist <= step) {
    guard.x = target.x;
    guard.y = target.y;
    guard.targetIndex = (guard.targetIndex + 1) % guard.waypoints.length;
    guard.pause = 0.8;
    return;
  }
  guard.angle = Math.atan2(dy, dx);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
}

// While a guard is alerted it closes in on the thief instead of patrolling.
export function updateGuardChase(guard, dt, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return;
  guard.angle = Math.atan2(dy, dx);
  const step = guard.speed * 1.35 * dt;
  guard.x += (dx / dist) * Math.min(step, dist);
  guard.y += (dy / dist) * Math.min(step, dist);
}
