// levels.js — the five named rooms of VAULTBREAK. One job: hand-designed room
// data (walls, cover, patrols, cameras, loot, exit, laser gates). Every room
// offers at least two routes: around the cover, or through the service lane
// behind it. Layouts are fixed, so screenshots are deterministic.

import { STAGE_NAMES, STAGE_MODIFIERS, STAGE_FLOORS } from './config.js';

function rect(x, y, w, h) {
  return { x, y, w, h };
}

// Outer walls of every room (the HUD sits above y=72; the room starts at 80).
function borderWalls() {
  return [
    rect(16, 80, 1248, 14),
    rect(16, 770, 1248, 14),
    rect(16, 80, 14, 704),
    rect(1250, 80, 14, 704),
  ];
}

const LEVELS = [
  {
    // 1 — Corner Store Warm-Up
    cover: [
      rect(300, 220, 180, 26),
      rect(700, 220, 180, 26),
      rect(500, 480, 220, 30),
      rect(950, 480, 140, 26),
    ],
    guards: [
      { x: 640, y: 180, waypoints: [{ x: 640, y: 180 }, { x: 640, y: 640 }], speed: 58 },
    ],
    cameras: [
      { x: 1240, y: 96, baseAngle: Math.PI * 0.75, amp: 0.7, period: 5, phase: 0 },
    ],
    loot: [
      { x: 180, y: 180, value: 120 },
      { x: 1100, y: 180, value: 200 },
      { x: 180, y: 660, value: 80 },
    ],
    laserGates: [],
    noisy: false,
  },
  {
    // 2 — Meridian Bank, Night Shift: paired patrols crossing the hall.
    cover: [
      rect(300, 180, 200, 30),
      rect(780, 180, 200, 30),
      rect(400, 300, 40, 40),
      rect(840, 300, 40, 40),
      rect(400, 560, 40, 40),
      rect(840, 560, 40, 40),
      rect(560, 640, 160, 26),
    ],
    guards: [
      { x: 320, y: 420, waypoints: [{ x: 320, y: 420 }, { x: 960, y: 420 }], speed: 66 },
      { x: 640, y: 180, waypoints: [{ x: 640, y: 180 }, { x: 640, y: 660 }], speed: 62 },
    ],
    cameras: [
      { x: 34, y: 96, baseAngle: Math.PI * 0.25, amp: 0.6, period: 6, phase: 0 },
      { x: 1246, y: 96, baseAngle: Math.PI * 0.75, amp: 0.6, period: 6, phase: 3 },
    ],
    loot: [
      { x: 180, y: 160, value: 300 },
      { x: 1100, y: 160, value: 450 },
      { x: 180, y: 680, value: 250 },
      { x: 1100, y: 680, value: 600 },
    ],
    laserGates: [],
    noisy: false,
  },
  {
    // 3 — Halcyon Museum: display cases as cover, noisy parquet floor.
    cover: [
      rect(280, 240, 150, 40),
      rect(850, 240, 150, 40),
      rect(280, 520, 150, 40),
      rect(850, 520, 150, 40),
      rect(600, 380, 80, 80),
    ],
    guards: [
      { x: 400, y: 180, waypoints: [{ x: 400, y: 180 }, { x: 400, y: 640 }], speed: 68 },
      { x: 880, y: 640, waypoints: [{ x: 880, y: 640 }, { x: 880, y: 180 }], speed: 68 },
    ],
    cameras: [
      { x: 640, y: 96, baseAngle: Math.PI * 0.5, amp: 0.9, period: 5, phase: 0 },
      { x: 34, y: 754, baseAngle: -Math.PI * 0.25, amp: 0.6, period: 7, phase: 2 },
    ],
    loot: [
      { x: 180, y: 180, value: 500 },
      { x: 1100, y: 180, value: 700 },
      { x: 640, y: 300, value: 900 },
      { x: 640, y: 700, value: 400 },
    ],
    laserGates: [],
    noisy: true,
  },
  {
    // 4 — Casino Royale Pit: fast guards, five loot piles.
    cover: [
      rect(300, 260, 170, 60),
      rect(810, 260, 170, 60),
      rect(300, 540, 170, 60),
      rect(810, 540, 170, 60),
      rect(560, 150, 160, 26),
    ],
    guards: [
      { x: 350, y: 420, waypoints: [{ x: 350, y: 420 }, { x: 930, y: 420 }], speed: 92 },
      { x: 640, y: 180, waypoints: [{ x: 640, y: 180 }, { x: 640, y: 680 }], speed: 88 },
      { x: 200, y: 600, waypoints: [{ x: 200, y: 600 }, { x: 1080, y: 600 }], speed: 84 },
    ],
    cameras: [
      { x: 34, y: 96, baseAngle: Math.PI * 0.25, amp: 0.7, period: 5, phase: 0 },
      { x: 1246, y: 96, baseAngle: Math.PI * 0.75, amp: 0.7, period: 5, phase: 2.5 },
    ],
    loot: [
      { x: 180, y: 160, value: 800 },
      { x: 1100, y: 160, value: 1000 },
      { x: 640, y: 420, value: 1200 },
      { x: 180, y: 680, value: 600 },
      { x: 1100, y: 680, value: 1500 },
    ],
    laserGates: [],
    noisy: false,
  },
  {
    // 5 — BOS: The Aurora Vault. A spinning guard, twin laser gates, 3 cameras.
    cover: [
      rect(580, 360, 120, 120),
      rect(300, 300, 44, 44),
      rect(940, 300, 44, 44),
      rect(300, 560, 44, 44),
      rect(940, 560, 44, 44),
    ],
    guards: [
      { x: 300, y: 180, waypoints: [{ x: 300, y: 180 }, { x: 980, y: 180 }], speed: 78 },
      { x: 980, y: 680, waypoints: [{ x: 980, y: 680 }, { x: 300, y: 680 }], speed: 78 },
      { x: 640, y: 580, waypoints: [{ x: 640, y: 580 }], speed: 0, spin: true },
    ],
    cameras: [
      { x: 34, y: 96, baseAngle: Math.PI * 0.25, amp: 0.6, period: 5, phase: 0 },
      { x: 1246, y: 96, baseAngle: Math.PI * 0.75, amp: 0.6, period: 5, phase: 2.5 },
      { x: 640, y: 96, baseAngle: Math.PI * 0.5, amp: 0.8, period: 6, phase: 1 },
    ],
    loot: [
      { x: 180, y: 160, value: 1000 },
      { x: 1100, y: 160, value: 1200 },
      { x: 640, y: 300, value: 5000 },
      { x: 180, y: 680, value: 900 },
      { x: 1100, y: 680, value: 1500 },
    ],
    laserGates: [
      { x: 440, y: 200, w: 10, h: 400, period: 4, phase: 0 },
      { x: 840, y: 200, w: 10, h: 400, period: 4, phase: 2 },
    ],
    noisy: false,
  },
];

export function buildLevel(index) {
  const def = LEVELS[index];
  return {
    index,
    name: STAGE_NAMES[index],
    modifier: STAGE_MODIFIERS[index],
    floor: STAGE_FLOORS[index],
    walls: borderWalls(),
    cover: def.cover.map((c) => ({ ...c })),
    guards: def.guards.map((g) => ({
      ...g,
      waypoints: g.waypoints.map((w) => ({ ...w })),
      angle: Math.PI / 2,
      targetIndex: 1,
      pause: 0,
      alerted: false,
      distracted: null,
    })),
    cameras: def.cameras.map((c) => ({ ...c, angle: c.baseAngle, disabledUntil: 0 })),
    loot: def.loot.map((l) => ({ ...l, taken: false, progress: 0 })),
    laserGates: def.laserGates.map((g) => ({ ...g })),
    noisy: def.noisy,
    start: { x: 90, y: 150 },
    exit: { x: 1150, y: 726, w: 90, h: 44 },
  };
}

export function levelLootTotal(level) {
  return level.loot.reduce((sum, l) => sum + l.value, 0);
}

export function levelLootTaken(level) {
  return level.loot.filter((l) => l.taken).reduce((sum, l) => sum + l.value, 0);
}

export function allLootTaken(level) {
  return level.loot.every((l) => l.taken);
}
