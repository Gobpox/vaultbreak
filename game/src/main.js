// main.js — boot and game loop for VAULTBREAK. One job: own the state
// machine (title -> play -> draft -> caught -> getaway grade), step the
// simulation, and hand every frame to render.js.

import { VIEW_W, VIEW_H, ALARM_CAUGHT_AT } from './config.js';
import { buildLevel, levelLootTaken, allLootTaken } from './levels.js';
import { createPlayer, movePlayer, updateLootPickup, playerOnExit } from './player.js';
import { createAlarm, updateAlarm } from './alarm.js';
import { updateGuard, updateGuardChase, guardSeesPlayer } from './guards.js';
import { updateCamera, cameraSeesPlayer, cameraIsDisabled } from './cameras.js';
import { createToolState, draftThree, hasTool, useTool, smokeActive, clearExpiredDecoy, TOOL_DEFS } from './tools.js';
import { createInput, consumePressed, consumeClick } from './input.js';
import { drawGame, laserIsActive } from './render.js';
import { applyShot } from './shots.js';
import { mulberry32 } from './random.js';
import { gradeForScore } from './config.js';
import { playLootDing, playAlarmBip, playCaughtSting, playDraftPick, playEscapeFanfare, unlockAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const input = createInput(canvas);

export const state = {
  screen: 'title',
  levelIndex: 4,
  level: buildLevel(4),
  player: createPlayer(640, 540),
  alarm: createAlarm(),
  tools: createToolState(),
  draft: [],
  stats: freshStats(),
  time: 0,
  shot: null,
  frozen: false,
  input,
};

function freshStats() {
  return {
    stageTime: 0,
    totalTime: 0,
    totalLoot: 0,
    spottedCount: 0,
    stageSpotted: 0,
    toolsUsed: 0,
    cleanCostPaid: 0,
    stageRows: [],
    score: 0,
    grade: 'D',
  };
}

export function startRun() {
  state.stats = freshStats();
  state.tools = createToolState();
  state.levelIndex = 0;
  loadLevel(0);
  state.screen = 'play';
}

export function loadLevel(index) {
  state.levelIndex = index;
  state.level = buildLevel(index);
  state.player = createPlayer(state.level.start.x, state.level.start.y);
  state.alarm = createAlarm();
  state.stats.stageTime = 0;
  state.stats.stageSpotted = 0;
}

function finishStage() {
  const level = state.level;
  const loot = levelLootTaken(level);
  state.stats.totalLoot += loot;
  state.stats.totalTime += state.stats.stageTime;
  state.stats.stageRows.push({
    name: level.name,
    loot,
    time: Math.round(state.stats.stageTime),
    spotted: state.stats.stageSpotted,
  });
  playEscapeFanfare();
  if (state.levelIndex >= 4) {
    finishRun();
    return;
  }
  const rng = mulberry32(1000 + state.levelIndex * 77 + state.stats.totalLoot);
  state.draft = draftThree(rng, state.tools.owned);
  state.screen = state.draft.length ? 'draft' : 'play';
  if (!state.draft.length) loadLevel(state.levelIndex + 1);
}

function finishRun() {
  const s = state.stats;
  let score = 100;
  score -= Math.max(0, (s.totalTime - 420) / 12);
  score -= s.spottedCount * 8;
  score -= s.cleanCostPaid * 0.5;
  if (s.spottedCount === 0) score += 25;
  s.score = Math.max(0, Math.min(100, Math.round(score)));
  s.grade = gradeForScore(s.score);
  state.screen = 'end';
}

function retryStage() {
  loadLevel(state.levelIndex);
  state.screen = 'play';
}

function pickDraft(index) {
  const tool = state.draft[index];
  if (!tool) return;
  state.tools.owned.push(tool.id);
  state.stats.cleanCostPaid += tool.cleanCost;
  playDraftPick();
  loadLevel(state.levelIndex + 1);
  state.screen = 'play';
}

function updatePlay(dt) {
  const level = state.level;
  const player = state.player;
  const solids = [...level.walls, ...level.cover];
  movePlayer(player, input.keys, dt, solids);
  state.stats.stageTime += dt;

  // Guards: chase while alerted, patrol otherwise; spinners rotate.
  for (const guard of level.guards) {
    if (guard.alerted) updateGuardChase(guard, dt, player);
    else updateGuard(guard, dt, state.time);
  }
  for (const cam of level.cameras) updateCamera(cam, state.time);
  clearExpiredDecoy(state.tools, level, state.time);

  // Who sees the thief?
  const blockers = solids;
  const ghost = smokeActive(state.tools, state.time);
  let seenGuard = false;
  let seenCamera = false;
  if (!ghost) {
    for (const guard of level.guards) {
      const sees = guardSeesPlayer(guard, player, blockers);
      guard.alerted = sees;
      if (sees) seenGuard = true;
    }
    for (const cam of level.cameras) {
      if (cameraSeesPlayer(cam, player, blockers, state.time)) seenCamera = true;
    }
  } else {
    for (const guard of level.guards) guard.alerted = false;
  }
  let inLaser = false;
  for (const gate of level.laserGates) {
    if (!laserIsActive(gate, state.time)) continue;
    if (player.x >= gate.x - 14 && player.x <= gate.x + gate.w + 14 && player.y >= gate.y && player.y <= gate.y + gate.h) {
      inLaser = true;
    }
  }
  const wasSpotted = state.alarm.spotted;
  updateAlarm(state.alarm, dt, {
    guard: seenGuard,
    camera: seenCamera,
    laser: inLaser,
    halfRate: hasTool(state.tools, 'boots'),
  });
  if (level.noisy && player.sprinting && player.moving) {
    state.alarm.value = Math.min(ALARM_CAUGHT_AT, state.alarm.value + 6 * dt);
    if (state.alarm.value >= ALARM_CAUGHT_AT) state.alarm.caught = true;
  }
  if (state.alarm.spotted && !wasSpotted) {
    state.stats.spottedCount += 1;
    state.stats.stageSpotted += 1;
    playAlarmBip();
  }
  if (seenGuard || seenCamera) {
    if (Math.floor(state.time * 2) !== Math.floor((state.time - dt) * 2)) playAlarmBip();
  }

  const taken = updateLootPickup(player, level, dt, hasTool(state.tools, 'fingers'));
  if (taken) playLootDing();

  if (state.alarm.caught) {
    if (hasTool(state.tools, 'secondChance') && !state.tools.secondChanceUsed) {
      state.tools.secondChanceUsed = true;
      state.alarm.caught = false;
      state.alarm.value = 50;
      state.alarm.spotted = false;
      for (const guard of level.guards) guard.alerted = false;
      return;
    }
    playCaughtSting();
    state.screen = 'caught';
    return;
  }

  if (allLootTaken(level) && playerOnExit(player, level)) {
    finishStage();
  }
}

function handleInput() {
  const pressed = consumePressed(input);
  const click = consumeClick(input);
  if (state.screen === 'title') {
    if (pressed.enter || click) {
      unlockAudio();
      startRun();
    }
    return;
  }
  if (state.screen === 'caught') {
    if (pressed.r) retryStage();
    return;
  }
  if (state.screen === 'end') {
    if (pressed.r) startRun();
    return;
  }
  if (state.screen === 'draft') {
    if (pressed.digit1) pickDraft(0);
    else if (pressed.digit2) pickDraft(1);
    else if (pressed.digit3) pickDraft(2);
    else if (click) {
      const cardW = 340;
      const gap = 30;
      const totalW = cardW * 3 + gap * 2;
      const startX = (VIEW_W - totalW) / 2;
      for (let i = 0; i < 3; i += 1) {
        const x = startX + i * (cardW + gap);
        if (click.x >= x && click.x <= x + cardW && click.y >= 230 && click.y <= 530) pickDraft(i);
      }
    }
    return;
  }
  // play screen
  if (pressed.digit1 || pressed.digit2 || pressed.digit3) {
    const idx = pressed.digit1 ? 0 : pressed.digit2 ? 1 : 2;
    const id = state.tools.owned[idx];
    if (id && (id === 'smoke' || id === 'emp')) {
      if (useTool(state.tools, id, state.time, null, state.level)) state.stats.toolsUsed += 1;
    }
  }
  if (click && hasTool(state.tools, 'decoy')) {
    if (useTool(state.tools, 'decoy', state.time, click, state.level)) state.stats.toolsUsed += 1;
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  handleInput();
  if (!state.frozen) {
    state.time += dt;
    if (state.screen === 'play') updatePlay(dt);
    else if (state.screen === 'title') {
      // The title room stays alive behind the poster.
      for (const guard of state.level.guards) updateGuard(guard, dt, state.time);
      for (const cam of state.level.cameras) updateCamera(cam, state.time);
    }
  }
  drawGame(ctx, state);
  if (state.shot && !document.body.dataset.shotReady) {
    document.body.dataset.shotReady = '1';
  }
  requestAnimationFrame(frame);
}

function runSelfTest() {
  const results = [];
  function check(name, ok) {
    results.push(`${name}:${ok ? 'PASS' : 'FAIL'}`);
  }
  try {
    const l0 = buildLevel(0);
    check('level0-loot-3', l0.loot.length === 3);
    check('level5-loot-5', buildLevel(4).loot.length === 5);
    check('level5-lasers-2', buildLevel(4).laserGates.length === 2);
    const g = l0.guards[0];
    const pFront = { x: g.x, y: g.y + 100 };
    const pBehind = { x: g.x, y: g.y - 100 };
    check('vision-front', guardSeesPlayer({ ...g, angle: Math.PI / 2 }, pFront, l0.walls) === true);
    check('vision-behind', guardSeesPlayer({ ...g, angle: Math.PI / 2 }, pBehind, l0.walls) === false);
    const alarm = createAlarm();
    updateAlarm(alarm, 1, { guard: true, camera: false, laser: false, halfRate: false });
    check('alarm-rises', alarm.value > 40 && alarm.value < 50);
    updateAlarm(alarm, 10, { guard: false, camera: false, laser: false, halfRate: false });
    check('alarm-falls', alarm.value === 0);
    const rng = mulberry32(42);
    const draft = draftThree(rng, []);
    check('draft-3-distinct', draft.length === 3 && new Set(draft.map((d) => d.id)).size === 3);
    check('grade-S', gradeForScore(95) === 'S');
    check('grade-D', gradeForScore(10) === 'D');
    const tools = createToolState();
    tools.owned.push('fingers');
    const pl = createPlayer(l0.loot[0].x, l0.loot[0].y);
    const got = updateLootPickup(pl, l0, 0.01, hasTool(tools, 'fingers'));
    check('loot-instant-fingers', !!got && got.value === 120);
    check('laser-toggles', laserIsActive({ x: 0, y: 0, w: 10, h: 10, period: 4, phase: 0 }, 0.5) !== laserIsActive({ x: 0, y: 0, w: 10, h: 10, period: 4, phase: 0 }, 2.5));
  } catch (e) {
    results.push(`exception:${e.message}`);
  }
  const passed = results.every((r) => r.endsWith('PASS'));
  const text = `VAULTBREAK TEST ${passed ? 'PASS' : 'FAIL'} — ${results.join(' ')}`;
  document.title = text;
  const div = document.getElementById('test');
  if (div) div.textContent = text;
  return passed;
}

const params = new URLSearchParams(window.location.search);
if (params.get('test') === '1') {
  runSelfTest();
}
const shot = params.get('shot');
if (shot) applyShot(state, shot);
window.__vaultbreak = state;
requestAnimationFrame(frame);
