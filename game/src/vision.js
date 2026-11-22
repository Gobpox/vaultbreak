// vision.js — vision-cone maths and line-of-sight. One job: answer "can this
// watcher see this point?" Walls and cover block sight; nothing else does.

export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// Sample the segment watcher->target; blocked if any sample lands in a blocker.
export function lineOfSight(x1, y1, x2, y2, blockers) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const steps = Math.max(4, Math.ceil(dist / 9));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const x = x1 + dx * t;
    const y = y1 + dy * t;
    for (const b of blockers) {
      if (pointInRect(x, y, b)) return false;
    }
  }
  return true;
}

// watcher: {x, y, angle, range, halfAngle}. Returns true when the target point
// is inside the cone and no blocker sits between watcher and target.
export function coneSees(watcher, tx, ty, blockers) {
  const dx = tx - watcher.x;
  const dy = ty - watcher.y;
  const dist = Math.hypot(dx, dy);
  if (dist > watcher.range) return false;
  if (dist < 6) return true;
  const targetAngle = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(targetAngle, watcher.angle)) > watcher.halfAngle) return false;
  return lineOfSight(watcher.x, watcher.y, tx, ty, blockers);
}

// Cone polygon points for rendering (fan of points along the arc).
export function conePolygon(watcher, steps = 18) {
  const pts = [{ x: watcher.x, y: watcher.y }];
  for (let i = 0; i <= steps; i += 1) {
    const a = watcher.angle - watcher.halfAngle + (2 * watcher.halfAngle * i) / steps;
    pts.push({ x: watcher.x + Math.cos(a) * watcher.range, y: watcher.y + Math.sin(a) * watcher.range });
  }
  return pts;
}
