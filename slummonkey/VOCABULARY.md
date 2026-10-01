# Vocabulary catalog

_Generated from `src/rules/vocab/registry.ts` by `npm run catalog`. Do not edit by hand._

Every behaviour in `content/*.kdl` is one of these 84 words. Syntax: `word positional-args prop=value { child words }`.
Units: px, px/s, seconds, degrees. x/y accept `player`, `me`, `left`, `right`, `center`, `random`, `far`, `near` (and y: `floor`, `top`). Numbers are relative to the camera.

## Flow

| word | arguments | what it does | used by |
|---|---|---|---|
| `at-scroll` | `x:px { words }` | Wait until the camera has scrolled to x, then run the children (shmup waves). | — |
| `at-x` | `x:px { words }` | Wait until the player reaches level x, then run the children (run-and-gun triggers). | 1 script |
| `card` | `text [sub=text] [dur=s]` | Show a title-card banner (styled by .banner in look/hud.css) and wait for it. | 1 script |
| `despawn` | — | Remove me from the stage quietly. | 3 scripts |
| `every` | `secs:s [first=s] { words }` | Start a background loop that runs the children every N seconds for the rest of the phase. | — |
| `loop` | `[times:int] { words }` | Repeat the child words (forever if no count). | 18 scripts |
| `par` | `{ words }` | Run each child word at the same time; finish when all finish. | 2 scripts |
| `pick` | `{ words w=weight }` | Run one child word chosen at random (prop w= weights it). | 2 scripts |
| `say` | `who text [dur=s] [block=#false]` | Pop a speech bubble over the speaker (in-fight banter). | 12 scripts |
| `seq` | `{ words }` | Run child words one after another. | 2 scripts |
| `sfx` | `name` | Play a named sound effect at my position. | — |
| `theme` | `id` | Switch the music theme (content/music.kdl). | 1 script |
| `wait` | `secs:s` | Do nothing for a while. | 18 scripts |
| `wait-clear` | `[kind=minion] [max=s]` | Wait until every minion (or a given minion kind) is gone. | 1 script |
| `win` | — | End the stage as a victory (level goals). | 1 script |

## Movement

| word | arguments | what it does | used by |
|---|---|---|---|
| `cartwheel` | `speed:px/s [dur=s]` | Roll along the floor spinning, bouncing off the walls. | 1 script |
| `charge` | `speed:px/s [to=far]` | Dash across the stage toward the far wall (or a target x). | 3 scripts |
| `climb` | `height:px speed:px/s` | Climb straight up (ropes, ladders, stacks). | 1 script |
| `drop` | — | Fall to the floor under gravity and land with a bump. | 1 script |
| `face` | — | Turn to face the player. | — |
| `fly-path` | `shape [dur=s] [amp=px]` | Fly a shmup path: sine, dive, loop or straight (moves left across the camera). | 3 scripts |
| `follow` | `speed:px/s [dur=s] [fly=#true]` | Chase the player's x (and y when flying). | 3 scripts |
| `hop` | `height:px count:int [air=s]` | Jump toward the player a few times, landing with a thud. | 6 scripts |
| `hover` | `amp:px period:s [dur=s]` | Bob up and down in place. | 4 scripts |
| `move-to` | `x y [dur=s]` | Glide to a point (x/y may be player, left, right, center, random, far, near). | 8 scripts |
| `orbit` | `radius:px speed:rad/s [dur=s]` | Circle around where I am now. | — |
| `patrol` | `x1 x2 speed [dur=s]` | Walk back and forth between two x positions. | 1 script |
| `scroll` | `dx:px/s dy:px/s` | Set the camera auto-scroll speed (shmup, vertical climb); I travel with the camera. | 2 scripts |
| `teleport` | `x y` | Vanish in a puff and reappear somewhere else instantly. | 1 script |
| `zip` | `speed:px/s [dur=s]` | Pinball around the stage, bouncing off walls, floor and ceiling. | 1 script |

## Attacks

| word | arguments | what it does | used by |
|---|---|---|---|
| `beam` | `dur:s [warn=s] [angle=deg\|player] [width=px] [proj=beam]` | Telegraph a thin line, then hold a long beam (lasers, water jets, rocket trails). | 1 script |
| `candles` | `count [warn=s] [red=0..1]` | Candlestick pillars erupt from the floor: red ones hurt, green ones are platforms. | 1 script |
| `graph-shot` | `shape count proj [speed=] [len=px]` | Lay bullets along a chart curve (pump-dump, rug, moon) and send it sliding at the player. | 1 script |
| `homing` | `count proj [turn=deg/s] [speed=]` | Release projectiles that steer toward the player. | 3 scripts |
| `juggle` | `count proj dur:s [speed=]` | Juggle props over my head, then fling them at the player one by one. | 3 scripts |
| `lob` | `count proj [air=s] [spread=px] [gap=s]` | Throw arcing projectiles that land around the player. | 2 scripts |
| `rain` | `count proj [width=px] [speed=] [gap=s] [warn=s]` | Drop projectiles from the ceiling across a strip around the player. | 3 scripts |
| `ring` | `count speed proj [offset=deg]` | Burst projectiles out in a full circle. | 3 scripts |
| `shockwave` | `dir speed [proj=shockwave]` | Send one shockwave along the floor (dir -1 left, 1 right, 0 toward player). | — |
| `shoot` | `proj speed [angle=deg] [from=front]` | Fire one projectile (at the player unless an angle is given). | 4 scripts |
| `spiral` | `arms dur:s [rate=/s] [speed=] [turn=deg/s] proj` | Spin out arms of projectiles like a pinwheel. | 1 script |
| `spray` | `dur:s arc:deg proj [rate=/s] [speed=] [burst=n] [pause=s]` | Sweep projectiles across an arc in bursts with jumpable gaps (trunks, hoses, card fans). | 5 scripts |
| `stomp` | `windup:s count:int [proj=shockwave] [speed=]` | Raise up, slam the floor, and send shockwaves both ways along it. | 2 scripts |
| `summon` | `minion count [from=right\|left\|top\|me\|floor] [gap=s] [x=] [y=]` | Bring minions onto the stage (they run their own words from content). | 4 scripts |
| `volley` | `count spread:deg speed proj [from=]` | Fire a fan of projectiles aimed at the player. | 9 scripts |

## Telegraphs

| word | arguments | what it does | used by |
|---|---|---|---|
| `drumroll` | `dur:s` | Ta-da drumroll with a building shake: something big is coming. | 3 scripts |
| `flash` | `dur:s` | Flash bright white. | — |
| `ground-mark` | `x [dur=s] [block=#true]` | Paint a target circle on the floor where something will land. | — |
| `pose` | `name` | Set my animation pose (see look/ and art/ for the frames). | — |
| `shake` | `amount [dur=s]` | Shake the camera. | 1 script |
| `spotlight` | `[dur=s]` | Swing a stage spotlight onto me (a tell that I'm about to act). | 1 script |
| `warn-line` | `axis:x\|y pos [dur=s] [block=#true]` | Draw a danger stripe across the stage at a column or row. | — |
| `windup` | `dur:s [pose=name]` | Hold an anticipation pose (squash down) before an attack. | 11 scripts |

## State & illusions

| word | arguments | what it does | used by |
|---|---|---|---|
| `appear` | — | Become fully visible again. | — |
| `grow` | `scale` | Grow (hitbox too). | — |
| `hide-under` | `count kind` | Hide under N pots/baskets spread across the floor. | 1 script |
| `invisible` | `[alpha=0..1]` | Fade my body out (riders with keep-visible stay seen). | 1 script |
| `invisible-trail` | `kind` | Leave footprints and dust as I move (the only way to track an invisible act). | 1 script |
| `mirror-copies` | `count { words-for-copies }` | Mirror panels spawn copies of me (they run the child words too); only the real me has a reflection. | 1 script |
| `puppet` | `id` | Swap my look to another puppet (transformations). | 1 script |
| `reassemble` | `[flip=#true]` | Pull my pieces back together (optionally upside down). | 2 scripts |
| `reveal` | `[bombs=n] [bonus=kind]` | Lift the pots: some hold bombs, one holds a parryable bonus, and I pop out there. | 1 script |
| `rider` | `kind [keep-visible=#true] [y=px] { words }` | Put someone/something on top of me that follows me and runs its own words. | 3 scripts |
| `shrink` | `scale` | Shrink (hitbox too). | 1 script |
| `shuffle` | `swaps speed:swaps/s [ramp=x]` | Swap the pots around, faster each time. | 1 script |
| `split` | `{ part id hp= x= y= puppet= { words } }` | Come apart into pieces that each have their own HP and their own words. | 2 scripts |
| `stack` | `count [puppet=id]` | Stack up into one tall wobbly form (hits make it sway). | 1 script |
| `stun` | `dur:s [vuln=x]` | Get dizzy: stop moving/attacking and take extra damage for a while. | 1 script |
| `swap-real` | `[dur=s]` | Shuffle me and my copies around (flash of mirrors). | 1 script |
| `target` | `id hp [x=] [y=] { words-on-destroy }` | Attach a shootable sub-part (rope, mirror); when it breaks, I run the children. | 1 script |
| `topple` | — | Fall apart in a heap (stacks, towers). | — |
| `vanish-under-sheet` | `dur:s [to=random\|far]` | A silk sheet drops over me with a drumroll; I reappear somewhere else. | 1 script |

## Parry

| word | arguments | what it does | used by |
|---|---|---|---|
| `bonus` | `kind [x=] [y=] [ttl=s]` | Float a parryable pink bonus in the air. | 2 scripts |
| `parry-every` | `n` | Every Nth projectile I fire is parryable (pink). | 10 scripts |
| `parryable` | `[kind]` | Make me parryable: I turn --parry pink, and slapping me gives the player meter. | 1 script |

## Stage

| word | arguments | what it does | used by |
|---|---|---|---|
| `bg` | `id` | Switch the painted background set (look/stages.css + art/stages). | 3 scripts |
| `buoyant` | `count [w=px]` | Float platforms that ride on the water surface. | 1 script |
| `clear-stage` | `[tag=stage]` | Remove platforms, props and hazards from the stage. | 1 script |
| `coins` | `count [x=] [y=] [arc=px]` | Scatter fake-token coin pickups in an arc. | 2 scripts |
| `flood` | `rate:px/s max:px` | Fill the stage with water from a pot that never empties (water hurts). | 1 script |
| `goal` | `x:px` | Put the finish banner at level x; reaching it wins the stage. | 1 script |
| `platforms` | `count y:px [x0=] [x1=] [w=px] [puppet=]` | Place a row of one-way platforms. | 1 script |
| `ride-platform` | `kind speed:px/s [ride=#true]` | Spin a hazard across the floor whose top you can stand on; I ride it. | 1 script |
| `rising-platforms` | `gap:px [w=px] [puppet=]` | Keep spawning platforms above the camera as it climbs (Indian Rope Trick). | 1 script |

