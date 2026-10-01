# SlumMonkey: Crypto Billionaire

A run-and-gun boss-rush for mobile in the spirit of the genre, staged as an **80s Indian stage-magic show**,
rendered as a clean **low-poly 3D diorama**: flat-shaded models, real lights and shadows, no filters.
TypeScript + Vite + three.js. Original characters, models, UI, music and story.

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
| `content/*.kdl` | **what things are**: bosses, phases, minions, levels, weapons, supers, charms, shop, projectiles, low-poly models (`puppet` blocks: shapes on pivots), stages (`prop` set pieces), music themes, story panels, island map, touch layout, UI strings | KDL |
| `look/*.css` | **how they look**: every color, lights, fog, camera framing, safe zones, HUD, banners (`@keyframes`), buttons | CSS custom properties |
| `art/**/*.svg` | comic-panel art and projectile/HUD icons. Colors are `var(--token)` so a CSS edit recolors them | SVG |

KDL refers to CSS **by token** (`color="--elephant"`, `stage="gajraj"` → `--sky-gajraj-top`). The guard tests fail if any id,
shape, color token, prop kind or animation name doesn't resolve.

A model is a stack of simple shapes, each line one part:

```kdl
puppet "gajraj" {
  part "body"  shape="ball" dim="290 196 180" x=-14 y=58 off="0 98 0" color="--elephant" anim="breathe"
  part "head"  shape="ball" dim="150 140 132" x=118 y=168 off="30 14 0" color="--elephant" anim="head"
  part "trunk" shape="cyl" dim="44 56 44" taper=0.85 x=92 y=-14 off="0 -26 0" color="--elephant" anim="trunk" parent="head"
}
```

A stage is a list of set pieces placed in depth (`z<0` behind the action):

```kdl
stage "gajraj" {
  prop "palace" x=0 y=0 z=-1500 s=1.25
  prop "palm" x=-820 y=0 z=-700
  prop "curtain" x=-800 w=380 h=1000
  prop "stall" x=0 z=-380 every=640   // repeats forever as the camera scrolls
}
```

## "I want to change…" → the one file to edit

| kind of change | edit |
|---|---|
| any color (palette, characters, parry pink) | `look/palette.css` |
| light strength, shadows, fog distance, hit flash, max DPR | `look/stages.css`, `look/post.css` |
| camera zoom, tilt, field of view, where the floor sits on screen, thumb safe zones | `look/camera.css` (+ matching `safe-zone` lines in `content/controls.kdl`) |
| sky colors per stage | `look/stages.css` |
| HUD, banners ("KHEL KHATAM!" animation), comic panels, shop look, fonts | `look/hud.css` |
| touch button look (shapes, colors, idle fade) | `look/controls.css` |
| a boss's phases, attacks, timings, HP, intro line | `content/bosses/<boss>.kdl` |
| a boss's model (shapes, colors, which parts animate) | the `puppet` block at the top of the same file |
| minions (rabbits, kettles, kites, the balloon guru) | `content/minions.kdl` (and Teen Tigada's in `content/bosses/teen-tigada.kdl`) |
| the run-and-gun level / the shmup | `content/levels/mela.kdl`, `content/levels/rickshaw-sky.kdl` |
| projectile size, damage, gravity, which ones are parryable | `content/projectiles.kdl` |
| weapons, EX shots, supers, charms, shop prices | `content/weapons.kdl` |
| player feel (run accel, jump arc, apex hang, jump buffer, dash, auto-aim range, parry window, HP, meter) | `content/player.kdl` |
| default touch layout (positions, sizes, shapes, icons, hit zones) | `content/controls.kdl` (players can also drag/resize in-game; "Copy KDL" exports this block) |
| keyboard / gamepad mapping | `src/shell/keyboard.ts`, `src/shell/gamepad.ts` |
| dialogue: cutscenes | `content/story.kdl` |
| dialogue: in-fight banter | `say` lines in the boss files |
| dialogue: island NPCs, UI strings | `content/overworld.kdl`, `content/strings.kdl` |
| the island map, tents, NPC positions | `content/overworld.kdl` (the map is ASCII: `~` sea `.` grass `,` sand `#` path `^` rock `T` tree) |
| set pieces per stage (palace, palms, curtains, stalls, ferris wheel, clouds…) | `content/stages.kdl` (one function per prop kind in `src/view/stage3d.ts`) |
| music (tabla/dholak/harmonium/synth patterns, tempo, raga scale) | `content/music.kdl` |
| a new behaviour no word can express | add **one word** in `src/rules/vocab/registry.ts`, then `npm run catalog` |

## Architecture

```
src/core/    engine loop, fixed-step clock (+hit-stop), seeded RNG, pools, KDL parser, CSS-token reader, content loader, input merger
src/rules/   the game: World, player moves, phase runner, the vocabulary (one registry). Headless and deterministic. Never imports view.
src/view/    three.js: low-poly models from KDL, stage set pieces, instanced bullets/particles/telegraphs, lights + shadows, HUD, comics, 3D island
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
* the parry color is reserved (no model part may use `--parry`); touch layout keeps JUMP biggest under the right thumb, DASH beside it, SPECIAL above; KDL safe zones match the CSS ones
* every model part is a known shape with a real color token, anim and parent; every stage prop kind exists
* every SVG is well-formed

## Controls

Three buttons and a stick. **Aiming and firing are automatic**: the blaster locks onto the nearest thing worth shooting
(ropes and minions first, never behind you) and fires on its own, so your thumbs only move and dodge.

| | touch | keyboard |
|---|---|---|
| move / duck | floating joystick, left half | ← → / ↓ |
| jump · double jump · hold to tail-glide | **JUMP** (big, right thumb) | Z / Space |
| parry | press **JUMP** again in the air next to anything pink | Z |
| dash (fast slide with i-frames, once per jump) | **DASH** left of JUMP | Shift |
| special (EX shot; super when the meter is full) | **SPECIAL** above, glows when ready | V |

Movement is tuned to feel tight: accelerated run with quick stop, jump buffering and coyote time, short-hop on release,
faster fall than rise with a little hang at the apex. The layout editor (drag, resize, left-handed mirror) still works and
exports `content/controls.kdl`. The floor sits 27% up the screen so the bottom corners (the thumbs) stay clear.

## Boss rhythm

Every loop is **tell → attack → breathe**: each attack has a wind-up (pose, drumroll, red floor ring or line), and big moves end
in a `stun` (dizzy, takes extra damage) so there's always a moment to hit back. Groups take turns instead of firing at once.
Invisible acts keep a faint shimmer. A thin boss bar with phase ticks sits at the top.

## Performance

Fixed 60Hz simulation, DPR capped at 2 (`--dpr-max`), dynamic resolution when frames run long, one shadow-casting light,
shared geometry per shape, and every bullet/particle/telegraph drawn as instanced meshes (one draw call per shape).
No post-processing pass.

## Vocabulary

See **[VOCABULARY.md](VOCABULARY.md)** — the full, generated catalog of every word with its arguments and where it is used.
