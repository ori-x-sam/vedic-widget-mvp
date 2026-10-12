# Jyotsna Mahal

*Seven nights to the full moon.* A first-person, campy mystery-horror game for the desktop browser, in Three.js:
autumn 1946, Inspector Thistlewood of the Calcutta Police poses as a photographer in a moonlit Odia palace and has
seven nights to prove the Raja's half-brother was murdered. What the game should be is in [`docs/brief.md`](docs/brief.md).

This is the **demo**: Day 1 (The Drive In) and Night 1 (The Bolted Door), built on the whole game's foundation.

Built on the game-bible: TypeScript, Three for the world, Pixi for the screens, KDL for what things are
(`content/*.kdl`), a CSS dialect for how they look (`src/screens/*.css`), Blender scripts for every model
(`models/*.py`), and Storybook as the place where you and the agent look at the same thing. Every word the game
knows is in the catalog, [`docs/declarative-ui.md`](docs/declarative-ui.md).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | the game, live, with hot reload of screens' KDL and CSS |
| `npm run storybook` | every room, puzzle state, conversation, screen and model at http://localhost:6006 |
| `npm test` | unit tests: the rules, the solver, content integrity, screens, guards, models, catalog drift |
| `npm run test:stories` | every story's play, in headless Chromium, through real input |
| `npm run typecheck` | `tsc` |
| `npm run build` | typecheck and build to `dist/` |
| `npm run sim` | the solver: plays every night after every way its day can end, and reports |
| `npm run models [-- name]` | rebuild `models/<name>.py` to `.glb` with headless Blender (`BLENDER` overrides the binary) |

Story tests and screenshots use Playwright's Chromium; set `CHROMIUM=/path/to/chromium` to use another.

## Where your hands go

| To change | Open |
|---|---|
| A room, a puzzle, a clue, a line of dialogue, a morning | `content/*.kdl` (one file per day and per night) |
| The moon's colour, the lamps, the haze, exposure, every hue | the `:root` tokens in `src/screens/shared.css` (`--look-*` for the render) |
| How suspicion rises and falls, the length of a night, Bhima's eyes | `src/tuning.ts` |
| A sound | `content/sounds.kdl` |
| A model's colours | `content/models.kdl`; its shape, `models/<name>.py` |
| What a word means (`look`, `code`, `patrol`…) | the catalog, `docs/declarative-ui.md` |
| What the game should be | `docs/brief.md` |
| To see any of it | `npm run storybook` |

`reference/` (the source story) is ignored by git: it is someone else's book.
