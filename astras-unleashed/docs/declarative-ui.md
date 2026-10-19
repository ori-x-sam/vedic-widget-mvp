# Vocabulary catalog

Every piece of shared vocabulary, where it lives, and one line on how to use it. `src/catalog.test.ts` fails when
this file and the code disagree, so a new word lands here in the same commit as its code. Rows marked PLACEHOLDER
belong to the starter's example game: replace them with your game's words.

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

## Shared prefabs

Build them with the binding builders exported from `screens/shared.ts`.

| Prefab | Use |
|---|---|
| `btn` | `btn(label, tap, state?)`; state `primary` / `off` |

## Palette

The Kalinga Rush palette, carried over unchanged, plus the deity and yuga tokens. Content names these tokens (a class's
`paint=`, a Kshetra's `lead=`, a god's `skin=`); a guard test checks every such name is here. The Palette story shows
them all, grouped as in the `:root`, with every text/background contrast pair.

| Token | Use |
|---|---|
| `--frame` | the page background |
| `--frame-edge` | vignette, the deepest edges, the pause button, modal scrims |
| `--frame-rule` | a raised maroon: pill outlines, thin rules and borders on the page |
| `--cream` | headlines, the title's first word, signboard titles, card names |
| `--gold` | the yuga and clock line, the URL, small rules, Devanagari names on cards |
| `--peach` | the top label |
| `--peach-title` | the title's second word; large sizes only |
| `--sindoor` | vermilion: the Sun team, flags, Yoddha frames, Hanuman's skin |
| `--haldi` | turmeric: diya flames, Prana, Astra frames, Surya, the sun emblem |
| `--marigold` | flames, garlands, Agni, festivals |
| `--rani` | rani pink: Sahayak frames, Satyaloka, Amaravati |
| `--tota` | parrot green: forests, Dhanurdhara frames, Kishkindha |
| `--peacock` | peacock teal: oceans, Rakshak frames, Kartikeya's peacock |
| `--neel` | indigo: night, the Moon team, Kali Yuga, Pralaya, Patala |
| `--seafoam` | surf, Ksheer Sagar, pale skies |
| `--laterite` | earth, plinths, diya bodies, Kurukshetra |
| `--khondalite` | stone, Meru, Dhvaja plinths; the source of every grey |
| `--limewhite` | snow, the milk ocean, the Moon emblem, gulal highlights |
| `--chandan` | warm skin for mortals and for gods whose tradition shows warm skin |
| `--sky-cream` | the old-paper sky at the horizon; the veiled lane |
| `--megh` | rain-cloud blue skin: Vishnu, Rama, Krishna |
| `--karpur` | camphor-white skin with an ash cast: Shiva |
| `--kalika` | deep indigo-black skin: Kali; never lightened |
| `--gold-leaf` | Tanjore gold leaf: Trimurti card frames only |
| `--yuga-satya` | Satya's grade: dawn light |
| `--yuga-satya-sky` | Satya's sky above the horizon |
| `--yuga-treta` | Treta's grade: midday light |
| `--yuga-treta-sky` | Treta's sky |
| `--yuga-dvapara` | Dvapara's grade: dusk light |
| `--yuga-dvapara-sky` | Dvapara's sky |
| `--yuga-kali` | Kali's grade: night |
| `--yuga-kali-sky` | Kali's sky |
| `--yuga-pralaya` | Pralaya's grade: the cosmic ocean |
| `--yuga-pralaya-sky` | Pralaya's sky |
| `--title-font` | Inter Tight: headlines, labels, card names (weight via `font-weight`) |
| `--body-font` | Baloo 2: body, Katha text, every Devanagari string |
| `--tamil-font` | Baloo Thambi 2: Tamil names |
| `--pop` | overshoot easing |
| `--unfurl` | easing for a scroll or banner unrolling |

## Look

`--look-*` tokens in the `:root` of `src/screens/shared.css`, beside the palette; `src/view/look.ts` reads them as `LOOK`
(`--look-misregister-px` is `LOOK.MISREGISTER_PX`). Hues come from the palette; these numbers say how much of the old
printed page you see. Plain numbers, the unit the name's last word (`px`, `ms`); no unit is a strength or 0..1 amount.

| Name | Use |
|---|---|
| `--look-grain` | fine paper grain over the battlefield |
| `--look-warm-cast` | a faint warm (sky-cream) cast over the battlefield |
| `--look-halftone` | a faint halftone in large flat areas; 0 is off |
| `--look-halftone-dot-px` | the halftone's dot pitch |
| `--look-depth-haze` | haze on a lane's far layers |
| `--look-grade-mix` | how strongly the yuga grade tints the lanes |
| `--look-vignette` | the frame-edge vignette at the page's edges |
| `--look-misregister-px` | entering Kali Yuga, how far the colour plates slide apart |
| `--look-misregister-ms` | and how long until they snap back |

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
| `points` | PLACEHOLDER `points n`: collecting it scores n points |

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

| Kind | Use |
|---|---|
| `thing` | PLACEHOLDER `thing "id" name= r= paint="--token" { reward words }`, in `content/things.kdl` |

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
| `title` | PLACEHOLDER: name, score, what's left of the batch, collect and new-game buttons, best score |
