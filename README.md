# VAULTBREAK — a stealth heist in five rooms

![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)
![rank](https://make.fun/badge/best-heist-game-20261122-0559/Gobpox/vaultbreak/rank.svg)
![reward](https://make.fun/badge/best-heist-game-20261122-0559/Gobpox/vaultbreak/reward.svg)

An entry for [make.fun's best heist game](https://make.fun/c/best-heist-game-20261122-0559): a complete, original, top-down stealth heist game that runs offline in a desktop browser from its own files.

## The game

Read the cones. Grab the loot. Vanish. You are the thief crossing five named rooms — a corner store, a night-shift bank, a laser-night museum, a high-roller casino pit, and the boss room, **The Aurora Vault** — past guards with vision cones and sweeping security cameras, with one alarm meter deciding whether you walk out rich or get caught.

- **Everything in one frame:** the thief, guards with vision cones, sweeping cameras, gold loot targets, and a big alarm meter in the HUD — always visible.
- **Several routes per room:** slip behind dark cover, or take the service lane around it. Cones are blocked by walls and furniture, so cover is real.
- **Tools at a cost:** between stages, draft 1 of 3 tools (Smoke Pellet, Decoy Coin, EMP Pulse, Soft Boots, Fast Fingers, Second Chance). Every tool eats part of your Clean Run bonus — the two you skip are gone.
- **Fair caught moment:** the alarm flashes SPOTTED! long before it fills, and only rises while you are truly inside a cone or camera sweep with a clear line of sight.
- **A getaway that pays off:** the final screen grades your run (S/A/B/C/D) with a per-stage breakdown — loot, time, times spotted — plus ghost bonus and tool costs.

## How to play

- **WASD / arrow keys** — move. **Shift** — sprint (fast, but noisy on the museum's parquet).
- **1–3** — use an active tool. **Click** — throw a decoy coin (with Decoy Coin drafted).
- Stand on gold to pocket it; take **all** the loot to unlock the green EXIT, then reach it.
- Hide to let the alarm fall. If it hits 100%, you are caught — press **R** to retry the room.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests, no libraries — plain ES modules on canvas, all art and sound drawn and synthesized in code.

## Layout

- `game/index.html` — the page
- `game/src/main.js` — boot + state machine + game loop
- `game/src/config.js` — tuning (speeds, alarm rates, grades)
- `game/src/levels.js` — the five hand-designed rooms
- `game/src/vision.js` — cone + line-of-sight maths
- `game/src/guards.js` — guard patrols and chases
- `game/src/cameras.js` — camera sweeps
- `game/src/player.js` — thief movement, collision, loot pickup
- `game/src/alarm.js` — the alarm meter
- `game/src/tools.js` — the 1-of-3 draft and tool effects
- `game/src/render.js` — all canvas drawing (room, HUD, screens)
- `game/src/audio.js` — procedural WebAudio sounds
- `game/src/input.js` — keyboard + mouse
- `game/src/random.js` — seeded RNG
- `game/src/shots.js` — deterministic screenshot poses (`?shot=start|play|draft|end`)

## Screenshots

Deterministic renders of the game's own code (`?shot=` poses, 1280×800):

1. `1-start.jpg` — title poster over the living Aurora Vault
2. `2-play.jpg` — mid-stage tension in the museum, alarm at 60%
3. `3-draft.jpg` — the 1-of-3 tool draft between jobs
4. `4-end.jpg` — the getaway grade screen

## License

MIT — see [LICENSE](LICENSE).
