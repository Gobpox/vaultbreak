// config.js — tuning for VAULTBREAK: canvas, movement, alarm, scoring.
// One job: every number the rest of the game tunes against lives here.

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const HUD_H = 72;
export const PLAY_TOP = HUD_H;
export const PLAY_BOTTOM = VIEW_H - 26;

export const PLAYER_RADIUS = 13;
export const PLAYER_SPEED = 205;
export const PLAYER_SPRINT_SPEED = 265;

export const GUARD_CONE_RANGE = 195;
export const GUARD_CONE_HALF_ANGLE = 0.56; // radians, ~32 degrees each side
export const CAMERA_CONE_RANGE = 235;
export const CAMERA_CONE_HALF_ANGLE = 0.42;

export const ALARM_RISE_GUARD = 46; // per second while seen by a guard
export const ALARM_RISE_CAMERA = 30; // per second while seen by a camera
export const ALARM_RISE_LASER = 42; // per second inside an active laser gate
export const ALARM_FALL = 15; // per second while hidden
export const ALARM_SPOTTED_AT = 55; // "SPOTTED?" warning starts here
export const ALARM_CAUGHT_AT = 100;

export const LOOT_PICKUP_SECONDS = 0.6; // standing on loot to pocket it
export const SMOKE_SECONDS = 3;
export const EMP_SECONDS = 6;
export const DECOY_SECONDS = 4;

export const STAGE_NAMES = [
  'Corner Store Warm-Up',
  'Meridian Bank — Night Shift',
  'Halcyon Museum — Laser Night',
  'Casino Royale Pit — High Roller',
  'The Aurora Vault',
];

export const STAGE_MODIFIERS = [
  'Tutorial lembut: 1 penjaga, 1 kamera',
  'Patroli ganda: 2 penjaga berpasangan',
  'Kamera penyapu + lantai berisik (lari = alarm naik)',
  'Penjaga cepat, loot berlimpah',
  'BOS: kerucut berputar, kamera ganda, gerbang laser berkala',
];

export const STAGE_FLOORS = ['tile', 'marble', 'parquet', 'carpet', 'steel'];

// Grade thresholds on the final 0-100 score.
export const GRADE_CUTS = [
  ['S', 90],
  ['A', 75],
  ['B', 60],
  ['C', 45],
  ['D', 0],
];

export function gradeForScore(score) {
  for (const [grade, cut] of GRADE_CUTS) {
    if (score >= cut) return grade;
  }
  return 'D';
}
