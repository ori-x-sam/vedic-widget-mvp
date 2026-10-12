# Vocabulary catalog

Every piece of shared vocabulary, where it lives, and one line on how to use it. `src/catalog.test.ts` fails when
this file and the code disagree, so a new word lands here in the same commit as its code.

Homes:

| Vocabulary | Home |
|---|---|
| Engine elements and properties | `src/decl/` (pure core `css.ts` + Pixi half `engine.ts`) |
| Game CSS properties, custom elements | `src/screens/shared.ts` (the only module calling `defineProp` / `defineElement`) |
| Shared prefabs | `src/screens/shared.kdl`, styled in `src/screens/shared.css` |
| Palette (UI and 3D) | `:root` of `src/screens/shared.css`, read by the shell through `src/tokens.ts` |
| Look numbers (light, camera, exposure) | `--look-*` tokens in the `:root` of `src/screens/shared.css`, read by the shell through `src/view/look.ts` |
| Behaviour words (the hidden marks) | `REWARDS` in `src/rewards.ts` |
| Content kinds, their words and effects | zod schemas in `src/content.ts`, data in `content/*.kdl` |
| Surfaces (floor and wall materials) | `src/view/surfaces.ts` |
| Sets (what a day place is built on) | `src/view/sets.ts` |
| Instruments (what sounds are made of) | `src/audio.ts` |
| Screens and their stacking | `src/runtime.ts` (import order = draw order) |
| Modelling words | `models/kit.py` (the only module model scripts import) |

## Tweak map

Where each kind of change lives in this game, beyond the game-bible's own rows. Nothing a designer tweaks lives in `.ts`
except where marked.

| Change | Home |
|---|---|
| A room, its jaalis, props and lamps; a door; a spot and what it says and does | `content/night<n>.kdl` |
| A day's scenes, places, beats, lines and choices | `content/day<n>.kdl` |
| Bhima's round | `patrol` in `content/night<n>.kdl` |
| A hint, and when it comes | `hint` in `content/night<n>.kdl` |
| What proves a night: its questions and answers, its reveal and question | `deduction` in `content/night<n>.kdl` |
| The cast and their dialogue colours | `content/cast.kdl` (names) and `--<id>` palette tokens; the `.who-<id>` rule in `screens/talk.css` |
| An item, a recipe, a clue, a stock line (the controls card too) | `content/things.kdl` |
| A sound | `content/sounds.kdl` |
| A model's hues | `content/models.kdl`; its shape, `models/<id>.py` |
| An ending's card | `content/endings.kdl` |
| A surface's colours | palette tokens (`--marble`, `--sandstone`...); its pattern, `src/view/surfaces.ts` |
| The moon's height and bearing on a night | `night ... moon-alt= moon-az=` |
| The night's length, the knock, Bhima's eyes and pace, costs of wrong guesses, the marks' thresholds | `src/tuning.ts` |
| Where a day set's scenery stands (the jungle road's trees, the verandah's arches) | `src/view/sets.ts` (**drift**: layout in a set builder; to move into content when a second set needs it) |

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
`steps()`. Text properties inherit; `flex-shrink` defaults to 0. `var(--touch-size)` is a finger-sized target.

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
| `font-family` | `var(--title-font)` or `var(--body-font)` |
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
| `meter` | `meter value=(bind)"fill"`: a fill of `w * value` (0..1), coloured by `tint` (the doe's timer) |
| `watch` | `watch minutes=(bind)"min"`: Thistlewood's pocket watch, hands at that many minutes after midnight |
| `patta-border` | fills its box with a pattachitra border (red band, ochre rules, petal teeth): the casebook's page |

## Shared prefabs

Build them with the binding builders exported from `screens/shared.ts`.

| Prefab | Use |
|---|---|
| `btn` | `btn(label, tap, state?, key?)`; state `primary` / `off` |
| `row` | `row(label, tap, state?, key?)`: a line in a list (the casebook's tabs and index, the deduction's options); state `on` / `new` / `off` |

## Palette

UI colours, the two lights, surfaces, things, beasts and the cast. Models name these for their four materials
(`content/models.kdl`), people for their name in dialogue (`content/cast.kdl`); a guard test checks every one exists.

| Token | Use |
|---|---|
| `--ink` | the darkest background; cards |
| `--scrim` | the dark behind overlays and dialogue |
| `--paper` | the casebook's foxed paper; light text |
| `--paper-shade` | a chosen row on the paper |
| `--pencil` | ink on the casebook's paper |
| `--ink-faded` | the narrator's prose |
| `--patta-red` | the pattachitra border's red band; the casebook's headings |
| `--patta-ochre` | the border's ochre rules; thoughts; choices |
| `--prompt` | interaction prompts and the eye's dot |
| `--dim` | secondary text |
| `--wrong` | red when something is wrong: Bhima has seen you, the doe's timer |
| `--pop` | overshoot easing |
| `--title-font` | headings: a period serif (IM Fell English SC) |
| `--body-font` | body text (IM Fell English) |
| `--odia-font` | Odia script (Noto Sans Oriya) |
| `--moon` | the moon: the night's key light, shafts, stars, titles |
| `--night-sky` | the night sky; the clear colour at night |
| `--shadow` | blue-black shadow: the fill's ground, the haze |
| `--flame` | the flame: lamps, diyas, the candle, the lantern |
| `--dynamo` | the dynamo's bulbs (Night 5) |
| `--sun` | the day's sun |
| `--day-sky` | the day sky |
| `--dusk-sun` | the low sun on the verandah |
| `--dusk-sky` | the dusk sky |
| `--jungle` | the sal jungle around the palace, at night |
| `--sal-bark` | sal trunks |
| `--sal-leaf` | sal canopy; the day's grass |
| `--marble` | white marble |
| `--marble-vein` | marble's veins |
| `--sandstone` | pink sandstone |
| `--sandstone-dark` | sandstone's joints and carving |
| `--plaster` | lime plaster |
| `--brick` | old brick; the laterite road |
| `--teak` | teak |
| `--teak-dark` | dark teak: frames, shields, the camera |
| `--brass` | brass |
| `--brass-new` | brass fresh from the engraver (the man-eater's plaque) |
| `--iron` | iron |
| `--gilt` | gilt frames |
| `--silver` | silver frames |
| `--glass-eye` | a trophy's glass eyes; tusks |
| `--mirror` | a mirror's glass |
| `--crystal` | chandelier crystal |
| `--linen` | Thistlewood's linen; his name in dialogue |
| `--jute` | jute string and rope |
| `--punkah-cloth` | the punkah's faded red |
| `--curtain` | the alcove's curtain |
| `--velvet` | velvet under the photographs |
| `--rug` | a rug's field |
| `--rug-border` | a rug's border |
| `--trunk-canvas` | the steamer trunk's canvas |
| `--trunk-leather` | the trunk's straps |
| `--oleograph` | the calendar's print |
| `--ledger` | ledger bindings |
| `--portrait` | the old Raja's portrait canvas |
| `--canvas` | the jeep's seats |
| `--cane` | cane furniture |
| `--cushion` | cushions |
| `--jeep` | the jeep's olive paint |
| `--tiger` | tiger fur |
| `--tiger-stripe` | tiger stripes |
| `--old-skin` | moth-eaten old skins |
| `--leopard` | leopard fur |
| `--boar` | boar bristle |
| `--gaur` | gaur hide |
| `--bear` | bear fur |
| `--chital` | the doe's coat |
| `--chital-dark` | the doe's legs and back |
| `--raja` | the Raja's name in dialogue |
| `--ghatak` | Mr. Ghatak's name |
| `--mrs-ghatak` | Mrs. Ghatak's name |
| `--sahukar` | Mr. Sahukar's name |
| `--mrs-sahukar` | Mrs. Sahukar's name |
| `--bhima` | Bhima's name |
| `--jagu` | Jagu's name |
| `--dewan` | the Dewan's name |
| `--kotwal` | Kotwal's name |
| `--pomfret` | Major Pomfret's name |
| `--skin-raja` | the Raja's skin |
| `--skin-ghatak` | Mr. Ghatak's skin |
| `--skin-mrs-ghatak` | Mrs. Ghatak's skin |
| `--skin-sahukar` | Mr. Sahukar's skin |
| `--skin-mrs-sahukar` | Mrs. Sahukar's skin |
| `--skin-bhima` | Bhima's skin |
| `--skin-thistlewood` | Thistlewood's hands |
| `--achkan` | the Raja's achkan (and his father's, in the portrait) |
| `--safa` | the Raja's safa |
| `--jewel` | the jewel on his safa |
| `--ghatak-suit` | Mr. Ghatak's cream suit |
| `--moustache` | black hair and moustaches |
| `--mrs-ghatak-sari` | Mrs. Ghatak's sari |
| `--sari-border-dark` | its dark red border |
| `--sahukar-suit` | Mr. Sahukar's suit |
| `--topi` | a sola topi |
| `--cigar` | a cigar's lit end |
| `--mrs-sahukar-sari` | Mrs. Sahukar's pale sari |
| `--sari-border` | its hot pink border |
| `--bhima-cloth` | Bhima's white dhoti and kurta |
| `--bhima-turban` | Bhima's red turban |
| `--skin-malati` | Malati's skin |
| `--white-sari` | Malati's white sari |
| `--grey-hair` | Malati's grey hair |
| `--fresco` | the Sheesh Mahal fresco's painted figures |
| `--slate` | the schoolroom slate |
| `--wallpaper` | the Durbar Wing's wallpaper |
| `--wallpaper-stripe` | its stripes and lilies |
| `--baize` | billiard baize |
| `--ivory` | billiard balls, piano keys |
| `--marble-bust` | Mr. Gladstone |
| `--file-board` | file boxes |
| `--clay` | the chulha's clay |
| `--soot` | soot and char |
| `--turmeric` | turmeric in the spice box |
| `--ash` | the ash pit |
| `--velvet-red` | the gaddi's velvet |
| `--wax` | wax cylinders |
| `--tin-green` | Bhima's tin trunk |
| `--rust` | rusted iron: sluice wheels, Sudam's rifle |
| `--well-water` | the stepwell's black water |
| `--pomfret-suit` | Mr. Pomfret's tropical suit |
| `--skin-pomfret` | Mr. Pomfret |
| `--pomfret-hair` | Mr. Pomfret's hair |
| `--cummerbund` | crimson-and-gold dinner silk |

## Look

`--look-*` tokens in the `:root` of `src/screens/shared.css`, beside the palette; `src/view/look.ts` reads them as `LOOK`
(`--look-moon-light` is `LOOK.MOON_LIGHT`). Hues come from the palette; these numbers say how much of them you see.
Plain numbers, the unit the name's last word (`u`, `s`, `deg`, `px`, `hz`); no unit is a strength or 0..1 amount.

| Name | Use |
|---|---|
| `--look-exposure` | tone-mapping exposure at night |
| `--look-dusk-exposure` | exposure at dusk |
| `--look-day-exposure` | exposure by day (close to overexposed) |
| `--look-moon-light` | the moon's strength through each jaali |
| `--look-moon-shaft` | how visible a moonlight shaft is in the haze, 0..1 |
| `--look-haze` | the night air's haze (fog density) |
| `--look-fill-light` | the cold fill that keeps shadows blue-black |
| `--look-flame-light` | a lamp's strength |
| `--look-flame-reach-u` | how far a lamp's pool reaches |
| `--look-candle-light` | the candle stub's strength |
| `--look-candle-reach-u` | how far the candle reaches |
| `--look-lantern-light` | Bhima's lantern's strength |
| `--look-lantern-reach-u` | how far the lantern reaches |
| `--look-bulb-light` | a dynamo bulb's strength |
| `--look-bulb-reach-u` | how far a bulb reaches |
| `--look-flicker` | how much flames flicker, 0..1 |
| `--look-sun-light` | the day's sun |
| `--look-sun-dir` | `x y z` towards the sun |
| `--look-dusk-light` | the dusk sun |
| `--look-camera-fov-deg` | the eye's field of view |
| `--look-eye-height-u` | the eye's height |
| `--look-bob-u` | the walk's head bob |
| `--look-bob-hz` | steps per second of the bob |
| `--look-mouse-deg-px` | degrees the eye turns per pixel of mouse |
| `--look-flash-s` | how long the camera's flash lasts |

## Behaviour words

The two hidden marks. Written as props on any beat word, choice, line or spot word (`suspicion=1 regard=-2`); what
reads them (a second bolt at 5, the midnight shikar at the peak) is in conditions and `tuning.ts`.

| Word | Use |
|---|---|
| `suspicion` | `suspicion=n`: the Raja's suspicion rises by n (falls, if negative) |
| `regard` | `regard=n`: Bhima's regard rises by n (falls, if negative) |

## Content kinds

One file per day and per night (`content/day1.kdl`, `content/night1.kdl`), plus the cast, things, sounds, models and
endings. Within a file ids are unique across kinds; across files, within a kind. Each kind's header comment in its
file lists its words.

| Kind | Use |
|---|---|
| `person` | `person "id" name= short= paint="--token" sound=`: someone who speaks; `narrator` and `thistlewood` are people too |
| `item` | `item "id" name= blurb=`: something for the pockets |
| `recipe` | `recipe "id" from="a b" makes="item" says= sound= clue=`: two items put together make a third (and may tell him something) |
| `clue` | `clue "id" page="evidence|photograph|testimony|note" title= text=`: a casebook entry |
| `remark` | `remark "id" text=`: Thistlewood's stock line for a touch with no script (`wrong-item`, `nothing`, `photo-plain`, `code-wrong`, `combine-no`, `deduction-wrong`); `{name}` is the spot's name |
| `sound` | `sound "id" play="instrument" hz= gain= len= times= gap=`: a sound, from one instrument |
| `model` | `model "id" body="--token" trim= cloth= glow= scale=`: a model file and the hues of its four materials |
| `scene` | `scene "id" day= place= first="beat" name="Day 1 — The Drive In"`: a day scene (the name is its title card) |
| `place` | `place "id" set= light="day|dusk|night" { place words }`: where a scene happens |
| `beat` | `beat "id" scene= timer-s= timeout="beat" { beat words }`: lines, then choices or what comes next |
| `night` | `night "id" n= name= moon= moon-alt= moon-az= start="room" at= turn= proves="deduction" then="scene" caught="scene" { night words }` |
| `room` | `room "id" night= name= x= z= w= d= h= y= open= floor="surface" walls="surface" dark= { room words }`: a room on the floor plan, centre and size in metres; `y` its floor's height, `open` no ceiling |
| `door` | `door "id" name= from="room" wall= at= to="room" w= h= open= arch=`: a door in a wall of `from`, onto `to` |
| `spot` | `spot "id" room= name= at="x z" y= r= model= turn= solid= { spot words }`: something to touch, photograph, work, hide in or sleep on |
| `patrol` | `patrol "id" night= who= speed= if= { stop "room" at= wait= }`: a watchman's round, looping; only on nights its `if` holds at the start |
| `hint` | `hint "id" night= until="condition" after-s= text=`: a thought, after that long without progress while `until` doesn't hold |
| `deduction` | `deduction "id" night= title= reveal= question= { ask ... }`: the casebook page that proves the night |
| `ending` | `ending "id" title= text=`: an end card |

## Place words

| Word | Use |
|---|---|
| `sits` | `sits "who" at="x z" turn= y= model=`: a person in the set (their model is their id unless named) |
| `prop` | `prop "model" at= turn= y= if=`: a model in the set, shown while `if` holds |
| `eye` | `eye at= y= turn=`: where the player's eye is (none: it stays where it was) |

## Beat words

| Word | Use |
|---|---|
| `line` | `line "who" "text"` + effects: someone speaks; a line with `if=` is skipped when it doesn't hold |
| `choose` | `choose "text" go="beat"` (or `ends=`) + effects: a choice |
| `does` | `does` + effects: effects as the beat reaches it, no text |
| `go` | `go "beat" if=`: after the last line (no choices), the first `go` or `ends` that holds |
| `ends` | `ends "night|back-to-room|resume|morning|ending" ending="id" if=`: the scene ends (`resume`: back to walking the wing) |

## Night words

| Word | Use |
|---|---|
| `begins` | effects when the night starts |
| `on-caught` | effects when Bhima walks him back |
| `when` | `when if=... "text"` + effects: fires once, by itself, the moment its condition holds |

## Room words

| Word | Use |
|---|---|
| `jaali` | `jaali wall= at= w= h= y= moon=`: a pierced stone window; the moon shines through it when it faces the moon |
| `transom` | `transom wall= at= w= h= y=`: a jaali over a door |
| `prop` | `prop "model" at= turn= y= solid= if=`: scenery; `solid` blocks walking within that radius; shown while `if` holds |
| `lamp` | `lamp at= y= kind="diya|hanging|candle|bulb" if=`: a flame's amber pool (`bulb`: the dynamo's light), lit while `if` holds |

## Spot words

The first word whose condition holds answers a touch, in file order, so write the particular before the general.

| Word | Use |
|---|---|
| `look` | `look "text"` + effects: touched with empty hands |
| `use` | `use "item" "text"` + effects: touched with that item in hand |
| `photo` | `photo "text"` + effects: photographed |
| `code` | `code "faces" dials= answer= learns="spots" wrong="text" "text"` + effects: dials; the right order fires it; `learns` names the spots that teach it; `wrong` is what a wrong turn says |
| `hide` | `hide "text"`: out of the watchman's sight until he moves |
| `bed` | `bed "text"`: ends the night, once its deduction is proved |
| `talk` | `talk "scene" "text"` + effects: begins a scene with someone met in the wing; it ends with `ends "resume"` |
| `pose` | `pose if= at= turn= y=`: where the spot stands once the condition holds |

## Deduction words

| Word | Use |
|---|---|
| `ask` | `ask "text" options="a | b" answer= from="clues"`: a question, open once its clues are in |

## Effect words

Props on any beat word, choice, line or spot word.

| Word | Use |
|---|---|
| `if` | the condition this beat needs (see Conditions) |
| `gives` | items into the pockets |
| `takes` | items out of the pockets (used up) |
| `sets` | flags set |
| `unsets` | flags cleared |
| `clue` | clues into the casebook |
| `opens` | doors opened |
| `closes` | doors shut |
| `sound` | a sound played |
| `suspicion` | behaviour word: the Raja's suspicion |
| `regard` | behaviour word: Bhima's regard |
| `once` | `once=#true`: fires once, then the next word answers |
| `minutes` | watch minutes it costs |
| `adds` | counters raised by one (`adds="slots"`: a day's engagement spent) |
| `resets` | counters back to nought |

## Conditions

`if="a b c"`: every term must hold.

| Term | Holds when |
|---|---|
| `flag` / `!flag` | the flag is set / isn't (`seen:spot` is set when a spot is first touched or photographed) |
| `has:item` | the item is in the pockets |
| `knows:clue` | the clue is in the casebook |
| `suspicion>=n` | the Raja's suspicion is at least n (also `<=`, `>`, `<`; and `regard`) |
| `slots<n` | a counter (any name `adds` raises) compared the same way |
| `after:1:30` / `!after:1:30` | the pocket watch has passed 1:30 a.m. / hasn't (the moon at a height) |

## Content helpers

| Helper | Use |
|---|---|
| `loadKdl` | `loadKdl(src, { kind: schema })`: KDL to validated records, errors name node and field |
| `combinators` | `combinators(registry, what)`: a node's children as behaviour/effect words |
| `tunedText` | `tunedText(T)`: `{A.b}` in a string quotes a tuning value  |

## Surfaces

What a room's `floor=` and `walls=` name. Painted from the palette.

| Surface | Use |
|---|---|
| `marble` | white marble with grey veins, in flagstones |
| `sandstone` | pink sandstone in courses |
| `plaster` | lime plaster, damp low down |
| `brick` | old red brick laid flat |
| `mirror` | mirror mosaic in white plaster: the Sheesh Mahal |
| `wallpaper` | Edwardian lily-stripe wallpaper, peeling off the sandstone: the Durbar Wing |
| `teak` | teak boards |

## Sets

What a `place`'s `set=` names.

| Set | Use |
|---|---|
| `jungle-road` | the drive in: a road through sal, rolling while the jeep moves (it stops while `doe-showing` is set), a hill for the doe |
| `verandah` | the verandah at dusk: marble, cusped arches on sandstone piers, the jungle below the ridge |
| `wing` | tonight's wing, built from its rooms (the place gives the light) |

## Instruments

What a `sound`'s `play=` names (`src/audio.ts`).

| Instrument | Use |
|---|---|
| `knock` | knuckles on teak |
| `thud` | a soft body sound: footsteps |
| `noise` | filtered noise: a match, a page, crickets (long ones pulse) |
| `howl` | jackals: rising, wavering yips |
| `roar` | a tiger, far off |
| `bell` | small bells: ghungroo |
| `chime` | a clock's bell |
| `click` | metal on metal: locks, a shutter, dials |
| `laugh` | "ha", through a nose |
| `sniff` | breath drawn up through the nose |
| `puff` | a cigar, a harrumph, a snuffed candle |
| `flutter` | a handkerchief |
| `shot` | a rifle and its echo off the hills |
| `drone` | a tanpura-like drone |
| `creak` | wood under strain |
| `scrape` | something dragged: a bolt, a trunk, brakes |
| `whistle` | a mynah |
| `tone` | a bowed tone rising a fifth: a thing proved |

## Modelling kit

Words in `models/kit.py` for model scripts (`from kit import *`). Blender +X is forward, +Z up, 1 unit = a metre. The rig contract (materials `body` `trim` `glow` `cloth`; an `idle` clip, plus any named clips; one `rig` root) is in the header of `models/kit.py`. Colour is value only; hue comes from `content/models.kdl`.

| Word | Use |
|---|---|
| `lathe` | `lathe(name, [(r, z), ...], mat, seg)`: a body of revolution around Z |
| `slab` | `slab(name, [(x, y), ...], depth, mat, bevel)`: an outline extruded and bevelled: shields, plates, ears |
| `box` | `box(name, (x, y, z), mat, bevel)`: a bevelled box, centred |
| `ball` | `ball(name, r, mat, seg, rings)`: a UV sphere |
| `cone` | `cone(name, r1, r2, depth, mat, seg)`: along +Z; r2 = r1 is a cylinder, 0 a spike |
| `torus` | `torus(name, R, r, mat)`: a ring in the XY plane |
| `tube` | `tube(name, [(x, y, z), ...], radii, mat, seg)`: a tube swept along points: limbs, ropes, horns, tusks |
| `at` | `at(ob, loc, rot_degrees, scale)`: place a shape |
| `aim` | `aim(ob, direction, loc)`: point a shape's +Z along a direction |
| `deform` | `deform(ob, fn)`: move every vertex: taper, bulge, bend |
| `rough` | `rough(ob, amp, freq, seed)`: push vertices along their normals by noise: moth, fur, curtain folds |
| `smooth` | `smooth(ob, levels)`: subdivide |
| `shell` | `shell(ob, thickness)`: give an open surface thickness |
| `cut` | `cut(ob, keep)`: delete faces whose centre fails `keep` |
| `fuse` | `fuse(name, *shapes, voxel, keep)`: melt shapes into one organic mesh |
| `carve` | `carve(ob, *cutters)`: boolean-cut the cutters' volumes out |
| `sphere_dirs` | `sphere_dirs(n, zmin)`: evenly spread directions |
| `part` | `part(name, *shapes, pivot, parent)`: merge shapes into one moving rig part |
| `key` | `key(part, clip, [(s, {loc, rot, scale}), ...])`: key a clip relative to rest |
| `loop` | `loop(part, period, n, steps, phase, loc=, rot=, scale=)`: a sine idle loop: breathing, a flame |
| `spin` | `spin(part, clip, period, turns, axis)`: a constant spin |
| `still` | `still(part, clips)`: scenery's `idle`, an imperceptible settle |
| `burst_apart` | `burst_apart(parts, dur, fling, rise)`: parts fly out, tumble, shrink |
| `export` | `export(__file__)`: paint the vertices (value only), check the rig contract, write the .glb |
| `figure` | `figure(height, girth, belly, shoulders, head, seated, skirt, hat, arms, hair)`: a theatre-poster person, readable by silhouette: hats `safa` `topi` `turban` `bun`; arms `down` `lap` `lantern` `wheel` |

## Screens

In draw order (later on top). Each is `screens/<name>.kdl` + `.css` + `.ts` (bindings only).

| Screen | Use |
|---|---|
| `hud` | the night: the eye's dot, what E would do, his last remark or thought, what he holds, the pocket watch, the red edge when seen |
| `talk` | a scene's lines and choices (the doe's timer) |
| `casebook` | the notebook: evidence, plates, testimony, notes, thoughts, pockets (hold, put together), the case (the deduction) |
| `dials` | a lock of dials: turn each, try the handle |
| `card` | a title card, a night's reveal and question, an ending |
| `title` | the name, Begin, and Continue from the last save |
