// shots.js — deterministic screenshot states. One job: pose the game for each
// of the four screenshots (cover, mid-play tension, draft, getaway grade)
// at a frozen simulation time, so every render is identical.

import { buildLevel } from './levels.js';
import { createPlayer } from './player.js';
import { createAlarm } from './alarm.js';
import { TOOL_DEFS } from './tools.js';

function placeGuard(level, i, x, y, angle) {
  const g = level.guards[i];
  if (!g) return;
  g.x = x;
  g.y = y;
  g.angle = angle;
  g.targetIndex = 1;
  g.pause = 0;
}

export function applyShot(state, shot) {
  state.shot = shot;
  state.frozen = true;
  state.time = 2.0;
  if (shot === 'start') {
    // Cover: the title poster over the living Aurora Vault — thief mid-room,
    // two guards + cones, cameras sweeping, gold loot, the alarm bar.
    state.screen = 'title';
    state.levelIndex = 4;
    state.level = buildLevel(4);
    state.player = createPlayer(640, 540);
    state.alarm = createAlarm();
    state.alarm.value = 22;
    placeGuard(state.level, 0, 520, 180, Math.PI / 2);
    placeGuard(state.level, 1, 780, 680, -Math.PI / 2);
    placeGuard(state.level, 2, 640, 580, Math.PI * 0.75);
    state.level.cameras[0].angle = Math.PI * 0.45;
    state.level.cameras[1].angle = Math.PI * 0.6;
    state.level.cameras[2].angle = Math.PI * 0.5;
    state.stats.stageTime = 0;
    state.stats.totalLoot = 0;
  } else if (shot === 'play') {
    // Mid-stage tension in the museum: thief at the very edge of a cone,
    // alarm at 60% flashing SPOTTED?, camera mid-sweep, half the loot taken.
    state.screen = 'play';
    state.levelIndex = 2;
    state.level = buildLevel(2);
    state.player = createPlayer(400, 480);
    state.alarm = createAlarm();
    state.alarm.value = 60;
    state.alarm.spotted = true;
    placeGuard(state.level, 0, 400, 320, Math.PI / 2);
    state.level.guards[0].alerted = true;
    placeGuard(state.level, 1, 880, 420, -Math.PI / 2);
    state.level.cameras[0].angle = Math.PI * 0.8;
    state.level.cameras[1].angle = -Math.PI * 0.4;
    state.level.loot[0].taken = true;
    state.level.loot[1].taken = true;
    state.stats.stageTime = 96;
    state.stats.totalLoot = 1200;
    state.stats.spottedCount = 2;
    state.tools.owned = ['smoke'];
  } else if (shot === 'draft') {
    // The 1-of-3 draft between jobs, with each tool's cost written on it.
    state.screen = 'draft';
    state.levelIndex = 2;
    state.level = buildLevel(2);
    state.player = createPlayer(90, 150);
    state.alarm = createAlarm();
    state.alarm.value = 8;
    state.draft = [TOOL_DEFS.smoke, TOOL_DEFS.emp, TOOL_DEFS.decoy];
    state.stats.totalLoot = 2000;
    state.stats.stageTime = 0;
  } else if (shot === 'end') {
    // The getaway grade screen: big grade, per-stage analytics, total loot.
    state.screen = 'end';
    state.levelIndex = 4;
    state.level = buildLevel(4);
    state.player = createPlayer(90, 150);
    state.alarm = createAlarm();
    state.alarm.value = 0;
    state.stats.totalLoot = 19200;
    state.stats.totalTime = 742;
    state.stats.spottedCount = 0;
    state.stats.toolsUsed = 3;
    state.stats.cleanCostPaid = 35;
    state.stats.score = 96;
    state.stats.grade = 'S';
    state.stats.stageRows = [
      { name: 'Corner Store Warm-Up', loot: 400, time: 58, spotted: 0 },
      { name: 'Meridian Bank — Night Shift', loot: 1600, time: 132, spotted: 0 },
      { name: 'Halcyon Museum — Laser Night', loot: 2500, time: 168, spotted: 0 },
      { name: 'Casino Royale Pit — High Roller', loot: 5100, time: 184, spotted: 0 },
      { name: 'The Aurora Vault', loot: 9600, time: 200, spotted: 0 },
    ];
  }
}
