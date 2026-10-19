# Astras Unleashed

A real-time three-lane card battler: twenty gods from Hindu tradition, the Kalinga Rush look. The full brief is
`BRIEF.md` (written as "Trilok Leela"; the game is now called Astras Unleashed). Read it before working here.

- **House rules:** the `game-bible` skill (LioraLabs). Load it before writing game code; climb its ladder (an existing
  word → content → CSS → `tuning.ts` → a pure rule → only then a new word).
- **The vocabulary:** `docs/declarative-ui.md` is the catalog of every word, kind, prefab, token and keyframe;
  `src/catalog.test.ts` fails when it and the code disagree. Read it before writing any `.kdl` or `.css`.
- **Respect rules** (`BRIEF.md` §7) are non-negotiable: leela, not war; no ranking of gods; iconography as tradition
  shows it; Kali Yuga (कलि) is never linked to the goddess Kali (काली).
- **Gates:** the build runs in phases with human gates (`BRIEF.md` §9). Stop at each gate and report.
- **Balance:** the agent reports, the human decides. Never retune a number silently.
- **Guards:** never edit `src/core-purity.test.ts` or `src/screens/screen-imports.test.ts` except to keep `CORE` in step
  with core modules as they come and go (the brief asks for that); never loosen them.

## Tweak map: where each change lives

| Change | Home |
|---|---|
| A god card: cost, class, stats, words, epithet, first-play `line`, tags, skin token | `content/cards.kdl` |
| A token a god creates (Brahma's hamsa) | `content/cards.kdl` (`token`) |
| A class: name, colour token, sigil, job, counter | `content/classes.kdl` |
| A Kshetra: name, rule word, signboard text, lead/support tokens, scene | `content/kshetras.kdl` |
| Yugas: order, die face, seconds, Prana multiplier, reveal, grade and sky tokens, headline | `content/match.kdl` |
| Banners, the Sun and the Moon, deck rules (8 cards, 1 Trimurti) | `content/match.kdl` |
| Starter decks | `content/decks.kdl` |
| Bots: names, reaction time, lane habits, Prana habits, deck | `content/bots.kdl` |
| Katha pages and their source keys | `content/katha.kdl` (+ `LORE.md`) |
| The four blessings (emotes) | `content/emotes.kdl` |
| A number a rule reads (lane tiles, deploy zone, Prana rate, spell-vs-banner) | `src/tuning.ts`, unit in the name, reason beside it |
| Every hue: UI, scene, deity skins, yuga grades and skies | a token in `src/screens/shared.css :root` |
| How the render looks: grain, warm cast, halftone, haze, grade mix, vignette, misregister | `--look-*` tokens in the same `:root` |
| Shared prefabs (header, signboard, card, diyas, ...) and keyframes | `src/screens/shared.kdl` + `shared.css` |
| A screen | `src/screens/<screen>.kdl` + `.css` (+ `.ts`, bindings only) |
| A behaviour word | its registry in the core module that owns it (`units.ts`, `effects.ts`, `cards.ts`, `kshetras.ts`), a catalog row, a test |
| A procedural painter | a `defineElement` in `src/screens/shared.ts` |

## Commands

See `README.md`. In this cloud container, story tests and shots need `CHROMIUM_PATH=/opt/pw-browsers/chromium`.
