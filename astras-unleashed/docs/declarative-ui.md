# Vocabulary catalog

Every piece of shared vocabulary, where it lives, and one line on how to use it. `src/catalog.test.ts` fails when
this file and the code disagree, so a new word lands here in the same commit as its code. Nothing here is a
placeholder from the starter any more: every row is Astras Unleashed's own.

Homes:

| Vocabulary | Home |
|---|---|
| Engine elements and properties | `src/decl/` (pure core `css.ts` + Pixi half `engine.ts`) |
| Game CSS properties, custom elements | `src/screens/shared.ts` (the only module calling `defineProp` / `defineElement`) |
| Shared prefabs | `src/screens/shared.kdl`, styled in `src/screens/shared.css` |
| Palette (UI and battlefield) | `:root` of `src/screens/shared.css`, read by the shell through `src/tokens.ts` |
| Look numbers (grain, cast, halftone, haze, grade, misregister) | `--look-*` tokens in the `:root` of `src/screens/shared.css`, read by the shell through `src/view/look.ts` |
| Behaviour words | `STAT_WORDS`, `UNIT_WORDS` (`src/units.ts`), `EFFECT_WORDS` (`src/effects.ts`), `TRIGGERS` (`src/cards.ts`), `KSHETRA_WORDS` (`src/kshetras.ts`) |
| Content kinds | zod schemas in `src/content.ts`, data in `content/*.kdl` |
| Keyframes | `@keyframes` in `src/screens/shared.css` |
| The arena (board, towers, gods, scenery) | `src/view/arena.ts`, `unit.ts`, `props.ts`, `glyphs.ts`, `art.ts` |
| Screens and their stacking | `src/runtime.ts` (import order = draw order) |

## How screens work

A screen is `screens/<name>.kdl` (structure) + `.css` (look) + `.ts` (bindings only), made with `screenUi()` from
`shared.ts`, which prepends the shared prefabs and styles.

KDL: every top-level node is a `prefab "name" { ... }` holding one root element. Attributes on built-in elements:

| Attribute | Meaning |
|---|---|
| `class="a b"` | classes the CSS matches |
| `bind="x"` | the element's text (or sprite texture) comes from binding `x`; a bare string (`text "HI"`) is literal |
| `bind-class="x"` | more classes from binding `x` (space-separated) |
| `tap="x"` | binding `x` is the tap handler; makes the element tappable (`:pressed`, `:hover`) |
| `key=(bind)"x"` | reconcile identity among siblings (lists); `key=` in `use()` bindings keys a whole prefab |
| `slot="x"` | children come from `use(prefab, bindings, { x: [...] })` |
| `if="x"` / `if="!x"` | only when binding `x` is truthy / falsy |
| `name=(bind)"x"` | on a custom element, a bound property (a plain `name=1` is literal) |

The `.ts` renders with `ui.show(use('prefab', bindings, slots))`; every binding a prefab names must be passed. Errors
name the prefab, element and fix.

CSS dialect: `.class`, `type`, `:pressed`/`:hover`, compounds (`.a.b`), descendant chains, selector lists,
`:root { --var }` + `var(--var)`, `max(px, var(--touch-size))`, `@keyframes`, `transition`, `animation`. No child or
sibling combinators, `:not`, `:nth-child` or media queries. Numbers are design px (no unit needed), `%` of the parent,
times in `s` or `ms`, `rotate` in degrees, easings `linear` `ease` `ease-in` `ease-out` `ease-in-out` `cubic-bezier()`
`steps()`. Text properties inherit (`font-weight` too); `flex-shrink` defaults to 0. `var(--touch-size)` is a finger-sized target.

## CSS properties

Built-ins (engine) and game-defined (`defineProp` in shared.ts).

| Property | Use |
|---|---|
| `display` | `flex` or `none` |
| `position` | `static` or `absolute` (with `left`/`top`) |
| `left` | px or % of the parent, absolute only |
| `top` | px or % of the parent, absolute only |
| `width` | px or % |
| `height` | px or % |
| `padding` | 1-4 values |
| `gap` | px between children |
| `flex-direction` | `column` (default) or `row` |
| `justify-content` | `flex-start` `center` `flex-end` `space-between` |
| `align-items` | `stretch` `flex-start` `center` `flex-end` |
| `flex-grow` | take the remaining space |
| `flex-wrap` | `nowrap` or `wrap` |
| `flex-shrink` | default 0 |
| `flex-basis` | px or % |
| `pointer-events` | `auto` swallows taps (scrims); default `none` lets them through |
| `background-color` | panel fill |
| `border-color` | panel stroke, drawn inside |
| `border-width` | panel stroke width |
| `panel-art` | `"<atlas frame> <slice border>"`: a 9-slice from the texture atlas, tinted by `background-color` (needs an atlas: screenUi's `texture` hook) |
| `image-scale` | sprite scale (default 2: art drawn at 2x) |
| `font-family` | `var(--title-font)`, `var(--body-font)` or `var(--tamil-font)` |
| `font-weight` | game: `400`…`900`, as CSS; headlines are `900` |
| `font-size` | px |
| `font-color` | text colour |
| `text-align` | `left` `center` `right` |
| `text-wrap` | `wrap` wraps to the box |
| `letter-spacing` | px |
| `line-height` | px |
| `text-stroke-color` | outline colour |
| `text-stroke-width` | outline width |
| `opacity` | 0..1 |
| `scale` | `1.1` or `.9 1.1`, about the box centre |
| `translate` | `x y` px |
| `rotate` | degrees |
| `transition` | `<prop> <dur> [easing] [delay], ...` |
| `animation` | `<name> <dur> [easing] [delay] [count] [alternate] [fill], ...` |
| `tint` | game: multiplies a node's colours; colours `meter` |

## Elements

| Element | Use |
|---|---|
| `panel` | box with children |
| `button` | tappable box with children; base style in shared.css |
| `text` | `bind="x"` or a literal |
| `sprite` | atlas texture (needs an atlas: screenUi's `texture` hook throws until the game has one) |
| `meter` | `meter value=(bind)"fill"`: a fill of `w * value` (0..1), coloured by `tint` |
| `prana-gem` | a glowing haldi Prana drop: the cost badge, the Prana count |
| `prana-segment` | `prana-segment fill=(bind)"f"`: one segment of the Prana bar, 0..1 |
| `sigil` | `sigil kind=(bind)"k" paint=(bind)"--token"`: a class sigil (shield sword bow flame lotus) in its colour |
| `card-art` | `card-art god= paint= skin= attribute= trimurti=`: a card's art, Marvel Snap style: `public/art/cards/<god>.png` when it exists (breaking over the top edge), else a placeholder in the god's own colours with its attribute glyph; class-colour frame, gold leaf and gems for the Trimurti |
| `emblem` | `emblem kind=(bind)"disc|crescent" paint= trim=`: the Sun's disc or the Moon's crescent |
| `flag` | `flag paint= trim= lowered=`: a Dhvaja on its staff, or folded at the foot when lowered |
| `long-die` | `long-die face=(bind)"n"`: the pasaka from the side, showing 4..1 pips |
| `patta-border` | a Pattachitra-style label border: sindoor frame, haldi dots, conch-white corners |
| `tick` | `tick on=(bind)"x"`: the teacher's red tick, when on |
| `dots` | a dotted fill-in line in frame colour |

## Shared prefabs

Build them with the binding builders exported from `screens/shared.ts`, which turn content into bindings.

| Prefab | Use |
|---|---|
| `btn` | `btn(label, tap, state?)`; state `primary` / `off` |
| `hud` | `hud(time, yuga, { score?, die? })`: the strip along the top of the arena: banner score, clock and yuga, long die |
| `kshetra-toast` | `kshetraToast(lane, kshetraId)`: the pop-up when a lane is revealed or its arena chip is tapped |
| `card` | `card(id, 'hand' | 'next' | 'face' | 'detail', cost?)`: a Marvel Snap-style god card; a lower `cost` marks it discounted; detail adds the epithet and rules |
| `card-rule` | one AVAHANA / NITYA / CAST / VISARJANA line in a card's detail (built by `card`) |
| `prana-bar` | `pranaBar(prana, max)`: the gem and count, then ten segments; the charging one fills |
| `prana-segment` | one segment of the bar (built by `pranaBar`) |
| `banner-score` | `bannerScore(sunLowered, moonLowered)`: each side's emblem and three Dhvajas |
| `banner-score-emblem` | a side's emblem in the score (built by `bannerScore`) |
| `banner-score-flag` | one Dhvaja in the score, raised or lowered (built by `bannerScore`) |
| `long-die` | `longDie(face, tap)`: the yuga's die, the pause button; a new face replays `yuga-turn` |
| `katha-page` | `kathaPage(id, unlocked)`: a Deva Katha page on cream |
| `report-card` | `reportCard({ kicker, rows, remark, stamp, assisted })`: the Leela Report with its rubber stamp |
| `report-row` | one row of the report (built by `reportCard`) |
| `emote` | `emote(id)`: one of the four blessings; any other id throws |

## Keyframes

`@keyframes` in `src/screens/shared.css`, for any screen's `animation:`. The arena animates in code (## Arena).

| Keyframe | Use |
|---|---|
| `toast-in` | a pop-up (a Kshetra revealed, the yuga line turning) bounces in |
| `kshetra-reveal` | something flips over as it is revealed |
| `yuga-turn` | the long die turns to the next yuga's face |
| `misregister` | entering Kali Yuga the HUD shudders by `--look-misregister-px` (reduced motion: none) |
| `banner-lower` | a Dhvaja in the score is lowered and folded (`forwards`) |
| `card-play` | a card leaves the hand when played |
| `prana-glow` | the charging Prana segment glows |

## Arena

The battlefield is drawn by the shell, not by prefabs: `src/view/arena.ts` (the board, the towers, the Kshetra
chips), `src/view/unit.ts` (a god's figure and its animation), `src/view/props.ts` (scenery), `src/view/glyphs.ts`
(attribute glyphs), `src/view/art.ts` (painted files). Painted art goes in `public/art/cards/<id>.png` and
`public/art/units/<id>.png`; until a file exists the placeholder draws. Hues are palette tokens, sizes and motion are
`--look-*` tokens.

| Piece | Use |
|---|---|
| `createArena(onChip)` | the board: `setBox(box)`, `sync({ lanes, units, towers, grade })`, `tick(dt)`; `onChip(lane)` hears a Kshetra chip tapped |
| `project(box, x, tile)` | the tilted 3/4 camera: a lane point to screen px and its depth scale |
| `createUnit(god, side, h)` | a god's figure on its team ring; `set(act, t, facing)` poses it: `idle` `walk` `strike` `avahana` `visarjana` |
| `GLYPHS` | each god's attribute glyph (content `attribute=`); a test checks every god has one and no two share |
| `preloadArt()` / `art(kind, id)` | try every god's painted card and unit file once at boot; answer from what loaded |

## Palette

Every hue in the game, in the one `:root` of `src/screens/shared.css`: the HUD chrome, the arena's painted ground
(grass, path, river, wood, sky), the textbook scene palette, deity skins and yuga grades. Content names these tokens
(a class's `paint=`, a Kshetra's `lead=`, a god's `skin=`); a guard test checks every such name is here. The Palette
story shows them all, grouped as in the `:root`, with every text/background contrast pair.

| Token | Use |
|---|---|
| `--hud` | the strip along the top and the tray behind the hand |
| `--hud-edge` | the darkest panel edges, text outlines, the scrim behind a dialog |
| `--hud-rule` | raised panels, borders, the empty Prana segments |
| `--cream` | light text on the HUD and on cards: names, the clock |
| `--gold` | the HUD's accent: the yuga line, Devanagari names, highlights |
| `--ink` | dark text on cream pages (Katha, the Leela Report) |
| `--grass` | the field |
| `--grass-light` | sunlit tufts, the near edge |
| `--grass-shade` | shadow under trees and towers, the grass texture's dark strokes |
| `--path` | the sandy path each lane's gods walk |
| `--path-shade` | the path's worn edges |
| `--river` | the river across the middle |
| `--river-deep` | the river's deep centre and banks |
| `--river-light` | ripples and glints |
| `--wood` | the three bridges |
| `--sky` | the sky beyond the opponent's end, fading to --sky-cream at the horizon |
| `--sindoor` | vermilion: the Sun team, flags, Yoddha frames, Hanuman's sindoor-coated skin |
| `--haldi` | turmeric: diya flames, Prana, Astra frames, Surya, the sun emblem |
| `--marigold` | flames, garlands, Agni, festivals |
| `--rani` | rani pink: Sahayak frames, Satyaloka, Amaravati |
| `--tota` | parrot green: forests, Dhanurdhara frames, Kishkindha |
| `--peacock` | peacock teal: oceans, Rakshak frames, Kartikeya's peacock |
| `--neel` | indigo: night, the Moon team, Kali Yuga, Pralaya, Patala |
| `--seafoam` | surf, Ksheer Sagar, pale skies |
| `--laterite` | earth, plinths, diya bodies, Kurukshetra |
| `--khondalite` | stone, Meru, Dhvaja plinths; every grey in the game is this or a tint of the palette |
| `--limewhite` | snow, the milk ocean, the Moon emblem, gulal highlights |
| `--chandan` | warm skin for mortals, and for gods whose tradition shows warm skin |
| `--sky-cream` | the warm textbook sky at the horizon |
| `--megh` | rain-cloud blue (megha-shyama): Vishnu, Rama, Krishna |
| `--karpur` | camphor-white with an ash cast (karpura-gaura): Shiva, with a megh-blue throat |
| `--kalika` | deep indigo-black: Kali's skin |
| `--gold-leaf` | Tanjore-style gold leaf: Trimurti card frames only |
| `--yuga-satya` | dawn: the clearest, brightest light |
| `--yuga-satya-sky` | Satya's sky above the horizon |
| `--yuga-treta` | midday: marigold warmth |
| `--yuga-treta-sky` | Treta's sky above the horizon |
| `--yuga-dvapara` | dusk: sindoor and rani, long shadows |
| `--yuga-dvapara-sky` | Dvapara's sky above the horizon |
| `--yuga-kali` | night: neel, lit by haldi lamps and stars |
| `--yuga-kali-sky` | Kali's sky above the horizon |
| `--yuga-pralaya` | the cosmic ocean: deep neel and seafoam; only the banners' lamps glow |
| `--yuga-pralaya-sky` | Pralaya's sky above the horizon |
| `--title-font` | the game's display face: names, the clock, labels |
| `--body-font` | body, Katha text, every Devanagari string |
| `--tamil-font` | Tamil names (Murugan) |
| `--pop` | overshoot easing |
| `--unfurl` | a scroll or banner unrolling |

## Look

`--look-*` tokens in the `:root` of `src/screens/shared.css`, beside the palette; `src/view/look.ts` reads them as `LOOK`
(`--look-arena-tilt` is `LOOK.ARENA_TILT`). Plain numbers, the unit the name's last word (`px`, `ms`, `per-s`); no unit
is a strength or 0..1 amount.

| Name | Use |
|---|---|
| `--look-grain` | fine paper grain over the battlefield |
| `--look-warm-cast` | a faint warm (sky-cream) cast over the battlefield |
| `--look-halftone` | a faint halftone in large flat areas; 0 turns it off |
| `--look-halftone-dot-px` | the halftone's dot pitch |
| `--look-depth-haze` | atmospheric haze on a lane's far layers (sky-cream mixed in) |
| `--look-grade-mix` | how strongly the yuga grade tints the lanes |
| `--look-vignette` | the frame-edge vignette at the page's edges |
| `--look-misregister-px` | entering Kali Yuga, the colour plates slide this far apart... |
| `--look-misregister-ms` | ...and snap back over this long (reduced motion: a simple fade) |
| `--look-arena-tilt` | the 3/4 camera: how much narrower and closer together the far rows are; 0 is flat |
| `--look-unit-height-px` | a god's height at the near edge (it shrinks with depth; the far edge must stay over 28) |
| `--look-walk-bounce-px` | how high a walking god bobs |
| `--look-walk-steps-per-s` | walking steps a second |
| `--look-strike-lunge-px` | how far a god lunges on each strike |

## Behaviour words

Under a `card` (or `token`) in `content/cards.kdl`, one per line. A bare word is Nitya (always on); wrap a word in a
trigger (## Triggers) for when it happens. Each is a pure function in the registry of the core module that owns its
rule: the body in `STAT_WORDS` and the field rules in `UNIT_WORDS` (`src/units.ts`), what happens to a lane in
`EFFECT_WORDS` (`src/effects.ts`). Words with a signature read `word n opt=v flag`; the table gives each one's form.
Areas: `width=` is tiles of lane centred on the cast point or the god, `radius=` tiles around the god; an effect with
no area reaches what the effect before it in its block reached (same side), a buff with no area reaches the god its
`with` matched, otherwise the whole lane.

| Word | Use |
|---|---|
| `hp` | `hp n`: hit points. |
| `hit` | `hit dmg every=s`: each strike deals dmg, one every s seconds. |
| `speed` | `speed tps`: walking speed, tiles a second (slow 0.8, medium 1.1, fast 1.5, very fast 2.0). |
| `reach` | `reach tiles`: how far its strikes land (melee is 0.8). |
| `splash` | `splash tiles`: each strike also hits enemies within this many tiles of the target. |
| `stationary` | `stationary`: it stays where it lands and never walks. |
| `lifetime` | `lifetime s`: it returns to light after s seconds. |
| `taunt` | `taunt r`: enemies within r tiles must target this god. |
| `leap` | `leap`: may land anywhere in its lane, even past the midline, but not within LEAP_BANNER_GAP_TILES of a banner. |
| `emerge-at-dhvaja` | `emerge-at-dhvaja`: lands at its own side's Dhvaja in the lane, wherever it was dropped. |
| `shield-at` | `shield-at frac amount`: once, when its HP falls to frac of its maximum, it gains an amount-HP shield. |
| `fury-below` | `fury-below frac dmg=f`: deals f more damage (0.4 = +40%) while its side's Dhvaja in its lane is below frac HP. |
| `guard` | `guard f`: allies in its lane (itself too) take f less damage (0.25 = 25%). |
| `first-strike` | `first-strike mult reach= units-only`: its first strike deals mult times damage, from `reach` tiles if given; `units-only` never on a banner. |
| `grow-on-withdraw` | `grow-on-withdraw step max=m`: +step damage each time an enemy in its lane returns to light, up to +m. |
| `gather` | `gather step max=m`: strikes step faster per other ally in its lane, up to m faster. |
| `meditate` | `meditate s guard=f`: sits still s seconds taking f less damage; the words after it in its block wait until it opens its eyes. |
| `ramp` | `ramp mult over=s units-only`: strikes on one target grow to mult times over s seconds; `units-only` never ramps on a banner. |
| `pacifist` | `pacifist`: never strikes. |
| `inspire` | `inspire f radius=r`: allies within r tiles deal f more damage. |
| `calm` | `calm f radius=r`: enemies within r tiles strike f slower (0.2 = 20%). |
| `dmg` | `dmg f`: deals f more damage (0.25 = +25%); usually inside `with`. |
| `reveal-next` | `reveal-next`: while it is on the field, its player sees the opponent's next card. |
| `damage` | `damage n width= targets= pick="nearest|highest-hp" units-only`: n to each enemy reached; `targets` caps how many (picked by `pick`); `units-only` spares banners. |
| `heal` | `heal n dhvaja= width= seconds=`: allies in the area regain n HP a second (your banner `dhvaja` a second) for `seconds`. |
| `stun` | `stun s radius= width=`: enemies reached can't move or strike for s seconds. |
| `knockback` | `knockback tiles`: enemies reached are pushed back toward their own end. |
| `pull` | `pull tiles root= range=`: the farthest enemy within `range` is pulled `tiles` closer and held `root` seconds (Yama's noose). |
| `haste` | `haste f width= seconds=`: allies reached move and strike f faster (0.35 = 35%) for `seconds`. |
| `prana` | `prana n`: its player gains n Prana (never above the diya row's maximum). |
| `create` | `create "token"`: a token (content/cards.kdl `token`, never a card) appears beside the god, on its side. |
| `discount-next` | `discount-next n`: its player's next card costs n less. |
| `seconds` | `seconds n`: the card's timed effects last n seconds instead (inside `with`: Ganga lasts longer with Shiva). |

## Triggers

Words with a block, in `TRIGGERS` (`src/cards.ts`); a card's words are read with `CARD_WORDS`, all of the above at once.

| Trigger | Use |
|---|---|
| `avahana` | `avahana { words }`: when it is played (a god, after it lands; an Astra, after its vision). |
| `visarjana` | `visarjana { words }`: when it returns to light. |
| `every` | `every s first= { words }`: every s seconds while it is on the field; the first time at `first` seconds (default s). |
| `with` | `with "id-or-tag" { words }`: while an ally with that id or tag shares its lane. |

## Kshetra words

Under a `kshetra` in `content/kshetras.kdl`: the one rule it lays on its lane, for both players. `KSHETRA_WORDS` in
`src/kshetras.ts`.

| Word | Use |
|---|---|
| `cost-cut` | `cost-cut "tag" n`: cards with that id, class or tag cost n less played here (never below 0). |
| `regen` | `regen f`: units here regain f of their maximum HP a second (0.015 = 1.5%). |
| `dmg-mult` | `dmg-mult m`: all damage dealt here is multiplied by m. |
| `speed-mult` | `speed-mult m`: units here walk m times as fast. |
| `reach-cut` | `reach-cut tiles`: ranged units here reach that much less (never below melee); melee is untouched. |
| `dhvaja-hp` | `dhvaja-hp m`: both banners here have m times their HP. |
| `dhvaja-haste` | `dhvaja-haste m`: both banners here strike m times as often. |
| `amrit` | `amrit n every=s`: every s seconds, each player with a unit here gains n Prana. |
| `veil` | `veil s`: units placed here can't be targeted by ranged attacks for s seconds. |
| `echo` | `echo f`: the first unit each player places here is echoed once, a copy at f of its HP and damage. |

## Content kinds

Zod schemas in `src/content.ts`; each file's header gives its full form. Cross-checks after loading make sure every
name one file uses exists (a deck's cards, a `with` tag, a `create` token, a Katha page's god, a class).

| Kind | Use |
|---|---|
| `class` | `class "id" name= english= paint="--token" sigil= job= weak=`: a card class, its colour and counter (`content/classes.kdl`) |
| `card` | `card "id" class= cost= tags= name= deva= title= regional= skin= line= { words }`: a god (`content/cards.kdl`) |
| `token` | `token "id" name= deva= skin= { words }`: a unit a god creates, never in a deck (`content/cards.kdl`) |
| `kshetra` | `kshetra "id" name= deva= lead= support= rule= scene= { one Kshetra word }` (`content/kshetras.kdl`) |
| `yuga` | `yuga "id" name= deva= die= seconds= prana= reveal= grade= sky= line= overtime=`: the clock, in file order (`content/match.kdl`) |
| `dhvaja` | `dhvaja "id" name= deva= hp= hit= every= range= tile= deploy-to= all-lanes=`: a banner (`content/match.kdl`) |
| `team` | `team "id" name= deva= emblem= paint= trim= side=`: the Sun and the Moon (`content/match.kdl`) |
| `deck-rules` | `deck-rules "id" cards= hand=`: deck size and hand size (`content/match.kdl`) |
| `deck-limit` | `deck-limit "id" tag= max=`: at most `max` cards with a tag per deck (`content/match.kdl`) |
| `deck` | `deck "id" name= cards= blurb=`: a starter deck (`content/decks.kdl`) |
| `bot` | `bot "id" name= level= deck= react= lanes= saves-for-kali= wastes-at-max= lessons=`: an opponent (`content/bots.kdl`) |
| `katha` | `katha "id" god= page= label= source= verified= text= know= fill= answer=`: a Deva Katha page (`content/katha.kdl`) |
| `emote` | `emote "id" text= deva=`: one of the four blessings (`content/emotes.kdl`) |

## Content helpers

| Helper | Use |
|---|---|
| `loadKdl` | `loadKdl(src, { kind: schema })`: KDL to validated records, errors name node and field |
| `combinators` | `combinators(registry, what)`: a node's children as behaviour/effect words; a word's block (`every 8 { pull 3 }`) parses with the same registry |
| `word` | `word({ args, opts, flags, block }, make)`: a registry entry whose arguments aren't all numbers: string ids and tags, named options with defaults (`width=4`), bare flags (`units-only`), a block of words |
| `tunedText` | `tunedText(T)`: `{A.b}` in a string quotes a tuning value  |

## Screens

In draw order (later on top). Each is `screens/<name>.kdl` + `.css` + `.ts` (bindings only).

| Screen | Use |
|---|---|
| `title` | the title screen; for now "Astras" over "Unleashed" and what the content holds (the real title card comes with the screens in Phase 3) |
