# Banana Jig — Level 1 demo

A 1930s rubber-hose style boss fighter for phones in landscape. Bongo the monkey rides the Peanut Express along the Canopy Line sky railway to Big Top Isle and takes on Madame Tusk.

Everything is drawn and synthesized in code (canvas 2D + Web Audio). There are no image or audio files and no build step.

## Run it
Serve this folder with any static server and open `index.html`, e.g. `python3 -m http.server` → http://localhost:8000. Add `?debug=1` to show hitboxes and fps; press **N** to skip a boss phase.

## Flow
Title → storybook (first play) → Banana Junction station and route map → train ride → fight → results → ending page → station.

## Controls
| | Touch | Keyboard |
|---|---|---|
| Move / aim | drag anywhere on the left half | arrows / WASD |
| Jump (press again in the air on **pink** things to parry) | JUMP | Z / Space |
| Fire | FIRE toggles auto-fire | hold X |
| Dash | DASH | C |
| EX shot (1 card) / Super (5 cards) | EX | V |
| Aim without moving | hold LOCK | Left Shift |
| Train: power / brake | Power / Brake | → / ← |

## Files
- `js/core.js`: scaling, input, scenes, iris transitions, particles, old-film filter, save data
- `js/audio.js`: swing sequencer (ragtime/hot-jazz loops) and all sound effects
- `js/art.js`: Bongo, Madame Tusk, seals, Ringmaster Rex, projectiles
- `js/world.js`: Big Top, sky, clouds, floating islands, the train, platforms
- `js/menus.js`: title, story, station/map, ticket booth, settings, pause, results
- `js/ride.js`: the train ride (curve speed limits, comfort, bananas)
- `js/fight.js`: player controller and the three-phase boss; tune numbers in `TUNE` at the top
