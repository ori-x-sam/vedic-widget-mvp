# Kalinga Rush

A one-button browser runner through ~3,500 years of Kalinga / Odisha history — from boat-builders on the
Chilika shore (c. 1500 BCE) to 2026, and then on into an imagined future. Taapoi rides whatever Odisha moved
on in each age and catches palm-leaf records that become lessons in a picture-book textbook, *Ama Kalinga*.

**Status: Phase 1 — vertical slice.** Record 01 (c. 1500 BCE, Golbai Sasan) is fully playable end to end:
title screen → title-card sting → run (canoe, reeds, mudbanks, fishing stakes, cowries, a dolphin arc) →
palm-leaf record → lesson card → end-of-slice page. The other 44 records follow the build order in the brief.

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
npm test             # physics, solvability (24 seeds of Record 01), palette + WCAG AA contrast
npm run build && npm run qa:colour   # Playwright colour QA → docs/colour-report.md
```

`qa:colour` needs a Chromium. It uses `CHROMIUM_PATH` if set, then `/opt/pw-browsers`, then Playwright's own
browsers (`npx playwright@1.64.1 install chromium`).

## Debug URL params

| Param | Effect |
|---|---|
| `?palette=1` | palette debug page: frame colours, scene palette, chapter palettes, contrast pairs |
| `?record=1` | jump straight into a record (only 1 exists in Phase 1) |
| `?seed=123` | level and painting seed |
| `?god=1` | no damage |
| `?assist=1` | Assist Mode (0.75× speed, 5 diyas) |
| `?auto=1` | autopilot replays the solvability bot's frame-perfect plan |
| `?at=12` | fast-forward the run 12 s |
| `?qa=1` | freeze after fast-forward and set `window.__KR_READY__` (used by the QA tool) |
| `?act=7`, `?twist=1`, `?reel=1` | reserved for later phases |

## How it's built

- **Vite + TypeScript (strict) + Phaser 4.2.1.** Static build, no backend. `base: './'`, so `dist/` works from any
  sub-path (GitHub Pages, Netlify, Vercel).
- **Physics are pure TS** (`src/systems/physics.ts`, `sim.ts`), stepped at a fixed 120 Hz. The game, the unit
  tests and the solvability bot (`src/systems/solver.ts`) run the same code, which is why the runner doesn't use
  Arcade bodies.
- **Colour:** every colour lives in `src/data/palettes.ts`. CSS gets them as custom properties injected at build
  time; canvas painters and Phaser read them directly. `npm run lint:colours` enforces it.
- **Art:** procedural painterly layers (`src/art/brush.ts` + `src/art/records/r01.ts`), baked once per record into
  textures. Painted art drops into `public/art/<record>/<layer>.webp` — see `ASSETS.md`.
- **Fonts:** Inter Tight and Baloo Bhaina 2 (with its Odia subset), self-hosted via `@fontsource`, so the game
  works offline.
- **Storage:** `localStorage`, every access wrapped; the game runs without it.

```
src/
  main.ts            entry: layout, input, fonts, Phaser game
  config.ts          logical 1280×720, speeds, lives
  data/              palettes.ts, records.ts, chunks.ts, vehicles.ts
  lib/               colour maths, seeded RNG + periodic noise
  art/               brush, shared props, record painters, sprites, bake (+ painted-layer loader), stage
  systems/           physics, sim, spawner, solver, difficulty, input, save, debug
  scenes/            Boot, Title, Run, TitleCard (+ parts: player, entities, fx)
  ui/                layout, header (title card), HUD, textbook cards, palette page
tools/               check-colour-literals.ts, colour-qa.ts
tests/               physics + solvability, palette + contrast
docs/                colour-report.md, qa/ screenshots
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
