# Prompt: "Banana Jig" — a 1930s rubber-hose run-and-gun boss demo for mobile (landscape)

Paste everything below the line into a fresh Claude Code session (an empty repo is best). Run it on **Sonnet 5** to stay inside the budget (see section 11). Start a **new session for each milestone**: Claude reads `PROGRESS.md` to pick up where it left off, and a fresh session keeps the context small, which is the biggest cost saver.

---

You are building a **polished, playable one-level demo** of a mobile game that looks, sounds and plays like a 1930s rubber-hose cartoon run-and-gun boss fighter, in the spirit of *Cuphead*. Do not use any Cuphead names, characters, art, music or logos. Everything must be original.

## 1. Platform and tech (these are fixed)

- **Target:** phones in **landscape only**, played in the mobile browser and installable as a PWA (add to home screen, fullscreen, no browser chrome).
- **Stack:** TypeScript + **Phaser 3** + Vite. No backend.
- **Art:** there are no image files. Draw every sprite in code (Phaser Graphics/canvas paths baked to textures at boot), or as inline SVG you author yourself and rasterize at load. Keep it vector-crisp at any DPI.
- **Audio:** generate everything with the Web Audio API: a looping ragtime/big-band style track built from a simple sequencer (walking bass, stride piano chords, a muted-trumpet lead made with square/saw oscillators and filtering), plus SFX. No audio files.
- **Performance budget:** a steady 60 fps on a mid-range 2021 Android phone. Under 150 draw calls, pooled bullets and particles, no allocations inside the game loop.
- **Orientation:** if the phone is held in portrait, show an animated "rotate your phone" card (the monkey tilts his head) and pause. Request `screen.orientation.lock('landscape')` after the first tap, where the browser supports it.
- Handle safe areas and notches with `env(safe-area-inset-*)`. Logical resolution is 1280×720, scaled with letterboxing.

## 2. Story (keep it short and charming)

**Bongo** is a scrappy little organ-grinder's monkey with a red fez, pie-cut eyes, white gloves and a curly tail. He works for the crooked **Ringmaster Rex**, a big barrel-chested gorilla in a top hat, at the **Topsy-Turvy Traveling Circus**. One night Bongo learns that Rex has locked up the whole jungle's banana harvest in the circus vault and plans to sell it back to the animals at triple the price. Bongo swipes the vault key, and the circus comes after him.

The circus has scattered across **the Canopy Line**, an old sky railway that links floating jungle islands above the clouds. Each island holds one of Rex's performers guarding part of the stolen harvest. Bongo commandeers **the Peanut Express**, a little steam train with a banana-crate caboose, and rides it from island to island. **Every area and boss is unlocked by taking the train there** (see section 6b).

Level 1 is the first stop: **Big Top Isle**, with the fight **"Peel Out at the Big Top"** against **Madame Tusk**, the circus's prima-donna elephant performer, in the center ring.

Tell the story in a **storybook intro**: 3 illustrated pages that turn with a page-curl effect, one or two lines of narration per page in a vintage serif font. The player can tap to advance or skip. Show a short post-victory page that sets up the (not included) next boss.

## 3. Visual direction (this is where most of the polish goes)

- **Rubber-hose animation:** limbs bend as smooth curves, not jointed segments. Characters **squash and stretch** on every jump, land and hit. Idle animations bounce to the beat of the music. Animate on "twos" (sprite updates at 12 fps) while motion stays at 60 fps, which gives the hand-drawn feel.
- **Palette:** desaturated, warm, 1930s. Cream, sepia, faded red, mustard, teal and ink black. Characters have thick black ink outlines that vary slightly in width.
- **Film post-processing** (a WebGL pipeline or fragment shader, with a cheaper canvas fallback):
  - animated film grain,
  - soft vignette,
  - slight gate weave (the whole frame jitters sub-pixel),
  - random dust specks and vertical scratches,
  - a subtle sepia/chromatic tint,
  - a toggle for all of this in Settings, for weaker phones.
- **Background:** a circus big top with 3–4 parallax layers. Striped canvas walls, a watercolor-style crowd of animal silhouettes that bob and cheer, swinging lanterns, bunting, and a ring floor. The crowd reacts to big hits.
- **Transitions:** an **iris-in/iris-out** circle wipe between screens. A title card before the fight: "**READY? … GO!**" in bold vintage lettering that bounces in. **"KNOCKOUT!"** on victory, and a torn-paper **"YOU DIED"** card on death that shows a progress bar of how far into the fight you got.
- **Juice:** hit-stop (a freeze of 2–4 frames) on parries and big hits, screen shake with a falloff curve, hit flashes (the boss flashes white on hit, then cream), puffs of ink-smoke on impacts, and little star bursts.

## 4. Controls (mobile touch, landscape)

- **Left thumb:** a floating virtual joystick (it appears where you touch, on the left 40% of the screen). It handles run left/right, duck (down) and 8-way aim.
- **Right thumb:** four buttons in an arc: **Jump** (big), **Shoot** (hold to auto-fire), **Dash**, and **EX/Super**. Show a clear pressed state and fire `navigator.vibrate` on press where it's supported.
- **Lock/aim:** holding a small "lock" button roots Bongo in place so the stick only aims.
- **Parry:** press Jump again in mid-air while touching a **pink** object to parry it. That gives a hit-stop, fills one super card and bounces Bongo up.
- Buttons can be resized and moved in Settings. Keyboard and gamepad also work, for desktop testing.
- Input must feel instant. Include a jump buffer (100 ms) and coyote time (80 ms).

## 5. Player mechanics

- 3 HP (hearts). After a hit: 1.5 s of invulnerability with flicker and a knockback pop.
- **Weapon:** "Banana Blaster." Bongo finger-guns peanut-shell pellets, with a fast fire rate and low damage. It has a muzzle-flash puff.
- **EX shot** (costs 1 card): a spinning banana boomerang that pierces and comes back.
- **Super** (5 cards, full meter): "Barrel of Monkeys." A screen-wide stampede of cartoon monkeys that deals heavy damage, with a short cinematic zoom.
- Super meter: 5 playing cards along the bottom-left that flip over as they fill, from damage dealt and from parries.
- Dash: a quick horizontal burst with an ink-smear trail. It works once in the air.

## 6. Level 1 boss: Madame Tusk (3 phases, about 2–3 minutes for a first clear)

Give the boss a health bar that is **hidden** from the player (as in the genre). The death screen shows progress instead.

**Phase 1: "The Grand Entrance."** Madame Tusk balances on a giant circus ball and rolls back and forth.
- She sprays water arcs from her trunk (lobbed projectiles that splash into small puddles, which linger for 2 s).
- She tosses 3 peanuts in a spread. **Every third peanut is pink and can be parried.**
- She telegraphs every attack with a wind-up pose and a cartoon "!" puff.

**Phase 2: "Tutu Tantrum"** (at 60% HP). The ball pops with a cartoon *BANG*. She stands in a tutu and gets angry.
- **Ground-pound:** she stomps and sends a shockwave along the floor (jump over it).
- **Pirouette:** she spins across the screen (dash through it, or duck under her trunk).
- Circus seals bounce on-screen tossing striped balls as minor enemies. They can be shot.

**Phase 3: "The Finale"** (at 25% HP). A trapeze drops and she swings overhead, crying cartoon tears.
- Her tears fall as rain patterns with safe gaps.
- She swoops down with a trunk grab, telegraphed by her shadow on the floor.
- Spotlight hazards sweep the ring: standing in one makes Bongo "stage-frightened" and slows him briefly.

When she is defeated, she deflates like a balloon, spins around the tent and flops into a heap with stars circling her head. KNOCKOUT! Then the results screen.

Tune every attack so it is **readable and fair**: clear telegraphs (0.5–0.8 s), no unavoidable damage, and patterns that are learnable yet slightly randomized. Aim for a difficulty that a first-time player beats in 3–8 attempts.

## 6b. The Canopy Line: train hub and ride (how areas unlock)

The train is the level select, and riding it is part of the game. It uses the same 1930s cartoon style and film filter as the fight. Keep it **2D, side-on, with deep parallax**. Do not build it in 3D: 3D would blow the budget.

**Station and map screen ("Banana Junction").**
- Bongo's hideout island is a small station platform with a ticket booth, a swaying lantern and the Peanut Express puffing idle smoke.
- A **route map** is drawn like a vintage railway poster: islands linked by dotted rail lines over clouds.
  - **Big Top Isle** is open.
  - Two more islands (**Coconut Cove** and **Thunder Falls**) show as padlocked silhouettes with a "Track under repair — coming soon!" sign. Tapping one plays a small shake and a locked sound.
- Tap an open island, then **"All Aboard!"** Bongo hops in, the conductor's whistle blows, and the scene cuts to the ride.
- Save progress in `localStorage`: which islands are unlocked or beaten, the coin total and the best grades. Beating Madame Tusk marks Big Top Isle with a gold star. In the demo, the next island stays locked with a teaser card.

**The ride (60–90 s, light and relaxing, and it can't be lost).**
- **Scene:** a side view of the train on a curving rail trestle above a sea of clouds. Floating islands drift past in 4–5 parallax layers, with birds, distant hot-air balloons and a sunset-to-dusk color shift. Rubber-hose passengers bob in the windows. The wheels and rods animate with the speed, and the smoke puffs scale with the throttle.
- **HUD:** it copies the layout of a cozy train sim, restyled as 1930s ticket-stub and brass-gauge UI:
  - top-left: a destination pill ("To Big Top Isle") and a coin counter;
  - bottom center: a route progress bar ("Banana Junction ——●—— Big Top Isle") and a speed gauge in km/h;
  - bottom right: big **Power** and **Brake** buttons.
- **Gameplay:**
  - Hold Power to speed up and Brake to slow down.
  - Speed-limit signs show up before sharp curves. Take a curve too fast and passengers get jostled, which lowers a "passenger comfort" percentage.
  - Bananas float along the track. Tap them, or catch them at the right speed, for coins.
  - When you arrive you get a bonus: "+75 coins, 92% comfort."
  - You can't fail. The worst outcome is fewer coins.
- **Arrival:** the train pulls into a circus-themed station, iris-out, and the fight's "READY? GO!" card plays.
- **After the fight:** a short ride back (30 s, skippable) to the station, where the next island now shows its teaser.

**What coins buy (keep this tiny).** One purchase at the station ticket booth: a **"Lucky Peel" charm** for 150 coins that gives +1 max HP in the fight. Beyond that, coins only count toward the results grade.

## 7. Screens and flow

1. **Boot and title screen:** an animated logo "BANANA JIG" on a curtain backdrop. Bongo dances to the music. Buttons: *Start*, *Settings*.
2. **Storybook intro** (skippable, only on the first play).
3. **Banana Junction station and map**, then the **train ride** to Big Top Isle.
4. **"READY? GO!"** leading into the fight.
5. **Pause menu** (a pause button at the top center, and it auto-pauses on blur or visibility change): Resume, Retry, Settings, Quit.
6. **Death screen** with a progress bar and instant retry (retry to gameplay in under 1 s; retrying never replays the train ride).
7. **Victory results:** time, HP left, parries, super meter used, and a letter grade (A+ to D) stamped on with a thunk. Store the best grade in `localStorage`.
8. **Settings:** music/SFX volume, film effects on/off, screen shake on/off, button layout editor, vibration on/off.

## 8. Audio details

- The music loop is about 90 s at 180 bpm, in a swing feel. It gets more intense in phase 3 (extra drum layer and higher tempo). A short jingle plays for KNOCKOUT! and another for death.
- SFX: train whistle, chuffing that follows the throttle, brake squeal, coin pickup, pellet fire, hit tick, parry *ding* (bright bell), boss hurt honk, water splash, stomp, ball pop, card flip, menu clicks and page turns.
- Everything plays through a master gain with a small room reverb and a vinyl-crackle bed, so it sounds like an old recording.
- Unlock the audio context on the first user tap.

## 9. Code quality and structure

- Use scenes: `Boot`, `Title`, `Story`, `Station`, `TrainRide`, `Fight`, `Results`, `Settings`, `Pause`. Put the island and route data (name, unlock state, boss scene key, ride length, curve positions) in one `world.ts` file, so a later level is a data entry plus a boss scene.
- Put the boss logic in a small state machine per phase, with attack patterns as data (timings, counts, speeds) in one tuning file, so difficulty is easy to tweak.
- Keep the sprite drawing code in `src/art/` with one module per character. The sprite sheets for each animation are generated at boot.
- Add a debug overlay (toggle with `?debug=1`) that shows hitboxes, fps, the boss phase and HP, and a phase-skip button.

## 10. Definition of done (verify each point yourself before finishing)

- `npm run build` produces a static `dist/` that works when opened on a phone over any static host, and installs as a landscape PWA.
- You played through it with Playwright in mobile-landscape emulation (e.g. a Pixel 7 in landscape, with touch). Include screenshots of the title, story, each boss phase, death and results screens, and fix anything that looks off.
- There are no console errors, and fps holds at 60 in the emulated mid-range profile with film effects on.
- The whole loop (station → ride → fight → results → station) can be played with touch controls alone, and the progress is still there after a page reload.
- A `README.md` explains how to run it, deploy it (e.g. GitHub Pages / Netlify drop) and tune the boss.

## 11. Milestones and budget (hard limit: $30 total, aim for $25 or less)

Build in these milestones. At the end of each one:
1. update `PROGRESS.md` (what's done, what's next, known issues);
2. commit and push;
3. **stop and tell me the milestone is done**, so I can check the cost and start a fresh session for the next one.

| # | Milestone | Budget guide |
|---|---|---|
| 1 | Project skeleton, scaling/orientation, touch controls, and player feel (run, jump, dash, shoot, parry) on a blank stage | ~$3 |
| 2 | Madame Tusk's 3 phases with placeholder shapes, player HP, death and retry | ~$4 |
| 3 | Art pass: Bongo, Madame Tusk, the Big Top background, VFX and juice | ~$5 |
| 4 | Station and map, the train ride and HUD, save data, the Lucky Peel charm | ~$4 |
| 5 | Film post-processing, all music and SFX | ~$4 |
| 6 | Title, story, results, settings, the final Playwright playthrough and performance pass, the README | ~$3 |

That totals about $23, leaving about $7 in reserve. The figures are rough guides, not measurements.

**Rules for keeping costs down:**
- Write each module in one go. Use targeted edits after that, and don't re-read a file you just wrote.
- Don't spawn sub-agents. Don't add test frameworks beyond Playwright smoke checks.
- Screenshots cost a lot of tokens. Take at most **4 per milestone**, at 1280×720 or smaller.
- Don't paste large build logs back in full. Read only the errors.
- If a milestone is clearly running over its guide, finish the core of it, write down what was skipped in `PROGRESS.md`, and stop.

**Cut these first, in this order, if the budget gets tight:**
1. the ride back after the fight;
2. the storybook page-curl effect (use a plain fade);
3. the button-layout editor;
4. phase 3's spotlight hazard;
5. the Lucky Peel charm.

**Never cut:** game feel, the three boss phases, the train ride to Big Top Isle, the rubber-hose art style or the film look.
