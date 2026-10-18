# Kalinga Rush

A one-button browser runner through ~3,500 years of Kalinga / Odisha history — from boat-builders on the
Chilika shore (c. 1500 BCE) to 2026, and then on into an imagined future. Taapoi rides whatever Odisha moved
on in each age and catches palm-leaf records that become lessons in a picture-book textbook, *Ama Kalinga*.

**The whole reader is playable:** 37 history records in six acts, the fake ending (THE END · ସମାପ୍ତ → the print
glitches → *Supplementary Reader: ଭବିଷ୍ୟତ*), eight speculative future records in Act VII, the finale and
**Endless Kalinga**. Each record has its own procedural painted scene with story vignettes, its own ride for
Taapoi, era hazards and mechanics (hold-jump, heavy cargo, moving obstacles, darkness, flight, wind, cyclone
shelters, Odia-letter platforms, night, gravity flip, rhythm gates), a lesson card and procedural music.

**Journey and checkpoints:** catching a record stamps its lesson and sets a checkpoint (every record in Acts
I–VI, every two in Act VII, none inside F8; the cyclone shelters in Record 33 are mid-record checkpoints).
Diyas carry across records; losing all of them offers *try again from the checkpoint*, *the start of this act*
or *the very beginning*. At the end of each act you choose to **continue from that checkpoint** or **start
again from the very beginning**; the title screen offers *Continue*, *Start from the very beginning* and
*Chapters* (any act you've reached).

**Difficulty:** jumps are forgiving early and tighten record by record — hazard hitboxes grow from ×0.62
(Record 01) to ×1.0 (Record 37), Taapoi's own hitbox from ×0.82 to ×1.0, and the jump buffer from 160 ms to
120 ms — while speed rises from 280 px/s to ≈2.8× by Act VII. Records are ~44 s (30% longer than the brief's
~34 s).

## Run it

```bash
npm install
npm run dev          # http://127.0.0.1:5173
npm run build        # typecheck + production build into dist/
npm run preview      # serve dist/
```

Controls: **Space / ↑ / W / click / tap** to jump; hold for a higher jump (max 220 ms). Tap anywhere on a phone.

## Checks

```bash
npm run check        # typecheck + colour-literal lint + unit tests
npm run lint:colours # fails on any colour literal outside src/data/palettes.ts
npm test             # physics, forgiveness curve, all 45 records solvable, palette + WCAG AA contrast
npm run bot          # solvability bot: every record × 3 seeds × normal/Assist speed (CI fails if impossible)
npm run difficulty   # human-ish bot (±80 ms timing) → docs/difficulty-report.md
npm run build && npm run qa:colour   # Playwright colour QA of all 45 records → docs/colour-report.md
npx tsx tools/gen-history.ts         # regenerate HISTORY.md's lesson list from records.ts
npx tsx tools/gen-assets.ts          # regenerate ASSETS.md's per-record prompts
npx tsx tools/shot-scene.ts out r05:0.1,0.5   # screenshot a scene via the dev preview page
```

`qa:colour` needs a Chromium. It uses `CHROMIUM_PATH` if set, then `/opt/pw-browsers`, then Playwright's own
browsers (`npx playwright@1.64.1 install chromium`).

## Debug URL params

| Param | Effect |
|---|---|
| `?palette=1` | palette debug page: frame colours, scene palette, chapter palettes, contrast pairs |
| `?record=14` | jump straight into a record (1–45) |
| `?act=7` | start at the first record of an act |
| `?twist=1` | start at the fake ending |
| `?reel=1` | reel mode: 1080×1920 portrait layout, autopilot, ~6 s of each record (`&intro=1` adds the hook lines) |
| `?seed=123` | level and painting seed |
| `?god=1` | no damage |
| `?assist=1` | Assist Mode (0.75× speed, 5 diyas) |
| `?auto=1` | autopilot replays the solvability bot's frame-perfect plan |
| `?at=12` | fast-forward the run 12 s |
| `?qa=1` | freeze after fast-forward and set `window.__KR_READY__` (used by the QA tool) |

## How it's built

- **Vite + TypeScript (strict) + Phaser 4.2.1.** Static build, no backend. `base: './'`, so `dist/` works from any
  sub-path (GitHub Pages, Netlify, Vercel).
- **Physics are pure TS** (`src/systems/physics.ts`, `sim.ts`), stepped at a fixed 120 Hz. The game, the unit
  tests and the solvability bot (`src/systems/solver.ts`) run the same code, which is why the runner doesn't use
  Arcade bodies.
- **Colour:** every colour lives in `src/data/palettes.ts`. CSS gets them as custom properties injected at build
  time; canvas painters and Phaser read them directly. `npm run lint:colours` enforces it.
- **Art:** procedural painterly layers. Record 01 has a hand-built painter (`src/art/records/r01.ts`); the other 44
  are `SceneDef`s (`src/art/scenes/act*.ts`) composed by the scene engine (`src/art/engine.ts`) from a shared kit
  of people, animals, buildings and craft (`src/art/kit/`). Each record is baked lazily into textures when you
  reach it and released afterwards, so phones keep their memory. Painted art drops into
  `public/art/<record>/<layer>.webp` — see `ASSETS.md`.
- **Audio:** original procedural Web Audio (`src/audio/`): mardala strokes, gini, bansuri, harmonium drone,
  temple bells, the conch, and synth arpeggios in Act VII; tempo rises ~84 → 132 BPM. Muted until first input.
- **Fonts:** Inter Tight and Baloo Bhaina 2 (with its Odia subset), self-hosted via `@fontsource`, so the game
  works offline.
- **Storage:** `localStorage`, every access wrapped; the game runs without it.

```
src/
  main.ts            entry: layout, input, fonts, Phaser game
  config.ts          logical 1280×720, speeds, lives
  data/              palettes.ts, records.ts, chunks.ts, vehicles.ts
  lib/               colour maths, seeded RNG + periodic noise
  art/               brush, engine, kit, scenes/act*.ts, sprites (rides, hazards, fx), bake, stage
  audio/             synth.ts (instruments), patterns.ts (talas, scales, tempi), index.ts (director)
  systems/           physics, sim, spawner, solver, difficulty, journey, input, save, debug
  scenes/            Boot, Title, Run, TitleCard, FakeEnding, Finale (+ parts: player, entities, weather, fx)
  ui/                layout, header, HUD, cards, pages (act complete, game over, settings, lesson book, report)
tools/               colour lint, colour QA, solvability bot, difficulty report, HISTORY/ASSETS generators, scene shots
tests/               physics + solvability, palette + contrast, HISTORY.md ↔ card text
docs/                colour-report.md, difficulty-report.md, qa/ screenshots
```

## Deploy

`npm run build` produces a static `dist/`.

- **GitHub Pages:** publish `dist/` (e.g. with `actions/upload-pages-artifact` + `actions/deploy-pages`).
- **Netlify:** build command `npm run build`, publish directory `kalinga-rush/dist`, base directory `kalinga-rush`.
- **Vercel:** framework "Vite", root directory `kalinga-rush`, output `dist`.

Set `VITE_PLAY_URL=your.domain/path` at build time to print "Play at …" on the title screen (otherwise the
current host is used, and the line is hidden on localhost).

## Credits & respect

Format inspired by *Madras Rush* (madras.v40.in/rush by @ivinay); no code, images, audio or text are copied.
History notes and sources: `HISTORY.md`. Odia strings awaiting a native reader: `STRINGS_TO_VERIFY.md`.
