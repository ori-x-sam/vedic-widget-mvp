# ASSETS.md — painted art prompts

Every record ships with procedural placeholder layers (`src/art/records/<id>.ts`). Painted layers replace
them one at a time: drop `public/art/<recordId>/<layer>.webp` into the repo and rebuild. The loader
(`src/art/bake.ts`, via the `virtual:painted-art` manifest) uses the painted file if it exists, otherwise the
procedural one. Painted art must pass colour QA (`npm run qa:colour`) and the respect rules (brief §7).

## Shared rules for every prompt

Append this block to every layer prompt below:

> Painterly 2D side-scrolling game background layer, soft gouache-like shading, detailed but readable at
> phone size, gentle atmospheric depth. The colours of a well-loved 1970s–80s Indian children's textbook
> illustration: warm, saturated, popping Indian colours with a gentle aged warmth — not sepia, not pastel,
> not neon, not flat vector, not pixel art, not 3D. No text, no letters, no logos, no signatures, no
> likenesses of real people. Skin is always a warm brown. Greys are warm stone greys, never neutral grey.

For every layer **except the sky**, add: *transparent background (PNG/WebP with alpha); a wide horizontal strip
whose left and right edges join seamlessly so it can tile.*

Export as WebP (quality ~85) at the exact size listed. Tiling strips are 2048 px wide.

## Record 01 · c. 1500 BCE · Golbai Sasan, north of Chilika

Chapter palette (Act I, Kalinga Sagar): **peacock #00909A (lead)** + seafoam #86D5C4 + laterite #B4502F + haldi
#FFC926; supports from the scene palette: tota #38A845, skyCream #F1DDB4, limewhite #F6EFE0, chandan #D38B55,
rani #E62C7E (flamingos only).

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Morning sky over Chilika lagoon in Odisha. Warm old-paper cream (#F1DDB4) at the horizon fading upward to pale seafoam (#86D5C4); a faint printed halftone texture strongest at the top; a few distant birds. No sun disc (it is its own layer), no clouds. |
| `sun.webp` | 1280×260 | 0 | A single round turmeric-yellow (#FFC926) sun disc, about 80 px across, centred at x≈965, y≈118, with a soft warm glow and a marigold (#FF9414) rim; everything else transparent. |
| `clouds.webp` | 2048×250 | 0.04 | A row of soft cumulus banks with flat bases, sunlit lime-white tops (#F6EFE0) and warm cream undersides, painted in soft gouache; sun is to the upper right. Tiles horizontally. |
| `far.webp` | 2048×170 | 0.12 | Two ranges of low hills on the far side of Chilika lagoon: distant blue-green ridges hazed toward cream, a nearer forested range in parrot green and peacock teal, sun catching the right-facing slopes. Base of the hills at y≈152, fading into warm haze. |
| `mid.webp` | 2048×252 | 0.3 | The Neolithic settlement of Golbai Sasan on the bank of the Malaguni river: round huts with upright wooden-post walls and conical haldi-ochre thatch on raised rammed-earth floors; a long log being hollowed into a dugout canoe on wooden trestles with wood chips around it; villagers in simple cotton wraps; cooking hearths; fishing nets drying on poles; coconut and palmyra palms and a line of mango-like trees behind; a laterite-red earthen bank with grass along the top, meeting the water at y≈246. Small figures, ~25 px tall. No temples, no metal tools. |
| `near.webp` | 2048×112 | 0.55 | Low sandbars in the lagoon shallows with hazy reed clumps, groups of pink greater flamingos (some feeding with heads down) and white egrets, lily pads and a few pink lotus flowers between the bars; sand base at y≈80. |
| `fore.webp` | 2048×120 | 1.32 | Very near foreground at the bottom edge: large lotus leaves floating flat on the water, a few pink lotus flowers, short dark reed tufts; mostly in the bottom 50 px so it never hides the play lane. |

The water (`water`, `glitter`, `ripples-*`, `lip`) and `reflection` layers are best left procedural: they are
animated, and the reflection is derived from the procedural `mid` layer (if you paint `mid`, also supply a
matching `reflection.webp`, 2048×84: the bank flipped, squashed to ~40%, rippled and tinted peacock).

### Sprites (Record 01)

Sprites are painted at 2× and shown at 0.5×; keep the same canvas sizes and origins as `src/art/sprites/*.ts`
if you replace them (sprite swapping is wired in a later phase).

- **Taapoi in her dugout canoe** — a friendly, round, big-eyed little Odia girl (about 8), warm brown skin,
  black hair in a bun wrapped with a white jasmine string, a sindoor (#E8361F) ribbon, small sindoor bindi,
  white cotton frock with a sindoor border and a haldi pin-stripe, haldi bead necklace; kneeling in a laterite
  wooden dugout with a raised prow, paddling with a leaf-shaped paddle. Side view facing right. Frames: 8-frame
  paddle cycle, a jump pose (paddle raised, mouth open in delight), a bump pose (eyes squeezed shut).
- **Hazards** (dark rim, never in the scene's lead colour): a clump of reeds with cattails; a low mudbank of wet
  laterite mud with grass tufts (variant with a tiny red crab); three bamboo fishing stakes with a hanging net
  and a red marker rag.
- **Collectibles**: a cowrie shell seen from its toothed underside (lime-white); a talapatra palm-leaf page in
  haldi yellow with incised decorative loops (not real letters) and a sindoor string.
- **Irrawaddy dolphin** — slate blue-grey, blunt rounded head with no beak, small rounded dorsal fin set back,
  pale belly, friendly smile; side view facing left.
