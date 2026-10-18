# ASSETS.md — painted art prompts

Every record ships with procedural placeholder layers (Record 01: `src/art/records/r01.ts`; the rest: `src/art/scenes/act*.ts` via the scene engine). Painted layers replace
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

---

<!-- generated:start -->

## Record 02 · c. 300 BCE · Sisupalgarh, near Bhubaneswar

Act 1 (Kalinga Sagar): **peacock #00909A (lead)** + seafoam #86D5C4 + laterite #B4502F + haldi #FFC926. sea and sun. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Sisupalgarh, near Bhubaneswar — A city of eight gates.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Sisupalgarh, near Bhubaneswar, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Sisupalgarh, near Bhubaneswar — A city of eight gates.. Sisupalgarh, near today's Bhubaneswar, was a nearly square fortified city of about 1.2 square kilometres. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Sisupalgarh, near Bhubaneswar: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a small wooden bullock cart pulled by one friendly white bullock, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): moat (pit), pot (roller), oxcart (walker), milestone (small).

## Record 03 · Kartika Purnima · An estuary port on the Kalinga coast

Act 1 (Kalinga Sagar): **peacock #00909A (lead)** + seafoam #86D5C4 + laterite #B4502F + haldi #FFC926. sea and sun. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over An estuary port on the Kalinga coast — The boitas sail for the golden islands.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant horizon for An estuary port on the Kalinga coast, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: An estuary port on the Kalinga coast — The boitas sail for the golden islands.. Kalinga's merchant-mariners, the sadhabas, sailed to Sri Lanka, Java, Sumatra, Borneo, Bali and Burma with goods such as pepper, cinnamon, cardamom, silk, camphor and gold. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for An estuary port on the Kalinga coast: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a small Kalinga boita ship with a striped sail, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): wave (small), bigwave (tall), rock (wide), squall (floater).

## Record 04 · 261 BCE · Dhauli hill above the Daya river

Act 1 (Kalinga Sagar): **peacock #00909A (lead)** + seafoam #86D5C4 + laterite #B4502F + haldi #FFC926. sea and sun. Quiet, somber, drained toward sepia/indigo; no violence, no bodies. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Dhauli hill above the Daya river — The Kalinga War. An emperor lays down the sword.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Dhauli hill above the Daya river, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Dhauli hill above the Daya river — The Kalinga War. An emperor lays down the sword.. Emperor Ashoka's Rock Edict XIII records the terrible loss of life in his war against Kalinga. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Dhauli hill above the Daya river: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on running on foot, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): stone (small).

## Record 05 · c. 2nd–1st century BCE · Udayagiri and Khandagiri hills

Act 1 (Kalinga Sagar): **peacock #00909A (lead)** + seafoam #86D5C4 + laterite #B4502F + haldi #FFC926. sea and sun. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Udayagiri and Khandagiri hills — Kharavela writes his story in stone.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Udayagiri and Khandagiri hills, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Udayagiri and Khandagiri hills — Kharavela writes his story in stone.. On Udayagiri hill near Bhubaneswar, the 17-line Hathigumpha ('Elephant Cave') inscription, in Prakrit and Brahmi script, tells the life of King Kharavela of Kalinga. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Udayagiri and Khandagiri hills: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a gentle elephant in a sindoor-and-haldi caparison, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): steps (small), monkey (roller), leaves (floater).

## Record 06 · 6th–7th century CE · The coast of Central Java

Act 2 (The Temple Coast): **laterite #B4502F (lead)** + marigold #FF9414 + khondalite #776A60 + tota #38A845. + limewhite at Puri; khondalite at Konark. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over The coast of Central Java — A kingdom in Java carries Kalinga's name.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant horizon for The coast of Central Java, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: The coast of Central Java — A kingdom in Java carries Kalinga's name.. A kingdom in Central Java called Kalingga — 'Holing' in Chinese sources — took its name from Kalinga. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for The coast of Central Java: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a small Kalinga boita ship with a striped sail, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): wave (small), reef (wide), bigwave (tall).

## Record 07 · Early 7th century CE · Old Bhubaneswar

Act 2 (The Temple Coast): **laterite #B4502F (lead)** + marigold #FF9414 + khondalite #776A60 + tota #38A845. + limewhite at Puri; khondalite at Konark. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Old Bhubaneswar — Parasurameswara: an early Kalinga temple.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Old Bhubaneswar, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Old Bhubaneswar — Parasurameswara: an early Kalinga temple.. Parasurameswara in Old Bhubaneswar was built under the Shailodbhava kings. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Old Bhubaneswar: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a small wooden bullock cart pulled by one friendly white bullock, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): block (small), chips (wide), scaffold (tall).

## Record 08 · 8th century CE · Bhubaneswar

Act 2 (The Temple Coast): **laterite #B4502F (lead)** + marigold #FF9414 + khondalite #776A60 + tota #38A845. + limewhite at Puri; khondalite at Konark. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Bhubaneswar — Vaital Deula: a temple roofed like a boat.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Bhubaneswar, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Bhubaneswar — Vaital Deula: a temple roofed like a boat.. Vaital Deula in Bhubaneswar is a khakhara temple with a long, barrel-vaulted roof. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Bhubaneswar: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a small wooden bullock cart pulled by one friendly white bullock, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): basket (small), chips (wide), scaffold (tall), pot (roller).

## Record 09 · 8th–10th century CE · Ratnagiri, Jajpur

Act 2 (The Temple Coast): **laterite #B4502F (lead)** + marigold #FF9414 + khondalite #776A60 + tota #38A845. + limewhite at Puri; khondalite at Konark. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Ratnagiri, Jajpur — Ratnagiri, the hill of jewels.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Ratnagiri, Jajpur, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Ratnagiri, Jajpur — Ratnagiri, the hill of jewels.. Ratnagiri, Lalitgiri and Udayagiri form Odisha's Buddhist 'Diamond Triangle', named after Vajrayana — 'diamond vehicle' — Buddhism. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Ratnagiri, Jajpur: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on running on foot, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): stupa (small), carved (wide), pillar (tall).

## Record 10 · c. 950–975 CE · A mango grove in Bhubaneswar

Act 2 (The Temple Coast): **laterite #B4502F (lead)** + marigold #FF9414 + khondalite #776A60 + tota #38A845. + limewhite at Puri; khondalite at Konark. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over A mango grove in Bhubaneswar — Mukteswara: the gem of Kalinga architecture.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for A mango grove in Bhubaneswar, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: A mango grove in Bhubaneswar — Mukteswara: the gem of Kalinga architecture.. The small Mukteswara temple in Bhubaneswar has an arched stone gateway, or torana, that is unique among the city's temples. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for A mango grove in Bhubaneswar: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a small wooden bullock cart pulled by one friendly white bullock, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): mangoBasket (small), mango (roller), ladder (tall), leafpile (wide).

## Record 11 · 11th century CE · Ekamra, Old Bhubaneswar

Act 2 (The Temple Coast): **laterite #B4502F (lead)** + marigold #FF9414 + khondalite #776A60 + tota #38A845. + limewhite at Puri; khondalite at Konark. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Ekamra, Old Bhubaneswar — Lingaraja rises over Ekamra.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Ekamra, Old Bhubaneswar, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Ekamra, Old Bhubaneswar — Lingaraja rises over Ekamra.. The towering Lingaraja temple was begun by the Somavamsi kings and added to by the Gangas. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Ekamra, Old Bhubaneswar: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a small wooden bullock cart pulled by one friendly white bullock, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): basket (small), handcart (wide), pole (tall), coconut (roller).

## Record 12 · 11th century CE · The open Bay of Bengal

Act 2 (The Temple Coast): **laterite #B4502F (lead)** + marigold #FF9414 + khondalite #776A60 + tota #38A845. + limewhite at Puri; khondalite at Konark. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over The open Bay of Bengal — Ships that carried elephants.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant horizon for The open Bay of Bengal, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: The open Bay of Bengal — Ships that carried elephants.. An 11th-century stone relief from Bhubaneswar, now in the Odisha State Museum, shows a boat carrying elephants. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for The open Bay of Bengal: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a boita ship carrying an elephant on deck, sitting low in the water, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): wave (small), bigwave (tall), rock (wide).

## Record 13 · Tradition · Jajpur, Puri and Ganjam

Act 2 (The Temple Coast): **laterite #B4502F (lead)** + marigold #FF9414 + khondalite #776A60 + tota #38A845. + limewhite at Puri; khondalite at Konark. Kind: tradition.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Jajpur, Puri and Ganjam — Where the goddess dwells.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Jajpur, Puri and Ganjam, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Jajpur, Puri and Ganjam — Where the goddess dwells.. By tradition Odisha holds several Shakti Peethas. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Jajpur, Puri and Ganjam: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a small wooden bullock cart pulled by one friendly white bullock, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): stone (small), puddle (wide).

## Record 14 · 12th century CE · Bada Danda, Puri

Act 2 (The Temple Coast): **laterite #B4502F (lead)** + marigold #FF9414 + khondalite #776A60 + tota #38A845. + limewhite at Puri; khondalite at Konark. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Bada Danda, Puri — A temple for Jagannath at Puri.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Bada Danda, Puri, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Bada Danda, Puri — A temple for Jagannath at Puri.. The great temple of Jagannath at Puri was begun by Anantavarman Chodaganga of the Eastern Ganga dynasty (r. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Bada Danda, Puri: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a small wooden bullock cart pulled by one friendly white bullock, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): basket (small), handcart (wide), coconut (roller), pole (tall).

## Record 15 · c. 1250 CE · Konark, by the sea

Act 2 (The Temple Coast): **laterite #B4502F (lead)** + marigold #FF9414 + khondalite #776A60 + tota #38A845. + limewhite at Puri; khondalite at Konark. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Konark, by the sea — Konark: the Sun's chariot in stone.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Konark, by the sea, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Konark, by the sea — Konark: the Sun's chariot in stone.. Konark's Sun Temple was built around 1250 by King Narasimhadeva I (r. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Konark, by the sea: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on running on foot, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): stone (small), dune (wide), foam (pit).

## Record 16 · 29 Jun 1435 · Bhubaneswar

Act 3 (Gajapati): **sindoor #E8361F (lead)** + haldi #FFC926 + neel #26389A + tota #38A845. Pattachitra and Pipili reds and yellows. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Bhubaneswar — Kapilendra Deva is crowned Gajapati.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Bhubaneswar, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Bhubaneswar — Kapilendra Deva is crowned Gajapati.. Kapilendra Deva founded the Suryavamsi Gajapati empire, which at its height stretched from the lower Ganga to the Kaveri. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Bhubaneswar: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a gentle elephant in a sindoor-and-haldi caparison, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): elephantHerd (walker), banner (tall), pot (small).

## Record 17 · Legend · The road to Kanchi

Act 3 (Gajapati): **sindoor #E8361F (lead)** + haldi #FFC926 + neel #26389A + tota #38A845. Pattachitra and Pipili reds and yellows. Kind: legend.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over The road to Kanchi — Two riders and a milkmaid.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for The road to Kanchi, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: The road to Kanchi — Two riders and a milkmaid.. In the Kanchi–Kaveri legend of King Purushottama Deva (r. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for The road to Kanchi: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a gentle elephant in a sindoor-and-haldi caparison, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.

## Record 18 · 1510 · Bada Danda, Puri — Rath Yatra

Act 3 (Gajapati): **sindoor #E8361F (lead)** + haldi #FFC926 + neel #26389A + tota #38A845. Pattachitra and Pipili reds and yellows. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Bada Danda, Puri — Rath Yatra — Chaitanya arrives in Puri.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Bada Danda, Puri — Rath Yatra, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Bada Danda, Puri — Rath Yatra — Chaitanya arrives in Puri.. In 1510 Chaitanya came to Puri and made it his home until 1533; King Prataparudra Deva became his patron. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Bada Danda, Puri — Rath Yatra: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on running on foot, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): flowerHeap (small), rope (wide), coconut (roller).

## Record 19 · 1568 · A palm-leaf forest path at dusk

Act 3 (Gajapati): **sindoor #E8361F (lead)** + haldi #FFC926 + neel #26389A + tota #38A845. Pattachitra and Pipili reds and yellows. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over A palm-leaf forest path at dusk — The last independent kingdom falls.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for A palm-leaf forest path at dusk, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: A palm-leaf forest path at dusk — The last independent kingdom falls.. In 1568 the Karrani sultanate of Bengal defeated King Mukunda Deva, and the Jagannath temple was attacked. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for A palm-leaf forest path at dusk: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on running on foot, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): root (small), log (wide), branch (floater).

## Record 20 · 1803 · Khurda, below Barunei hill

Act 4 (Company & Resistance): **neel #26389A (lead)** + khondalite #776A60 + skyCream #F1DDB4. faded indigo + sepia, almost duotone; 22 & 26 near-monochrome; 25 floods back. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Khurda, below Barunei hill — The East India Company takes Odisha.. Faded indigo and sepia, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Khurda, below Barunei hill, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Khurda, below Barunei hill — The East India Company takes Odisha.. After the Second Anglo-Maratha War, the East India Company took Odisha in 1803, and the Raja of Khurda lost his throne.. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Khurda, below Barunei hill: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a small palanquin carried by two running bearers, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): tollgate (tall), pothole (pit), milestone (small), oxcart (walker).

## Record 21 · Mar 1817 · Khurda forest

Act 4 (Company & Resistance): **neel #26389A (lead)** + khondalite #776A60 + skyCream #F1DDB4. faded indigo + sepia, almost duotone; 22 & 26 near-monochrome; 25 floods back. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Khurda forest — The Paikas rise.. Faded indigo and sepia, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Khurda forest, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Khurda forest — The Paikas rise.. In March 1817 the Paikas — Odisha's traditional militia — rose against Company rule, led by Buxi Jagabandhu. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Khurda forest: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on running on foot, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): stump (small), log (wide), boulder (roller).

## Record 22 · 1866 · Coastal Odisha

Act 4 (Company & Resistance): **neel #26389A (lead)** + khondalite #776A60 + skyCream #F1DDB4. faded indigo + sepia, almost duotone; 22 & 26 near-monochrome; 25 floods back. Quiet, somber, drained toward sepia/indigo; no violence, no bodies. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Coastal Odisha — Na'anka: the great famine.. Faded indigo and sepia, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Coastal Odisha, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Coastal Odisha — Na'anka: the great famine.. The famine of 1866 took the lives of about a third of coastal Odisha's people. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Coastal Odisha: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on running on foot, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): shrub (small).

## Record 23 · 1866–1868 · Cuttack

Act 4 (Company & Resistance): **neel #26389A (lead)** + khondalite #776A60 + skyCream #F1DDB4. faded indigo + sepia, almost duotone; 22 & 26 near-monochrome; 25 floods back. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Cuttack — Odia finds its printed voice.. Faded indigo and sepia, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Cuttack, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Cuttack — Odia finds its printed voice.. Utkal Dipika, an Odia newspaper, began in Cuttack in 1866. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Cuttack: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a handcart carrying a small printing press, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): newsprint (floater), typeCrate (small), paperBundle (wide), inkBarrel (roller).

## Record 24 · 30 Dec 1903 · Cuttack

Act 4 (Company & Resistance): **neel #26389A (lead)** + khondalite #776A60 + skyCream #F1DDB4. faded indigo + sepia, almost duotone; 22 & 26 near-monochrome; 25 floods back. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Cuttack — The Utkal Sammilani gathers in Cuttack.. Faded indigo and sepia, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Cuttack, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Cuttack — The Utkal Sammilani gathers in Cuttack.. On 30 December 1903 the Utkal Sammilani gathered in Cuttack. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Cuttack: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on an old black roadster bicycle, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): chair (small), bench (wide), bannerPole (tall), wheelRim (roller).

## Record 25 · 1 Apr 1936 · Cuttack

Act 4 (Company & Resistance): **neel #26389A (lead)** + khondalite #776A60 + skyCream #F1DDB4. faded indigo + sepia, almost duotone; 22 & 26 near-monochrome; 25 floods back. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Cuttack — Odisha becomes a province of its own.. Faded indigo and sepia, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Cuttack, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Cuttack — Odisha becomes a province of its own.. Orissa became a separate province on 1 April 1936 — the first province formed on the basis of language. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Cuttack: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on an old black roadster bicycle, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): lampStand (small), newspapers (wide), conch (roller), garlandPole (tall).

## Record 26 · 11 Oct 1938 · Nilakanthapur ghat, Brahmani river

Act 4 (Company & Resistance): **neel #26389A (lead)** + khondalite #776A60 + skyCream #F1DDB4. faded indigo + sepia, almost duotone; 22 & 26 near-monochrome; 25 floods back. Quiet, somber, drained toward sepia/indigo; no violence, no bodies. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Nilakanthapur ghat, Brahmani river — A boatboy says no.. Faded indigo and sepia, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Heavy rain clouds, storm-grey with indigo shadows; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant horizon for Nilakanthapur ghat, Brahmani river, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Nilakanthapur ghat, Brahmani river — A boatboy says no.. Twelve-year-old Baji Rout, a boatman's son and a member of the Prajamandal's children's wing, refused to ferry the police across the Brahmani river, and was killed. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Nilakanthapur ghat, Brahmani river: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a small country boat with a single oar, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): driftwood (small), sandbar (wide).

## Record 27 · 24 Jul 1947 · Over the Java Sea

Act 5 (Naya Odisha): **marigold #FF9414 (lead)** + peacock #00909A + sindoor #E8361F + tota #38A845. 28 = indigo blueprint; 31 = storm-grey + indigo. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×720, opaque | 0 | Sky over Over the Java Sea — A Dakota flies to Java.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant horizon for Over the Java Sea, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Over the Java Sea — A Dakota flies to Java.. At Nehru's request, pilot Biju Patnaik flew Indonesian leader Sutan Sjahrir out of Dutch-controlled Java, reaching India via Singapore on 24 July 1947. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Over the Java Sea: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a generic 1940s twin-engine propeller plane (no markings), side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): stormcell (air), birds (floater).

## Record 28 · 13 Apr 1948 · Bhubaneswar new capital

Act 5 (Naya Odisha): **marigold #FF9414 (lead)** + peacock #00909A + sindoor #E8361F + tota #38A845. 28 = indigo blueprint; 31 = storm-grey + indigo. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Bhubaneswar new capital — A new capital is planned at Bhubaneswar.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Bhubaneswar new capital, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Bhubaneswar new capital — A new capital is planned at Bhubaneswar.. On 13 April 1948 Nehru laid the foundation stone of a new capital at Bhubaneswar. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Bhubaneswar new capital: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on an old black roadster bicycle, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): surveyStake (small), chain (wide), theodolite (tall), cow (walker).

## Record 29 · 13 Jan 1957 · Hirakud Dam, Sambalpur

Act 5 (Naya Odisha): **marigold #FF9414 (lead)** + peacock #00909A + sindoor #E8361F + tota #38A845. 28 = indigo blueprint; 31 = storm-grey + indigo. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Hirakud Dam, Sambalpur — Hirakud Dam opens.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Hirakud Dam, Sambalpur, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Hirakud Dam, Sambalpur — Hirakud Dam opens.. Hirakud Dam across the Mahanadi opened on 13 January 1957. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Hirakud Dam, Sambalpur: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on an old black roadster bicycle, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): spray (floater), cattle (walker), milestone (small).

## Record 30 · 3 Feb 1959 · Rourkela

Act 5 (Naya Odisha): **marigold #FF9414 (lead)** + peacock #00909A + sindoor #E8361F + tota #38A845. 28 = indigo blueprint; 31 = storm-grey + indigo. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Rourkela — Rourkela lights its first blast furnace.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Rourkela, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Rourkela — Rourkela lights its first blast furnace.. On 3 February 1959 Rourkela lit its first blast furnace, named 'Parvati'. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Rourkela: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a generic small locomotive cab, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): slagCart (walker), railSwitch (small), signal (tall), sleepers (wide).

## Record 31 · 29 Oct 1999 · Paradip coast

Act 5 (Naya Odisha): **marigold #FF9414 (lead)** + peacock #00909A + sindoor #E8361F + tota #38A845. 28 = indigo blueprint; 31 = storm-grey + indigo. Quiet, somber, drained toward sepia/indigo; no violence, no bodies. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Paradip coast — The Super Cyclone.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Heavy rain clouds, storm-grey with indigo shadows; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Paradip coast, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Paradip coast — The Super Cyclone.. On 29 October 1999 a super cyclone made landfall near Paradip with winds of about 250 km/h. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Paradip coast: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on running on foot, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): debris (small), fallenPalm (wide), flyingSheet (floater).

## Record 32 · 1 Nov 2011 · A highway in Odisha

Act 6 (Odisha, Now): **rani #E62C7E (lead)** + peacock #00909A + haldi #FFC926 + tota #38A845. the brightest scenes. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over A highway in Odisha — Orissa becomes Odisha.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for A highway in Odisha, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: A highway in Odisha — Orissa becomes Odisha.. From 1 November 2011 the state's English name changed from Orissa to Odisha, and its language from Oriya to Odia.. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for A highway in Odisha: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a generic Odisha town bus with a hand-painted stripe (no names), side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): paintBucket (small), ladder (tall), cow (walker), barricade (wide).

## Record 33 · 12 Oct 2013 · Ganjam coast

Act 6 (Odisha, Now): **rani #E62C7E (lead)** + peacock #00909A + haldi #FFC926 + tota #38A845. the brightest scenes. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Ganjam coast — Phailin: a million moved to safety.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Heavy rain clouds, storm-grey with indigo shadows; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Ganjam coast, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Ganjam coast — Phailin: a million moved to safety.. After 1999, Odisha set up India's first state disaster management authority and built cyclone shelters. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Ganjam coast: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on running on foot, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): debris (small), branchPile (wide), flyingSheet (floater).

## Record 34 · 20 Feb 2014 · An Odia alphabet chart

Act 6 (Odisha, Now): **rani #E62C7E (lead)** + peacock #00909A + haldi #FFC926 + tota #38A845. the brightest scenes. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over An Odia alphabet chart — Odia becomes a classical language.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for An Odia alphabet chart, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: An Odia alphabet chart — Odia becomes a classical language.. On 20 February 2014 Odia became India's sixth classical language. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for An Odia alphabet chart: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on running on foot, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): inkpot (small), slate (wide).

## Record 35 · 2018 · Kalinga Stadium, Bhubaneswar

Act 6 (Odisha, Now): **rani #E62C7E (lead)** + peacock #00909A + haldi #FFC926 + tota #38A845. the brightest scenes. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Kalinga Stadium, Bhubaneswar — Hockey comes home.. Night: indigo with turmeric stars, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Kalinga Stadium, Bhubaneswar, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Kalinga Stadium, Bhubaneswar — Hockey comes home.. Bhubaneswar hosted the 2018 Men's Hockey World Cup. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Kalinga Stadium, Bhubaneswar: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on an e-scooter, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): hockeyBall (roller), cone (small), goal (tall), kitBag (wide).

## Record 36 · 17 Jan 2024 · Shree Mandira, Puri

Act 6 (Odisha, Now): **rani #E62C7E (lead)** + peacock #00909A + haldi #FFC926 + tota #38A845. the brightest scenes. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Shree Mandira, Puri — A walkway around Shree Mandira.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Shree Mandira, Puri, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Shree Mandira, Puri — A walkway around Shree Mandira.. On 17 January 2024 the Shree Mandira Parikrama heritage corridor opened in Puri. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Shree Mandira, Puri: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on running on foot, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): planter (small), queueRail (wide), shadeUmbrella (tall).

## Record 37 · 2026 · Now · Info Valley, Bhubaneswar

Act 6 (Odisha, Now): **rani #E62C7E (lead)** + peacock #00909A + haldi #FFC926 + tota #38A845. the brightest scenes. Kind: history.

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Info Valley, Bhubaneswar — Chips on the coast.. Night: indigo with turmeric stars, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Info Valley, Bhubaneswar, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Info Valley, Bhubaneswar — Chips on the coast.. Work began at Bhubaneswar's Info Valley on India's first end-to-end silicon carbide chip plant. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Info Valley, Bhubaneswar: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on an e-scooter, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): cone (small), boxes (wide), robot (walker), barrier (tall).

## Record 38 · 1 Apr 2036 · The Bhubaneswar–Cuttack–Puri–Paradip tri-city

Act 7 (ଭବିଷ୍ୟତ · The Future): **neel #26389A (lead)** + haldi #FFC926 + neonRani #FF3D9A + neonCyan #29E3E3. F7 returns to the classic palette. Hopeful retro-future, as a 1980s Indian science picture-book imagined it. Kind: speculative (label SPECULATIVE · NOT HISTORY).

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over The Bhubaneswar–Cuttack–Puri–Paradip tri-city — Odisha turns one hundred.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for The Bhubaneswar–Cuttack–Puri–Paradip tri-city, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: The Bhubaneswar–Cuttack–Puri–Paradip tri-city — Odisha turns one hundred.. Real: Odisha turns one hundred on 1 April 2036, and the state's Vision 2036 aims for a US$500 billion economy. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for The Bhubaneswar–Cuttack–Puri–Paradip tri-city: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a sleek boita-shaped maglev pod with a soft radium-cyan glow, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): cargoPod (small), drone (floater), serviceBot (walker).

## Record 39 · 2047 · Chilika

Act 7 (ଭବିଷ୍ୟତ · The Future): **neel #26389A (lead)** + haldi #FFC926 + neonRani #FF3D9A + neonCyan #29E3E3. F7 returns to the classic palette. Hopeful retro-future, as a 1980s Indian science picture-book imagined it. Kind: speculative (label SPECULATIVE · NOT HISTORY).

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Chilika — Chilika, restored and humming.. Night: indigo with turmeric stars, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant horizon for Chilika, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Chilika — Chilika, restored and humming.. Imagined: Irrawaddy dolphins thrive in Chilika, floating solar panels shade the canals, and tiny lantern-drones guide olive ridley turtle hatchlings to the sea at night. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Chilika: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a small electric boat descended from the dugout canoe, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): buoy (small), logBoom (wide), drone (floater).

## Record 40 · 2061 · The mangrove coast

Act 7 (ଭବିଷ୍ୟତ · The Future): **neel #26389A (lead)** + haldi #FFC926 + neonRani #FF3D9A + neonCyan #29E3E3. F7 returns to the classic palette. Hopeful retro-future, as a 1980s Indian science picture-book imagined it. Kind: speculative (label SPECULATIVE · NOT HISTORY).

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×720, opaque | 0 | Sky over The mangrove coast — The coast cyclones can't break.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Heavy rain clouds, storm-grey with indigo shadows; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant horizon for The mangrove coast, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: The mangrove coast — The coast cyclones can't break.. Imagined: towns walled by mangroves, shelters that rise on stilts, and turbines that harvest storm winds. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for The mangrove coast: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a hang-glider with an appliqué-patterned wing, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): stormcell (air), turbineGust (floater).

## Record 41 · 2088 · Raghurajpur and the Naraj chip city

Act 7 (ଭବିଷ୍ୟତ · The Future): **neel #26389A (lead)** + haldi #FFC926 + neonRani #FF3D9A + neonCyan #29E3E3. F7 returns to the classic palette. Hopeful retro-future, as a 1980s Indian science picture-book imagined it. Kind: speculative (label SPECULATIVE · NOT HISTORY).

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Raghurajpur and the Naraj chip city — Talapatra in glass.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Raghurajpur and the Naraj chip city, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Raghurajpur and the Naraj chip city — Talapatra in glass.. Imagined: Odisha's palm-leaf manuscript tradition reborn as glass data-leaves holding all of Odia literature, Pattachitra painters in Raghurajpur painting with light, and the Naraj chip valley grown into a city. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Raghurajpur and the Naraj chip city: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a sleek boita-shaped maglev pod with a soft radium-cyan glow, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): dataCube (small), lightPillar (tall), drone (floater).

## Record 42 · 2120 · Low orbit above Konark

Act 7 (ଭବିଷ୍ୟତ · The Future): **neel #26389A (lead)** + haldi #FFC926 + neonRani #FF3D9A + neonCyan #29E3E3. F7 returns to the classic palette. Hopeful retro-future, as a 1980s Indian science picture-book imagined it. Kind: speculative (label SPECULATIVE · NOT HISTORY).

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×720, opaque | 0 | Sky over Low orbit above Konark — Konark's wheel, unfurled in orbit.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant horizon for Low orbit above Konark, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Low orbit above Konark — Konark's wheel, unfurled in orbit.. Imagined: a 24-spoked solar-sail array in orbit — Surya's chariot as a power station. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Low orbit above Konark: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a little space suit with a fishbowl helmet on a sail-board, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): antenna (small), panel (ceil).

## Record 43 · Kartika Purnima 2150 · Above the Kalinga coast

Act 7 (ଭବିଷ୍ୟତ · The Future): **neel #26389A (lead)** + haldi #FFC926 + neonRani #FF3D9A + neonCyan #29E3E3. F7 returns to the classic palette. Hopeful retro-future, as a 1980s Indian science picture-book imagined it. Kind: speculative (label SPECULATIVE · NOT HISTORY).

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×720, opaque | 0 | Sky over Above the Kalinga coast — Bali Jatra beyond the sky.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant horizon for Above the Kalinga coast, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Above the Kalinga coast — Bali Jatra beyond the sky.. Imagined: on the Kartika full moon, boita-shaped starships launch from the Kalinga coast while children float lamp-drones on the sea.. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Above the Kalinga coast: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a boita-shaped starship with glowing sails, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): asteroid (air), satellite (floater).

## Record 44 · 2200 · Bada Danda, Puri

Act 7 (ଭବିଷ୍ୟତ · The Future): **neel #26389A (lead)** + haldi #FFC926 + neonRani #FF3D9A + neonCyan #29E3E3. F7 returns to the classic palette. Hopeful retro-future, as a 1980s Indian science picture-book imagined it. Kind: speculative (label SPECULATIVE · NOT HISTORY).

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×470, opaque | 0 | Sky over Bada Danda, Puri — Some things never change.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant hills and treelines for Bada Danda, Puri, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: Bada Danda, Puri — Some things never change.. Imagined: Puri in 2200. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for Bada Danda, Puri: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on running on foot, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.

## Record 45 · ∞ · A new sea

Act 7 (ଭବିଷ୍ୟତ · The Future): **neel #26389A (lead)** + haldi #FFC926 + neonRani #FF3D9A + neonCyan #29E3E3. F7 returns to the classic palette. Hopeful retro-future, as a 1980s Indian science picture-book imagined it. Kind: speculative (label SPECULATIVE · NOT HISTORY).

| Layer file | Size | Parallax | Prompt |
|---|---|---|---|
| `sky.webp` | 1280×720, opaque | 0 | Sky over A new sea — The voyage never ended.. Warm old-paper cream at the horizon fading to pale seafoam or soft haldi, faint printed halftone. No sun disc, no clouds. |
| `clouds.webp` | 2048×250 | 0.04 | Soft gouache cumulus banks with warm undersides; tiles horizontally. |
| `far0.webp` | 2048×200 | 0.08 | Distant horizon for A new sea, hazed toward cream. |
| `mid.webp` | 2048×260 | 0.3 | The main historical subject, staged clearly: A new sea — The voyage never ended.. Kalinga's ships never stopped sailing. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |
| `near.webp` | 2048×140 | 0.55 | Near props for A new sea: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |
| `fore.webp` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |

- **Ride sprite** — Taapoi (same design as Record 01) on a boita-shaped starship with glowing sails, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.
- **Hazards** (dark rim, never in the lead colour; cozy if animals): meteor (air).

<!-- generated:end -->
