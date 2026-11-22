// render.js — every pixel of VAULTBREAK. One job: draw the room, the people
// in it, the HUD, and the title / draft / caught / getaway screens on one
// canvas. Colour code, readable at a glance: dark cover = safe, yellow-red
// cones = danger, gold = loot, green = the way out.

import { VIEW_W, VIEW_H, HUD_H, GUARD_CONE_RANGE, CAMERA_CONE_RANGE } from './config.js';
import { conePolygon } from './vision.js';
import { alarmColor, alarmLabel } from './alarm.js';
import { mulberry32 } from './random.js';
import { levelLootTotal, levelLootTaken, allLootTaken } from './levels.js';
import { smokeActive } from './tools.js';

const FLOOR_BASE = {
  tile: '#3a3f4a',
  marble: '#4a4a52',
  parquet: '#4d3a26',
  carpet: '#4a1f24',
  steel: '#2e3440',
};

function drawFloor(ctx, level) {
  const rng = mulberry32(level.index * 1000 + 7);
  ctx.fillStyle = FLOOR_BASE[level.floor];
  ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
  if (level.floor === 'tile') {
    for (let y = HUD_H; y < VIEW_H; y += 64) {
      for (let x = 0; x < VIEW_W; x += 64) {
        if (((x + y) / 64) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.fillRect(x, y, 64, 64);
        }
      }
    }
  } else if (level.floor === 'marble') {
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 9; i += 1) {
      ctx.beginPath();
      let x = rng() * VIEW_W;
      let y = HUD_H + rng() * 200;
      ctx.moveTo(x, y);
      for (let s = 0; s < 5; s += 1) {
        x += (rng() - 0.5) * 320;
        y += rng() * 120;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    for (let x = 0; x < VIEW_W; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, HUD_H);
      ctx.lineTo(x, VIEW_H);
      ctx.stroke();
    }
  } else if (level.floor === 'parquet') {
    for (let y = HUD_H; y < VIEW_H; y += 32) {
      for (let x = 0; x < VIEW_W; x += 96) {
        ctx.fillStyle = ((x / 96 + y / 32) % 2 === 0) ? 'rgba(255,220,150,0.07)' : 'rgba(0,0,0,0.10)';
        ctx.fillRect(x, y, 96, 32);
      }
    }
  } else if (level.floor === 'carpet') {
    ctx.fillStyle = 'rgba(255,200,90,0.06)';
    for (let i = 0; i < 26; i += 1) {
      ctx.beginPath();
      ctx.arc(rng() * VIEW_W, HUD_H + rng() * (VIEW_H - HUD_H), 14 + rng() * 22, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,200,90,0.10)';
    ctx.lineWidth = 3;
    ctx.strokeRect(48, HUD_H + 32, VIEW_W - 96, VIEW_H - HUD_H - 64);
  } else {
    // steel: riveted plates
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    for (let x = 0; x < VIEW_W; x += 160) {
      ctx.beginPath(); ctx.moveTo(x, HUD_H); ctx.lineTo(x, VIEW_H); ctx.stroke();
    }
    for (let y = HUD_H; y < VIEW_H; y += 160) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW_W, y); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,215,0,0.05)';
    ctx.fillRect(560, 340, 160, 160);
  }
}

function drawWallsAndCover(ctx, level) {
  ctx.fillStyle = '#171a21';
  for (const w of level.walls) ctx.fillRect(w.x, w.y, w.w, w.h);
  ctx.fillStyle = '#232833';
  for (const c of level.cover) {
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#4a5468';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
  }
  // The vault core in the final room gets a gold rim.
  if (level.index === 4) {
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(580, 360, 120, 120);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AURORA CORE', 640, 352);
  }
}

function drawLaserGates(ctx, level, time) {
  for (const g of level.laserGates) {
    const active = Math.floor((time + g.phase) / (g.period / 2)) % 2 === 0;
    ctx.strokeStyle = active ? '#ff2e4d' : 'rgba(255,46,77,0.25)';
    ctx.lineWidth = active ? 4 : 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x, g.y + g.h);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = active ? '#ff2e4d' : 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(active ? 'LASER ON' : 'laser off', g.x, g.y - 8);
  }
}

export function laserIsActive(gate, time) {
  return Math.floor((time + gate.phase) / (gate.period / 2)) % 2 === 0;
}

function drawLoot(ctx, level, time) {
  for (const loot of level.loot) {
    if (loot.taken) {
      ctx.strokeStyle = 'rgba(255,215,0,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(loot.x, loot.y, 12, 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }
    const pulse = 0.55 + 0.25 * Math.sin(time * 3 + loot.x);
    ctx.fillStyle = `rgba(255,215,0,${pulse * 0.25})`;
    ctx.beginPath();
    ctx.arc(loot.x, loot.y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(loot.x, loot.y - 13);
    ctx.lineTo(loot.x + 11, loot.y);
    ctx.lineTo(loot.x, loot.y + 13);
    ctx.lineTo(loot.x - 11, loot.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#7a5b00';
    ctx.beginPath();
    ctx.arc(loot.x, loot.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe98a';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`$${loot.value.toLocaleString('en-US')}`, loot.x, loot.y - 20);
    if (loot.progress > 0 && loot.progress < 1) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(loot.x, loot.y, 20, -Math.PI / 2, -Math.PI / 2 + loot.progress * Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawExit(ctx, level) {
  const open = allLootTaken(level);
  ctx.fillStyle = open ? '#19c37d' : '#2f6b4a';
  ctx.fillRect(level.exit.x, level.exit.y, level.exit.w, level.exit.h);
  ctx.strokeStyle = open ? '#a7f3d0' : '#5b8a72';
  ctx.lineWidth = 3;
  ctx.strokeRect(level.exit.x, level.exit.y, level.exit.w, level.exit.h);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT — GO!' : 'EXIT · LOCKED', level.exit.x + level.exit.w / 2, level.exit.y + 19);
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(open ? 'getaway is open' : 'take all loot first', level.exit.x + level.exit.w / 2, level.exit.y + 35);
}

function drawCones(ctx, level, state) {
  for (const guard of level.guards) {
    const watcher = { x: guard.x, y: guard.y, angle: guard.angle, range: GUARD_CONE_RANGE, halfAngle: 0.56 };
    const pts = conePolygon(watcher);
    ctx.fillStyle = guard.alerted ? 'rgba(255,60,60,0.34)' : 'rgba(255,200,40,0.20)';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();
  }
  for (const cam of level.cameras) {
    const disabled = state.time < cam.disabledUntil;
    if (disabled) continue;
    const watcher = { x: cam.x, y: cam.y, angle: cam.angle, range: CAMERA_CONE_RANGE, halfAngle: 0.42 };
    const pts = conePolygon(watcher);
    ctx.fillStyle = 'rgba(120,200,255,0.16)';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawGuardsAndCameras(ctx, level, state) {
  for (const cam of level.cameras) {
    const disabled = state.time < cam.disabledUntil;
    ctx.fillStyle = disabled ? '#3a3f4a' : '#8fb8d8';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b0e13';
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(cam.angle) * 5, cam.y + Math.sin(cam.angle) * 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = disabled ? '#9aa3b2' : '#cfe8ff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(disabled ? 'CAM OFF' : 'CAM', cam.x, cam.y - 18);
  }
  for (const guard of level.guards) {
    ctx.fillStyle = guard.alerted ? '#c22' : '#2b3a55';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#dbe4f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 15, 0, Math.PI * 2);
    ctx.stroke();
    // Facing tick + torch dot.
    ctx.strokeStyle = '#ffd76a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.angle) * 22, guard.y + Math.sin(guard.angle) * 22);
    ctx.stroke();
    if (guard.alerted) {
      ctx.fillStyle = '#ff4d4d';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 22);
    }
    if (guard.distracted) {
      ctx.fillStyle = '#ffe98a';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.x, guard.y - 22);
    }
  }
  if (state.tools.decoy) {
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(state.tools.decoy.x, state.tools.decoy.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe98a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DECOY', state.tools.decoy.x, state.tools.decoy.y - 12);
  }
}

function drawPlayer(ctx, player, state) {
  const ghost = smokeActive(state.tools, state.time);
  ctx.globalAlpha = ghost ? 0.45 : 1;
  ctx.fillStyle = '#11141a';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ghost ? '#9be8ff' : '#ffd700';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.stroke();
  // Gold mask stripe: the thief.
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(player.x - 8, player.y - 3, 16, 6);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('THIEF', player.x, player.y - 20);
}

function drawHUD(ctx, state) {
  const { level, alarm, stats } = state;
  ctx.fillStyle = '#0b0e13';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('VAULTBREAK', 18, 32);
  ctx.fillStyle = '#c8d0dc';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`STAGE ${level.index + 1}/5 — ${level.name}`, 18, 52);
  ctx.fillStyle = '#8b93a3';
  ctx.font = '12px sans-serif';
  ctx.fillText(level.modifier, 18, 68);

  // Alarm bar — big, always visible.
  const barX = 470;
  const barW = 330;
  ctx.fillStyle = '#22262e';
  ctx.fillRect(barX, 14, barW, 26);
  ctx.fillStyle = alarmColor(alarm.value);
  ctx.fillRect(barX, 14, barW * (alarm.value / 100), 26);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(barX, 14, barW, 26);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ALARM ${Math.round(alarm.value)}% — ${alarmLabel(alarm.value)}`, barX + barW / 2, 33);
  if (alarm.spotted && Math.floor(state.time * 3) % 2 === 0) {
    ctx.fillStyle = '#ff4d4d';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('SPOTTED!', barX + barW / 2, 62);
  }

  // Loot + timer + tools, right side.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`LOOT $${levelLootTaken(level).toLocaleString('en-US')} / $${levelLootTotal(level).toLocaleString('en-US')}`, 1252, 30);
  ctx.fillStyle = '#c8d0dc';
  ctx.font = 'bold 15px sans-serif';
  const t = Math.floor(stats.stageTime);
  ctx.fillText(`TIME ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}   ·   TOTAL $${stats.totalLoot.toLocaleString('en-US')}`, 1252, 56);
  // Tool chips.
  ctx.textAlign = 'left';
  let chipX = 830;
  for (const id of state.tools.owned) {
    ctx.fillStyle = '#1d2733';
    ctx.fillRect(chipX, 46, 30, 20);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    ctx.strokeRect(chipX, 46, 30, 20);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(id === 'secondChance' ? '2nd' : id.slice(0, 2).toUpperCase(), chipX + 15, 60);
    chipX += 34;
  }
  ctx.textAlign = 'left';
}

function drawHintBar(ctx, text) {
  ctx.fillStyle = 'rgba(11,14,19,0.85)';
  ctx.fillRect(0, VIEW_H - 26, VIEW_W, 26);
  ctx.fillStyle = '#c8d0dc';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, VIEW_W / 2, VIEW_H - 8);
}

function drawTitleOverlay(ctx, state) {
  ctx.fillStyle = 'rgba(8,10,16,0.72)';
  ctx.fillRect(0, HUD_H, VIEW_W, 300);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 84px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VAULTBREAK', VIEW_W / 2, HUD_H + 108);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('Read the cones. Grab the loot. Vanish.', VIEW_W / 2, HUD_H + 152);
  ctx.fillStyle = '#c8d0dc';
  ctx.font = '18px sans-serif';
  ctx.fillText('A stealth heist in 5 rooms — from a corner store to The Aurora Vault.', VIEW_W / 2, HUD_H + 186);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Press ENTER or click to start the job', VIEW_W / 2, HUD_H + 226);
  ctx.fillStyle = '#8b93a3';
  ctx.font = '15px sans-serif';
  ctx.fillText('WASD / arrows — move    ·    Shift — sprint (noisy)    ·    1–3 — use tool    ·    Click — throw decoy coin', VIEW_W / 2, HUD_H + 262);
  drawHintBar(ctx, 'Guard cones are yellow — red when they see you. Cameras sweep blue. Gold is loot. Green is the getaway.');
}

function drawDraftScreen(ctx, state) {
  ctx.fillStyle = 'rgba(8,10,16,0.88)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BETWEEN JOBS — PICK ONE TOOL', VIEW_W / 2, 110);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px sans-serif';
  ctx.fillText(`Stage ${state.level.index + 1} cleared: ${state.level.name}  ·  Loot banked $${state.stats.totalLoot.toLocaleString('en-US')}`, VIEW_W / 2, 148);
  ctx.fillStyle = '#ffb02e';
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText('Every tool costs part of your Clean Run bonus — tools are never free. The two you skip are gone.', VIEW_W / 2, 178);
  const cardW = 340;
  const cardH = 300;
  const gap = 30;
  const totalW = cardW * 3 + gap * 2;
  const startX = (VIEW_W - totalW) / 2;
  state.draft.forEach((tool, i) => {
    const x = startX + i * (cardW + gap);
    const y = 230;
    const hover = state.input.mouse.x >= x && state.input.mouse.x <= x + cardW && state.input.mouse.y >= y && state.input.mouse.y <= y + cardH;
    ctx.fillStyle = hover ? '#2a3442' : '#161c26';
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = hover ? '#ffd700' : '#4a5468';
    ctx.lineWidth = hover ? 4 : 2;
    ctx.strokeRect(x, y, cardW, cardH);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tool.name, x + cardW / 2, y + 52);
    ctx.fillStyle = '#ffffff';
    ctx.font = '17px sans-serif';
    wrapText(ctx, tool.blurb, x + cardW / 2, y + 96, cardW - 40, 24);
    ctx.fillStyle = '#ff8a5c';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText(tool.cost, x + cardW / 2, y + 210);
    ctx.fillStyle = '#8b93a3';
    ctx.font = '15px sans-serif';
    ctx.fillText(tool.kind === 'active' ? 'ACTIVE — press its key in a room' : 'PASSIVE — always on', x + cardW / 2, y + 244);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Press ${i + 1} or click`, x + cardW / 2, y + 278);
  });
  drawHintBar(ctx, 'Choose 1 of 3 — the others disappear. Your next room is already waiting.');
}

function wrapText(ctx, text, cx, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, yy);
      line = w;
      yy += lineH;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, cx, yy);
}

function drawCaughtScreen(ctx, state) {
  ctx.fillStyle = 'rgba(60,0,0,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#ff4d4d';
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CAUGHT!', VIEW_W / 2, 300);
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px sans-serif';
  ctx.fillText(`The alarm hit 100% in ${state.level.name}. The crew melts away — but the vaults stay open.`, VIEW_W / 2, 350);
  ctx.fillStyle = '#c8d0dc';
  ctx.font = '19px sans-serif';
  ctx.fillText(`Loot kept so far: $${state.stats.totalLoot.toLocaleString('en-US')}  ·  Times spotted: ${state.stats.spottedCount}`, VIEW_W / 2, 392);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('Press R to retry this room — the alarm resets, the loot stays where it was.', VIEW_W / 2, 452);
}

function drawEndScreen(ctx, state) {
  const s = state.stats;
  ctx.fillStyle = '#0b0e13';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#19c37d';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GETAWAY — CLEAN OUT OF THE AURORA VAULT', VIEW_W / 2, 84);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 150px sans-serif';
  ctx.fillText(`GRADE ${s.grade}`, VIEW_W / 2, 250);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(`TOTAL LOOT  $${s.totalLoot.toLocaleString('en-US')}   ·   TIME  ${Math.floor(s.totalTime / 60)}:${String(Math.floor(s.totalTime) % 60).padStart(2, '0')}`, VIEW_W / 2, 306);
  // Per-stage breakdown table.
  const rows = s.stageRows;
  const tableX = 240;
  const tableW = VIEW_W - 480;
  ctx.fillStyle = '#161c26';
  ctx.fillRect(tableX, 340, tableW, 44 + rows.length * 36);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ROOM', tableX + 16, 368);
  ctx.fillText('LOOT', tableX + 430, 368);
  ctx.fillText('TIME', tableX + 560, 368);
  ctx.fillText('SPOTTED', tableX + 680, 368);
  rows.forEach((row, i) => {
    const y = 368 + 36 * (i + 1);
    ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#c8d0dc';
    ctx.font = '16px sans-serif';
    ctx.fillText(row.name, tableX + 16, y);
    ctx.fillText(`$${row.loot.toLocaleString('en-US')}`, tableX + 430, y);
    ctx.fillText(`${Math.floor(row.time)}s`, tableX + 560, y);
    ctx.fillText(`${row.spotted}x`, tableX + 680, y);
  });
  ctx.fillStyle = '#c8d0dc';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  const ghostText = s.spottedCount === 0 ? 'GHOST BONUS: never seen once (+25)' : `Seen ${s.spottedCount}x — ghost bonus lost`;
  ctx.fillText(`${ghostText}   ·   Tools used: ${s.toolsUsed}   ·   Clean-run cost paid: ${s.cleanCostPaid}%`, VIEW_W / 2, 340 + 44 + rows.length * 36 + 44);
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Press R to run it again — the cones are waiting.', VIEW_W / 2, 340 + 44 + rows.length * 36 + 84);
}

export function drawGame(ctx, state) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (state.screen === 'draft') {
    drawHUD(ctx, state);
    drawDraftScreen(ctx, state);
    return;
  }
  if (state.screen === 'end') {
    drawEndScreen(ctx, state);
    return;
  }
  drawFloor(ctx, state.level);
  drawCones(ctx, state.level, state);
  drawLaserGates(ctx, state.level, state.time);
  drawWallsAndCover(ctx, state.level);
  drawLoot(ctx, state.level, state.time);
  drawExit(ctx, state.level);
  drawGuardsAndCameras(ctx, state.level, state);
  drawPlayer(ctx, state.player, state);
  drawHUD(ctx, state);
  if (state.screen === 'title') {
    drawTitleOverlay(ctx, state);
  } else if (state.screen === 'caught') {
    drawCaughtScreen(ctx, state);
  } else if (state.screen === 'play') {
    const hint = state.level.index === 0
      ? 'WASD move · Shift sprint · stand on gold to pocket it · reach the green EXIT when all loot is taken'
      : 'WASD move · Shift sprint (noisy!) · 1–3 use a tool · click to throw a decoy coin · hide behind dark cover';
    drawHintBar(ctx, hint);
  }
}
