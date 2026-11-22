// tools.js — the 1-of-3 draft between stages. One job: define the six tools,
// pick three for a draft, and apply their effects. Every tool has a written
// cost: choosing it eats part of the Clean Run bonus, so tools are never free.

import { SMOKE_SECONDS, EMP_SECONDS, DECOY_SECONDS } from './config.js';
import { shuffleSeeded } from './random.js';

export const TOOL_DEFS = {
  smoke: {
    id: 'smoke',
    name: 'Smoke Pellet',
    key: '1',
    blurb: 'Vanish from every cone for 3 s. Pop it and walk straight through.',
    cost: 'COST: −10% Clean Run bonus',
    cleanCost: 10,
    kind: 'active',
  },
  decoy: {
    id: 'decoy',
    name: 'Decoy Coin',
    key: '2',
    blurb: 'Click anywhere to toss a coin. The nearest guard walks over to look.',
    cost: 'COST: −10% Clean Run bonus',
    cleanCost: 10,
    kind: 'active',
  },
  emp: {
    id: 'emp',
    name: 'EMP Pulse',
    key: '3',
    blurb: 'All cameras go dark for 6 s. Guards still see you — plan around them.',
    cost: 'COST: −15% Clean Run bonus',
    cleanCost: 15,
    kind: 'active',
  },
  boots: {
    id: 'boots',
    name: 'Soft Boots',
    key: '4',
    blurb: 'Silent steps: the alarm rises half as fast whenever you are seen.',
    cost: 'COST: −15% Clean Run bonus',
    cleanCost: 15,
    kind: 'passive',
  },
  fingers: {
    id: 'fingers',
    name: 'Fast Fingers',
    key: '5',
    blurb: 'Pocket loot instantly — no more standing still on the gold.',
    cost: 'COST: −10% Clean Run bonus',
    cleanCost: 10,
    kind: 'passive',
  },
  secondChance: {
    id: 'secondChance',
    name: 'Second Chance',
    key: '6',
    blurb: 'Get caught once and walk away: the alarm drops to 50% instead.',
    cost: 'COST: −20% Clean Run bonus',
    cleanCost: 20,
    kind: 'passive',
  },
};

export const TOOL_ORDER = ['smoke', 'decoy', 'emp', 'boots', 'fingers', 'secondChance'];

export function draftThree(rng, ownedIds) {
  const pool = TOOL_ORDER.filter((id) => !ownedIds.includes(id));
  const shuffled = shuffleSeeded(rng, pool);
  return shuffled.slice(0, 3).map((id) => TOOL_DEFS[id]);
}

export function createToolState() {
  return {
    owned: [], // tool ids, in draft order
    smokeUntil: 0,
    decoy: null, // {x, y, until}
    activeCounts: { smoke: 0, decoy: 0, emp: 0 },
  };
}

export function hasTool(tools, id) {
  return tools.owned.includes(id);
}

export function useTool(tools, id, time, clickPos, level) {
  if (!hasTool(tools, id)) return false;
  if (id === 'smoke') {
    tools.smokeUntil = time + SMOKE_SECONDS;
    tools.activeCounts.smoke += 1;
    return true;
  }
  if (id === 'emp') {
    for (const cam of level.cameras) cam.disabledUntil = time + EMP_SECONDS;
    tools.activeCounts.emp += 1;
    return true;
  }
  if (id === 'decoy') {
    if (!clickPos) return false;
    tools.decoy = { x: clickPos.x, y: clickPos.y, until: time + DECOY_SECONDS };
    tools.activeCounts.decoy += 1;
    // The nearest guard abandons its patrol to investigate the coin.
    let best = null;
    let bestDist = Infinity;
    for (const guard of level.guards) {
      const d = Math.hypot(guard.x - clickPos.x, guard.y - clickPos.y);
      if (d < bestDist) {
        bestDist = d;
        best = guard;
      }
    }
    if (best) best.distracted = { x: clickPos.x, y: clickPos.y };
    return true;
  }
  return false;
}

export function smokeActive(tools, time) {
  return time < tools.smokeUntil;
}

export function clearExpiredDecoy(tools, level, time) {
  if (tools.decoy && time >= tools.decoy.until) {
    tools.decoy = null;
    for (const guard of level.guards) guard.distracted = null;
  }
}
