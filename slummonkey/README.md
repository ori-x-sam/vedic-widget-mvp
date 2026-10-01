# SlumMonkey: Crypto Billionaire

A hand-drawn-style run-and-gun boss-rush for mobile (landscape) in the spirit of the genre, staged as an
**80s Indian stage-magic show** painted like a Bollywood billboard and played back off a 1986 VHS tape.
TypeScript + Vite + three.js. Original characters, art, UI, music and story.

```
npm install
npm run dev            # http://localhost:5173  (phone on the same Wi-Fi: use the printed network URL)
npm test               # unit + guard tests (node)
npm run test:stories   # every Storybook story's play() in headless Chromium, real renderer
npm run storybook      # browse stories at :6006
npm run balance        # balance bot report for every boss/level
npm run catalog        # regenerate VOCABULARY.md after changing a word
npm run shots          # screenshots of every phase into shots/
npm run build          # static build in dist/
```

Dev entry points: `?boss=gajraj&phase=1`, `?level=mela`, `?overworld`, `?story=intro`, `?shop`;
add `&bot=0.9` to let the bot play, `&god` for invulnerability, `&seed=3` for a fixed seed, `&touch` to force touch controls.

## Plain text is the interface

| folder | what it holds | format |
|---|---|---|
| `content/*.kdl` | **what things are**: bosses, phases, minions, levels, weapons, supers, charms, shop, projectiles, puppets (part rigs), stages (layers + lights), music themes, story panels, island map, touch layout, UI strings | KDL |
| `look/*.css` | **how they look**: every color, outline width, cel shading, grain, gate weave, chroma, VHS tracking, grade, vignette, camera framing, safe zones, HUD, banners (`@keyframes`), buttons | CSS custom properties |
| `art/**/*.svg` | puppet parts, sprites, painted stage layers, comic art, island props. Colors are `var(--token)` so a CSS edit recolors them | SVG |

KDL refers to CSS and SVG **by id** (`stage="gajraj"` → `--sky-gajraj-top`; `svg="parts/gajraj/head"` → `art/parts/gajraj/head.svg`).
The guard tests fail if any id doesn't resolve.

## "I want to change…" → the one file to edit

| kind of change | edit |
|---|---|
| any color (palette, characters, parry pink) | `look/palette.css` |
| outline weight, cel shadow, rim light, line boil, squash, smear, hit flash | `look/ink.css` |
| film grain, VHS tracking, chroma, vignette, color grade, bloom, max DPR | `look/post.css` |
| camera zoom, where the floor sits on screen, thumb safe zones | `look/camera.css` (+ matching `safe-zone` lines in `content/controls.kdl`) |
| watercolor paper, haze, depth blur, sky colors per stage | `look/stages.css` |
| HUD, banners ("KHEL KHATAM!" animation), comic panels, shop look, fonts | `look/hud.css` |
| touch button look (shapes, colors, idle fade) | `look/controls.css` |
| a boss's phases, attacks, timings, HP, intro line | `content/bosses/<boss>.kdl` |
| a boss's body parts / rig | the `puppet` block at the top of the same file + `art/parts/<boss>/*.svg` |
| minions (rabbits, kettles, kites, the balloon guru) | `content/minions.kdl` (and Teen Tigada's in `content/bosses/teen-tigada.kdl`) |
| the run-and-gun level / the shmup | `content/levels/mela.kdl`, `content/levels/rickshaw-sky.kdl` |
| projectile size, damage, gravity, which ones are parryable | `content/projectiles.kdl` |
| weapons, EX shots, supers, charms, shop prices | `content/weapons.kdl` |
| player feel (speed, jump, glide fall speed, blink, parry window, HP, meter) | `content/player.kdl` |
| default touch layout (positions, sizes, shapes, icons, hit zones) | `content/controls.kdl` (players can also drag/resize in-game; "Copy KDL" exports this block) |
| keyboard / gamepad mapping | `src/shell/keyboard.ts`, `src/shell/gamepad.ts` |
| dialogue: cutscenes | `content/story.kdl` |
| dialogue: in-fight banter | `say` lines in the boss files |
| dialogue: island NPCs, UI strings | `content/overworld.kdl`, `content/strings.kdl` |
| the island map, tents, NPC positions | `content/overworld.kdl` (the map is ASCII: `~` sea `.` grass `,` sand `#` path `^` rock `T` tree) |
| painted backgrounds, parallax depth, stage lights | `content/stages.kdl` + `art/stages/**` |
| music (tabla/dholak/harmonium/synth patterns, tempo, raga scale) | `content/music.kdl` |
| a new behaviour no word can express | add **one word** in `src/rules/vocab/registry.ts`, then `npm run catalog` |

## Architecture

```
src/core/    engine loop, fixed-step clock (+hit-stop), seeded RNG, pools, KDL parser, CSS-token reader, content loader, input merger
src/rules/   the game: World, player moves, phase runner, the vocabulary (one registry). Headless and deterministic. Never imports view.
src/view/    three.js: cutout puppets (12fps "on twos" over 60fps motion), instanced bullets/particles, painted stages, post stack, HUD, comics, island
src/shell/   app flow + screens, touch/keyboard/gamepad, synthesized audio + sequencer, haptics, save data, layout editor
src/bot/     a heuristic + lookahead player used by the balance bot, screenshots and stories
stories/     Storybook: one story per boss phase, level and player move; each play() asserts the signature move
tests/       unit tests + guards (drift, rules↛view, ids resolve, reserved parry color, touch layout rules, SVG validity)
tools/       balance bot, catalog generator, screenshot/flow tools, Gauntlet prep
```

A boss is only a stack of words:

```kdl
boss "gajraj" name="Gayab Gajraj" hp=1100 stage="gajraj" theme="gajraj" {
  phase "sheet-trick" until="66%" { loop { stomp 0.55 2; windup 0.45 pose="spray"; spray 1.4 70 "coin"; vanish-under-sheet 2.6 } }
  phase "invisible" until="33%" { invisible 0; invisible-trail "powder"; rider "howdah" keep-visible=#true; loop { patrol "left" "right" 240; drumroll 0.6; charge 700 } }
  phase "trick-gone-wrong" { shrink 0.34; rider "mahout" { parryable "marigold" }; loop { zip 760 dur=3.2; ring 10 330 "coin" } }
}
```

**Parryable things are always `--parry` pink.** A guard test fails if any other art or token uses it
(the parry button and the parry-burst petals are the documented exceptions).

## Guards (`npm test`)

* every word used anywhere in `content/` exists in the registry, and every registry word has a one-line doc
* `VOCABULARY.md` matches the registry (regenerate with `npm run catalog`)
* `src/rules`, `src/core` and `src/bot` never import view/shell/three.js or touch the DOM; rules never use `Math.random`
* every projectile, minion, puppet, stage, theme, SVG file and `var(--token)` referenced actually exists
* the parry color is reserved; touch layout keeps SHOOT biggest, JUMP up-left, PARRY up-right of JUMP, BLINK left, EX on top; KDL safe zones match the CSS ones
* every SVG is well-formed (a broken file would silently render as the magenta "missing" texture)

## Mobile controls

Left thumb: a floating joystick anywhere in the left 40% (8-way snap, dead zone, base follows the thumb; aim-lock toggle top-left).
Right thumb: SHOOT (biggest, hold to fire, auto-fire option), JUMP up-left (tap, tap again, hold to tail-glide), PARRY up-right
next to JUMP (slide from JUMP onto PARRY in one motion), BLINK left of SHOOT, small EX/SUPER on top (glows when ready), weapon swap.
Distinct shape + icon + color per button, 25% idle opacity, touch zones larger than the art. Layout editor: drag, resize,
left-handed mirror, saved to localStorage, "Copy KDL" exports `content/controls.kdl`. Haptics on hits, parries, blinks, supers.
The stage floor sits 27% up the screen so the bottom corners (the thumbs) stay clear; the balance bot measures how often
hostile bullets enter those zones.

## Performance

Fixed 60Hz simulation, DPR capped at 2 (`--dpr-max`), dynamic resolution when frames run long, every bullet/particle/decal
drawn through instanced sprite batches from one atlas, pooled projectiles and particles, one full-screen post pass.
A Gajraj fight renders in ~28 draw calls (measured by `tools/flow-check.ts`).

## Vocabulary

See **[VOCABULARY.md](VOCABULARY.md)** — the full, generated catalog of every word with its arguments and where it is used.
