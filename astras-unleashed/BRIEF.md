# ASTRAS UNLEASHED (brief written as "TRILOK LEELA"): Build Brief for Claude Code

> **Title change (from the designer, at the start of the build):** the game is called **Astras Unleashed**. Wherever
> this brief says *Trilok Leela* as the game's name, read *Astras Unleashed*: the title screen is a huge cream
> "Astras" over peach "Unleashed", and the top label reads `ASTRAS UNLEASHED · LEELA 3 · vs GARGI`. A match is still a
> *leela*, the three worlds and the dice on Kailash are still the framing, and त्रिलोक लीला stays as an open question
> in `STRINGS_TO_VERIFY.md` (is there a Devanagari subtitle, and what?). Everything else below stands as written.

*A spiritual successor to the Kalinga Rush brief: the same look, carried into a three-lane card battler.*

---

## How to run this brief (for you, the human; Claude Code can skip to §0)

This brief follows the Liora Labs workflow from *Agentic Speed, Human Control in Game Dev* (lioralabs.dev, Sep 2026): build the vocabulary before the content, give each kind of change one home, use Storybook as the shared visual check, let a balance sim report while the human decides, run the look through a Gauntlet Loop with a blind critic, and send later changes to fresh agents.

1. Install the house rules once:
   ```sh
   claude plugin marketplace add LioraLabs/claude-plugins
   claude plugin install game-bible@lioralabs
   ```
2. Make an empty folder. Save this file in it as `BRIEF.md`. Put 3–6 screenshots of your **Kalinga Rush** build in `ref/kalinga/` and the Madras Rush reference screenshots in `ref/madras/`. These are the visual bar.
3. Open a **fresh** Claude Code session in that folder and send one prompt:
   > Read BRIEF.md end to end before writing anything. Use the game-bible skill for the architecture. Do Phase 1 only and stop at Gate 1.
4. At each gate (§9), review the work in Storybook and on your phone. Then say "Continue to Phase N."
5. After the base build, send every change request to a **fresh** session that has only the repo, the catalog and the skill (§9, Phase 8).

---

## 0. The one-paragraph pitch

**Trilok Leela** (त्रिलोक लीला, "the play of the three worlds") is a real-time card battler for phone and desktop. It has three lanes, as in Marvel Snap, and towers to defend, as in Clash Royale. Twenty gods from Hindu tradition are drawn as heroic, comic-book champions: Shiva, Vishnu, Rama, Hanuman, Durga, Ganesha and fourteen more. Each match is a **leela**, a divine game and not a war. Every match is one throw in the game of dice that Shiva and Parvati play on Kailash, a scene carved several times in the Ellora caves. Every match also runs through the **four yugas**. Their names are believed to come from the throws of an old Indian dice game, marked 4-3-2-1, and each yuga is shorter than the last. In this game, each yuga is shorter **and faster** than the last. Prana (mana) flows at ×1 in Satya Yuga and ×1.5 in Treta. It flows at ×2 in Dvapara. In the final twenty seconds of Kali Yuga it flows at ×3 and the board erupts. If the score is level, **Pralaya** (dissolution) follows: sudden death at ×3. You win by lowering the opponent's banners. You lose nothing sacred: gods never die here. When a god's strength is spent, it returns to light in a lotus (*visarjana*) and goes back into the deck.

**The look, in one line:** exactly the Kalinga Rush look. It keeps the deep maroon page, the huge cream headline, the tracked gold line and the painterly layered scenes with hanging signboards. The scenes are painted in the warm, popping colours of a 1970s–80s Indian children's textbook: sindoor, haldi, marigold, rani pink, parrot green, peacock and indigo. Now the scenes are three panoramic lanes stacked like the registers of a painted scroll, and the gods are given the energy of a comic-book splash page. **§4 is a hard spec. It carries the Kalinga Rush art direction over almost word for word on purpose.**

---

## 1. References: what to borrow and what not to

- **Kalinga Rush (your own previous game)** is the visual bar. Borrow everything: the frame, the type hierarchy, the title-card system, the painterly parallax, the hanging signboards, the textbook-page cards, the report card and the palette. Its screenshots in `ref/kalinga/` are the style target. The Madras Rush screenshots in `ref/madras/` remain the original reference behind that style. Do not copy Madras Rush's images, code, audio or text.
- **Marvel Snap**: borrow three locations, each revealed with a rule that bends play (our **Kshetras**, §3.4). Also borrow short card text in the form *On Reveal / Ongoing* (our **Avahana / Nitya / Visarjana**) and synergy between cards.
- **Clash Royale**: borrow real-time play, a mana bar that refills, a deck of 8 with a hand of 4 and the next card shown, towers in front of a king tower, a match clock with a faster final phase, and sudden-death overtime.
- **Marvel comics**: borrow only the *energy*: heroic silhouettes, dynamic low-angle poses, splash-page drama, glowing power effects, and art that breaks out of the card frame. Do not borrow Marvel names, costumes, logos, character designs or any specific panel.
- Copy **no** code, images, audio, card names, card frames, UI layouts, fonts or text from Marvel Snap, Clash Royale, Marvel, Madras Rush, Amar Chitra Katha or any other game, comic or book. Every name and rule below is our own, and so is every picture.

**Superseded from the Kalinga Rush brief:** its stack (Phaser, `palettes.ts`, a colour-literal CI lint) is replaced by the game-bible stack. That stack uses Pixi v8, KDL content, palette tokens in the one CSS `:root`, and the tweak map (§8). Everything else in its art direction stands.

---

## 2. The match

### 2.1 The board
- **Three lanes**, stacked top to bottom in the battlefield window, like three painted registers of a scroll. Units walk horizontally. **You** are on the left and face right. The **opponent** is on the right and faces left. Lanes are independent: units never change lane.
- Each lane is **20 tiles** long. The midline is at tile 10.
- **Dhvajas** (ध्वज, banner-towers) stand at tile 3 on your side and tile 17 on the opponent's, one per lane. Each is a stone plinth with a tall bamboo staff and a Pipili-appliqué banner (§4.5). HP 2000; each strike deals 100 every 0.9 s; range 7 tiles.
- One **Mahadhvaja** (महाध्वज, the great standard) per side, at tile 0 or 20. It spans all three lanes like the rod of a scroll. HP 3600; each strike deals 120 every 0.9 s; range 4.5 tiles **into every lane**. It can be attacked only from a lane whose Dhvaja has been lowered.
- **Team identity:** you fight under the **Sun** (Surya-vamsha emblem: sindoor and haldi, a disc). The opponent fights under the **Moon** (Chandra-vamsha emblem: neel and limewhite, a crescent). Every unit stands on a team halo with the matching shape. Both sides may field the same god, so shape and warm/cool contrast must tell them apart even for colour-blind players.

### 2.2 Prana and the four yugas
- **Prana** (प्राण) is the mana. It is shown as a row of **10 diyas** under the battlefield, the diyas of Kalinga Rush. Lit diyas are Prana you can spend, and the next diya's flame grows as it charges. Maximum 10. You start with 6. The base flow is 1 Prana per 2.8 s.
- The match clock counts down **3:20**. A small long-die (*pāśaka*) in the header shows the current yuga's face.

| Yuga | Die face | Clock | Length | Prana flow | What happens |
|---|---|---|---|---|---|
| **Satya** (Krita) | 4 | 3:20 → 2:00 | 80 s | ×1 | Lane I's Kshetra is revealed at the start |
| **Treta** | 3 | 2:00 → 1:00 | 60 s | ×1.5 | Lane II's Kshetra is revealed |
| **Dvapara** | 2 | 1:00 → 0:20 | 40 s | ×2 | Lane III's Kshetra is revealed |
| **Kali** | 1 | 0:20 → 0:00 | 20 s | ×3 | The print misregisters for a beat (§4.4); music doubles |
| **Pralaya** (overtime, only if tied) | — | 1:00 → 0:00 | 60 s | ×3 | Sudden death: the first banner lowered wins |

Each yuga is shorter than the last (80 : 60 : 40 : 20 = 4 : 3 : 2 : 1, the traditional ratio), and the last minute speeds up twice. Over regulation time each player gets about 117 Prana: 6 at the start plus 29, 32, 29 and 21 across the four yugas.

**Accuracy note:** *Kali* Yuga (कलि) is not the goddess *Kālī* (काली). They are different words. Never link the two in text, art or audio.

### 2.3 Winning
- Lowering an opponent's Dhvaja scores **1 banner**. In that lane, your units march on toward the Mahadhvaja, and your deploy zone extends to 4 tiles short of it.
- Lowering the **Mahadhvaja** wins at once: **Trilok Vijay** (victory over the three worlds).
- At 0:00, the side with more banners wins. If banners are level, Pralaya begins, and the first banner lowered wins. If Pralaya also ends level, the side whose weakest standing banner has more HP wins. An exact tie is **Sama** (a draw).
- Nothing is destroyed. A lowered Dhvaja is gently lowered and folded by unseen hands, a conch sounds, and its lamp goes out.

### 2.4 Cards, deck and hand
- **Deck of 8** chosen from the 20. **At most one Trimurti card** (Brahma, Vishnu, Shiva) per deck. **Hand of 4**, with the next card shown. A played card goes to the back of the queue.
- **To play a card, drag it** from the hand onto a lane, inside your **deploy zone**: tiles 1–9.5 of any lane, extended as described in §2.3. A ghost shows where it will land and a horizontal bar shows its reach. Release to play it. Spells may target anywhere in a lane.
- **Avahana (summoning):** a unit descends in a column of light and cannot act for 1 s. A spell (Astra) appears for 0.6 s as a vision above the lane, then acts.
- **Units:** each unit walks forward and engages the nearest enemy within 4.5 tiles ahead. Otherwise it attacks the nearest banner. Allies may overlap, with a small vertical offset to stack. Enemies block each other.
- **Spells** deal **35%** damage to Dhvajas and the Mahadhvaja.
- **Card text** follows Snap's rhythm with our own words: **Avahana:** (when played) · **Nitya:** (ongoing) · **Visarjana:** (when it returns to light).

### 2.5 Controls
- **Touch / mouse:** drag a card onto a lane, or tap a card and then tap a spot. Tap the long-die to pause.
- **Keyboard:** keys 1–4 pick a card. The arrow keys move a placement cursor: up and down change lanes, left and right move by one tile. Enter or Space plays the card. Esc cancels. P pauses.
- There are no taunting emotes. The four emotes are blessings: 🙏 *Namaskar*, *Sādhu!* (well played), *Shubham*, and a lotus (§7).

### 2.6 Opponents (single-player demo; no netcode)
- **Taapoi**: the tutorial opponent, a cameo from Kalinga Rush. She teaches one idea per match: drag to play, Prana, lanes, yugas and Kshetras.
- **Nachiketa** (*Shishya*, easy): reacts 1.2 s late, chooses lanes almost at random, and never saves Prana.
- **Gargi** (*Guru*, hard): counters by class, saves Prana for Kali Yuga, and never wastes Prana at 10.
- The core is deterministic (§8), so lockstep PvP can be added later without touching the rules.

### 2.7 The Leela Report (end of match)
The end-of-match card is printed on cream card stock in the style of the Kalinga Rush progress report. It lists: Name · Opponent · the three Kshetras · Banners lowered / lost · Prana spent · **Prana wasted** (Prana that would have flowed while the bar sat full at 10) · MVP card · Time · Grade (A+ … C). It carries a handwritten teacher's remark ("Sādhu! Watch your Prana in Kali Yuga.") and a red rubber stamp: **VIJAYA** (victory) / **PUNAH** (again) / **SAMA** (draw). Assisted matches are stamped "Assisted", honestly and without shame.

---

## 3. The twenty cards

### 3.1 Five classes, four gods each

| Class | Colour | Sigil | Job | Weak to |
|---|---|---|---|---|
| **Rakshak** · Guardian | peacock | shield (dhal) | soak damage, protect, hold a lane | Surya's ramping beam; Yama's pull |
| **Yoddha** · Warrior | sindoor | sword (khadga) | burst damage up close | Ganesha's taunt; Vayu's knockback; ranged units behind a tank |
| **Dhanurdhara** · Ranged | tota | bow | damage from behind the front line | Kartikeya's dive; Hanuman's leap; Indra's Vajra |
| **Astra** · Divine power (spell) | haldi | flame-and-lightning | instant answers anywhere in a lane | no body to soak; spread-out boards |
| **Sahayak** · Support | rani | lotus | value over time: Prana, control, creation | pressure; Hanuman leaping onto them; Indra |

**Trimurti** cards (Brahma, Vishnu, Shiva) also carry a gold-leaf frame (§4.7). Only one may be in a deck.

### 3.2 The roster (starting values; the sim tunes them; the human approves every change)

**Speed** is in tiles per second: slow 0.8 · medium 1.1 · fast 1.5 · very fast 2.0. **Hit** is damage per strike and the seconds between strikes. **Reach** is in tiles (melee is 0.8). The card words are the proposed vocabulary (§9, Phase 1).

| # | Card | Epithet (hero title) | Class | Cost | HP | Hit | Speed | Reach | Words (the card's rules) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Ganesha** गणेश | Vighnaharta · Remover of Obstacles | Rakshak | 4 | 1950 | 115 / 1.5 s | slow | 0.8 | Nitya `taunt 4` — enemies within 4 tiles must target him (he guarded Parvati's door) · Visarjana `discount-next 1` — your next card costs 1 less (he is honoured before every beginning) |
| 2 | **Hanuman** हनुमान | Sankat Mochan · Remover of Distress | Rakshak | 5 | 1790 | 120 / 1.2 s | medium | 0.8 | Avahana `leap` — may be placed anywhere in the lane, even past the midline, but not within 2 tiles of a banner · Nitya `shield-at 0.5 500` — at half HP he grows giant (*virāṭa-rūpa*) and gains a one-time 500 shield · `with "rama" { dmg 0.25 }` |
| 3 | **Narasimha** नरसिंह | Man-Lion · Protector of Prahlada | Rakshak | 6 | 2110 | 165 / 1.1 s | medium | 0.8 | Avahana `emerge-at-dhvaja` + `stun 1 radius=2.5` — he bursts from the pillar of your banner in that lane · Nitya `fury-below 0.5 dmg=0.4` — +40% damage while your banner in his lane is below half |
| 4 | **Vishnu** विष्णु | Palanhar · The Preserver | Rakshak (Trimurti) | 8 | 3530 | 225 / 1.4 s | slow | 1.5, `splash 1.5` (Sudarshana) | Nitya `guard 0.25` — allies in his lane take 25% less damage · `with "avatara" { guard 0.4 }` |
| 5 | **Kartikeya** कार्तिकेय (Murugan முருகன்) | Senapati · Commander of the Gods | Yoddha | 3 | 640 | 95 / 0.9 s | very fast (peacock) | 0.8 | Avahana `first-strike 2 reach=3` — his first blow is the Vel, thrown from 3 tiles |
| 6 | **Kālī** काली | Kālikā · She Who Is Time | Yoddha | 4 | 800 | 130 / 0.8 s | fast | 0.8 | Nitya `grow-on-withdraw 0.12 max=0.6` — +12% damage each time an enemy in her lane returns to light, up to +60% |
| 7 | **Durga** दुर्गा | The Invincible · Armed by All the Gods | Yoddha | 6 | 1640 | 205 / 1.0 s | medium (lion) | 0.8 | Nitya `gather 0.10 max=0.4` — +10% attack speed per other ally in her lane, up to +40% (the gods gave her their weapons) |
| 8 | **Shiva** शिव | Mahadeva · The Great God | Yoddha (Trimurti) | 7 | 2080 | 270 / 1.3 s | slow | 1.0 | Avahana `meditate 3` then `damage 420 target="lane"` — he sits still for 3 s (taking 50% less damage), then opens his third eye: 420 to every enemy **unit** in the lane |
| 9 | **Agni** अग्नि | Havyavahana · Bearer of Offerings | Dhanurdhara | 2 | 230 | 110 / 1.4 s | medium (ram) | 5, `splash 1` | — (a cheap, honest fire-thrower) |
| 10 | **Yama** यम | Dharmaraja · King of Dharma | Dhanurdhara | 3 | 460 | 150 / 1.3 s | slow (buffalo) | 5 | `every 8 first=0 { pull 3 root=1.5 range=6 }` — his noose (*pāśa*) pulls the farthest enemy within 6 tiles 3 tiles closer and holds it 1.5 s |
| 11 | **Surya** सूर्य | Dinakara · Maker of Day | Dhanurdhara | 4 | 640 | 50 / 0.4 s (beam) | medium | 5.5 | Nitya `ramp 3 over=3 units-only` — the beam on one target grows to ×3 over 3 s, from dawn to noon; it never ramps on banners |
| 12 | **Rama** राम | Maryada Purushottama · The Ideal One | Dhanurdhara | 5 | 790 | 280 / 1.6 s | medium | 6.5 | Avahana `first-strike 3 units-only` — *eka-bāṇa*, one arrow: the first arrow deals ×3 to a unit |
| 13 | **Vayu** वायु | Pavana · The Purifying Wind | Astra | 2 | — | — | — | width 4 | `damage 150 width=4` · `knockback 2.5` · `with "hanuman" { haste 0.4 seconds=4 }` (Hanuman is his son) |
| 14 | **Ganga** गंगा | Bhagirathi · She Who Descended | Astra | 3 | — | — | — | width 6 | `heal 60 dhvaja=25 width=6 seconds=5` — a river flows down the lane, healing allies 60/s and your banner 25/s · `with "shiva" { seconds 10 }` (he caught her in his hair) |
| 15 | **Parvati** पार्वती | Shakti · Daughter of the Mountain | Astra | 3 | — | — | — | width 5 | `haste 0.35 width=5 seconds=6` — allies move and strike 35% faster · `with "shaiva" { seconds 8 }` |
| 16 | **Indra** इन्द्र | Devaraja · King of the Gods | Astra | 5 | — | — | — | width 6 | `damage 520 targets=3 pick="highest-hp" width=6` · `stun 0.5` — the Vajra strikes the three strongest enemies |
| 17 | **Saraswati** सरस्वती | Vagdevi · Goddess of Speech and Learning | Sahayak | 2 | 450 | — | stationary, 12 s | — | Nitya `calm 0.2 radius=4` — her veena slows nearby enemy strikes by 20% · `reveal-next` — while she plays, you see the opponent's next card |
| 18 | **Lakshmi** लक्ष्मी | Shri · Fortune | Sahayak | 4 | 1000 | — | stationary, 27 s | — | `every 4.5 { prana 1 }` — +1 Prana every 4.5 s (6 in all; never above 10) |
| 19 | **Krishna** कृष्ण | Parthasarathi · Arjuna's Charioteer | Sahayak | 5 | 1500 | — | medium | — | `pacifist` — he never strikes (he vowed not to take up arms at Kurukshetra) · `every 5 { stun 1.2 radius=3.5 }` — his flute enchants nearby enemies · Nitya `inspire 0.25 radius=4` — allies near him deal +25% |
| 20 | **Brahma** ब्रह्मा | Srishtikarta · The Creator | Sahayak (Trimurti) | 6 | 1400 | — | stationary, 24 s | — | `every 6 { create "hamsa" }` — four golden swans in all (each 180 HP, 50 / 1.0 s, very fast, melee; not a card) |

**Tags for `with`:** `avatara` = Rama, Krishna, Narasimha. `shaiva` = Shiva, Parvati, Ganesha, Kartikeya. `shakti` = Durga, Kālī, Parvati, Lakshmi, Saraswati, Ganga. `vedic` = Indra, Agni, Vayu, Surya, Yama. `ramayana` = Rama, Hanuman. A card has at most one `with` line.

**Cost curve:** three cards at 2, four at 3, four at 4, four at 5, three at 6, one at 7 and one at 8 (pool average 4.35).

### 3.3 The budget model the numbers came from (keep it in `docs/balance.md`)
A unit's fighting value is roughly **HP × DPS** (Lanchester's square law), so its budget grows with **cost²**: `HP × DPS ≈ 11,000 × cost² × modifiers`. A plain 3-cost melee unit at medium speed works out to 900 HP × 110 DPS. The modifiers are: ranged ×0.55 · splash ×0.75 · fast ×0.85 · very fast ×0.75 · slow ×1.15 · ability weight ×(1 − w), with w between 0.08 and 0.35. Role decides how the budget splits, as the HP : DPS ratio: Rakshak 14–25 · Yoddha 5–10 · Dhanurdhara 3–5. Spells and supports are tuned in the sim against units of the same cost. The model only gives the sim a sensible start; the sim and the human have the last word.

### 3.4 The twelve Kshetras (sacred places; three are drawn per match, seeded)
Each lane is painted as one Kshetra. Its rule applies equally to both players. Kshetras are **mythic realms**: no present-day contested site is ever a battlefield (§7). Each Kshetra is unrevealed until its yuga (§2.2). Until then the lane is a plain cream scroll and its signboard reads `KSHETRA III · ?`.

| Kshetra | Rule (one line, on its signboard) | Words | Lead + support colours | Painted scene |
|---|---|---|---|---|
| **Kailash** कैलास | Shaiva cards cost 1 less here | `cost-cut "shaiva" 1` | limewhite + neel | the snow peak above the blue lake Manasarovar, Nandi far off |
| **Ksheer Sagar** क्षीरसागर | Units here regain 1.5% HP per second | `regen 0.015` | seafoam + limewhite | the milk-white ocean; Shesha's coils on the horizon (scenery only) |
| **Kurukshetra** कुरुक्षेत्र | All damage here +20% | `dmg-mult 1.2` | laterite + sindoor | an open plain, banners and distant chariots; no bodies, ever |
| **Swarna Lanka** स्वर्णलंका | Banners here have +30% HP | `dhvaja-hp 1.3` | haldi + marigold | a golden mythic city on the sea, not any real place |
| **Kishkindha** किष्किन्धा | Units here move 25% faster | `speed-mult 1.25` | tota + laterite | boulder hills and the Pampa river; vanaras in the trees (friendly) |
| **Dandakaranya** दण्डकारण्य | Ranged reach −1.5 tiles here | `reach-cut 1.5` | tota + peacock | deep forest, hermitage huts, fireflies |
| **Samudra Manthan** समुद्र मन्थन | Every 20 s, each player with a unit here gains 1 Prana | `amrit 1 every=20` | peacock + seafoam | Mount Mandara turning in the ocean, Vasuki as the rope (far background) |
| **Amaravati** अमरावती | Astra cards cast here cost 1 less | `cost-cut "astra" 1` | haldi + rani | Indra's cloud city, Airavata far off, the wish-granting tree |
| **Meru** मेरु | Banners here strike 30% faster | `dhvaja-haste 1.3` | marigold + khondalite | the golden axis mountain, terraces of light |
| **Patala** पाताल | Units placed here can't be targeted by ranged attacks for 3 s | `veil 3` | neel + peacock | glowing naga palaces in a vast cavern (gentle, not spooky) |
| **Satyaloka** सत्यलोक | The first unit each player places here is echoed once at 50% | `echo 0.5` | rani + haldi | a giant lotus, hamsas, soft dawn light |
| **Himavat** हिमवत् | Units here move 25% slower | `speed-mult 0.75` | limewhite + tota | deodar slopes, snow and streams; Parvati's father's mountains |

### 3.5 Starter decks (all in the deck builder; each has at most one Trimurti card)
- **Suryavamsha** (avg 3.4): Rama, Hanuman, Surya, Ganesha, Yama, Agni, Vayu, Saraswati
- **Shakti** (avg 3.4): Durga, Kālī, Lakshmi, Parvati, Ganga, Kartikeya, Saraswati, Agni
- **Kailash** (avg 3.9): Shiva, Ganesha, Kartikeya, Parvati, Ganga, Indra, Vayu, Surya
- **Vaikuntha** (avg 4.25; heavy and slow, unstoppable late): Vishnu, Rama, Krishna, Narasimha, Lakshmi, Agni, Vayu, Saraswati

Brahma is in no starter deck; players build him into their own.

### 3.6 Katha pages (the lore book; the successor to Kalinga Rush's lesson cards)
Every god has a page in ***Deva Katha — A Picture Reader*** (a fictional book). A page unlocks the first time you play that card. Each page has: `KATHA 07` · the god's name in Latin and Devanagari letters (plus a regional name where common: Murugan in Tamil) · a label, **LEGEND** (a story from a named text) or **TRADITION** (ritual or regional practice), set inside a Pattachitra-style border · 2–3 sentences for a 12-year-old · a "Did you know?" line that links the story to the card's rule · one fill-in-the-blank · a source key into `LORE.md` · a Devanagari page number (०–९).

**Rules:** never present mythic events as history, and never date them. Never make claims for or against the historicity of a mythic place or event. Every line is checked against its named source and cited in `LORE.md`. Store the pages in `content/katha.kdl`.

The seed lines below must each be verified and given a source before shipping (mark them **(verify)** until they are):
- **Ganesha**: in the Shiva Purana, Parvati made Ganesha to guard her door. He is worshipped before any beginning.
- **Hanuman**: in the Sundara Kanda of Valmiki's Ramayana, Hanuman leaps the ocean to Lanka to find Sita. He is the son of Vayu, the wind; *that is why Vayu's gust speeds him up.*
- **Narasimha**: in the Bhagavata Purana, Vishnu bursts from a pillar as the Man-Lion to protect the boy Prahlada, at twilight and on a threshold.
- **Vishnu**: he rests on the serpent Shesha on the cosmic ocean and carries the Sudarshana chakra, the conch, the mace and the lotus.
- **Kartikeya / Murugan**: he commands the gods' army. In Tamil tradition his mother, Parvati, gives him the Vel (spear). He rides a peacock.
- **Kālī**: in the Devi Mahatmya, Kālī springs from the brow of the Goddess in battle.
- **Durga**: in the Devi Mahatmya, the gods pool their powers into Durga and each gives her a weapon. *That is why allies make her stronger.*
- **Shiva**: he burned Kama with his third eye. His throat is blue because he held the poison from the churning of the ocean (Neelakantha).
- **Agni**: the Rigveda's very first hymn begins with Agni (*agnim īḷe*). He carries offerings to the gods.
- **Yama**: in the Rigveda he is the first mortal to die. In the Mahabharata, Savitri wins her husband Satyavan back from him through wit and persistence.
- **Surya**: he drives a chariot of seven horses with Aruna as charioteer. *That is the shape of Konark, a callback to Kalinga Rush.*
- **Rama**: in the Bala Kanda he breaks Shiva's great bow at Janaka's court. Kodanda is the name of his own bow in many tellings.
- **Vayu**: the wind, father of Hanuman and of Bhima.
- **Ganga**: brought down by Bhagiratha's prayers. Shiva caught her in his matted hair so the earth would not break.
- **Parvati**: the daughter of Himavat, the Himalaya. Through *tapas* she won Shiva. She is the mother of Ganesha and Kartikeya.
- **Indra**: his Vajra was made from the bones of the sage Dadhichi, who gave them freely. He rides the white elephant Airavata.
- **Saraswati**: goddess of learning, music and speech. She plays the veena and rides a swan. In the Rigveda she is also a river.
- **Lakshmi**: she rose from the churning of the ocean of milk.
- **Krishna**: before the war he offered to join one side without taking up arms, and he became Arjuna's charioteer. The Gita is his counsel at Kurukshetra.
- **Brahma**: the creator, born on a lotus from Vishnu's navel. His mount is the hamsa (swan).

---

## 4. Art direction: the Kalinga Rush look, unchanged, applied to a card battler

**Keep the reference's visual style and the Kalinga Rush palette.** On screen, Trilok Leela must read as the same family as Kalinga Rush. That means the same deep maroon page, the same huge cream headline, the same tracked gold line, the same painterly, detailed, layered scenes with hanging signboards, and the same warm, saturated 1970s–80s Indian textbook colours with gentle aged warmth. **Colour is still the main way this game creates nostalgia.** Borrow the look's structure, never the reference's actual images (§1).

If the reference screenshots are attached (`ref/`), treat them as the **style and layout target**. §4.1–4.4 are the **colour target**.

### 4.1 Frame and UI colours (identical to Kalinga Rush)
```
token        hex       role
frame        #4B211A   page background
frameEdge    #34140F   vignette / deepest edges
cream        #F4ECD8   headlines, the first title word, signboard titles, card names
gold         #D9BB6C   the yuga/clock line, URL, small rules, Devanagari names on cards
peach        #E0B09A   top label (`TRILOK LEELA · LEELA 3 · vs GARGI`)
peachTitle   #D89C80   second title word ("Leela")
```
Contrast on `frame`: cream 11.7:1 · gold 7.7 · peach 7.1. Don't set sindoor or rani text on the frame except at very large sizes.

### 4.2 Scene palette (identical to Kalinga Rush, plus deity and team tokens)
All of these live as tokens in the single `:root` of `src/screens/shared.css` (§8). Paint in tints and shades of them, but keep each scene's main masses recognisably these hues.
```
sindoor     #E8361F   vermilion: Sun team, flags, Yoddha frames, Hanuman's skin (sindoor-coated, as in tradition)
haldi       #FFC926   turmeric: diya flames, Prana, Astra frames, Surya, sun emblem
marigold    #FF9414   flames, garlands, Agni, festivals
rani        #E62C7E   rani pink: Sahayak frames, Satyaloka, Amaravati
tota        #38A845   parrot green: forests, Dhanurdhara frames, Kishkindha
peacock     #00909A   peacock teal: oceans, Rakshak frames, Kartikeya's peacock
neel        #26389A   indigo: night, Moon team, Kali Yuga, Pralaya, Patala
seafoam     #86D5C4   surf, Ksheer Sagar, pale skies
laterite    #B4502F   earth, plinths, diya bodies, Kurukshetra
khondalite  #776A60   stone, Meru, Dhvaja plinths
limewhite   #F6EFE0   snow, the milk ocean, Moon emblem, gulal highlights
chandan     #D38B55   warm skin for mortals and for gods whose tradition shows warm skin
skyCream    #F1DDB4   warm old-paper sky, the textbook sky colour; the veiled lane
— new in Trilok Leela —
megh        #3F5FB4   rain-cloud blue: the skin of Vishnu, Rama and Krishna (megha-shyama)
karpur      #E9E4DA   camphor-white with an ash cast: Shiva (karpūra-gaura), with a megh-blue throat
kalika      #23234F   deep indigo-black: Kālī's skin. Never lightened.
goldLeaf    #C9A23A   Tanjore-style gold leaf: Trimurti frames only
```
No neon tokens exist in this game.

### 4.3 Rules (Kalinga Rush §4.3, carried over)
1. **Same rendering as the reference:** painterly 2D illustration with soft gouache-like shading. Each lane is a detailed layered strip (sky, far silhouettes, mid scenery, near props, ground) with gentle atmospheric depth. Signboards are dark and hanging, with tracked gold and a cream title. No flat vector, no pixel art, no 3D.
2. **More colour than the reference:** each lane averages **0.33–0.55** HSV saturation (the reference sits near 0.21). Kali Yuga and Pralaya are exempt (§4.4).
3. **Skies like an old textbook:** warm skyCream at the horizon fading to pale seafoam or soft haldi. At night the sky is neel with haldi stars.
4. **One lead colour per Kshetra and 2–3 supports** (§3.4). The UI and collectible-like elements keep fixed colours: Prana diyas are laterite and marigold, the Sun team is sindoor and haldi, the Moon team is neel and limewhite.
5. **A light nostalgic finish:** fine paper grain and a faint warm cast over the battlefield, plus an optional faint halftone in large flat areas. Keep it subtle.
6. **Hits and returns are festive, never violent.** A hit throws a puff of **gulal** (coloured powder) in the striker's team colour, plus a flick of light. A returning god folds into a lotus and rises as light, and petals drift down (*visarjana*). There is no blood, no red damage flash on any deity, no corpses and no screen-shaking gore.
7. **Deity iconography follows tradition** (§7): correct number of arms, weapons, mudras, vahanas and skin colours. Mortals (sages, crowds, vanaras' human companions) are always warm brown (chandan / laterite), never pale or pink "default" skin.
8. Greys come from khondalite or desaturated tints of the palette, never neutral grey.

### 4.4 Colour arcs
**The yuga arc** is a light grade over all three lanes, through `--look-*` tokens. It is part of the story:
```
Satya    dawn      skyCream + haldi + limewhite, the clearest, brightest light
Treta    midday    marigold + tota + peacock
Dvapara  dusk      sindoor + rani + laterite, long shadows
Kali     night     neel + haldi lamps and stars (saturation band 0.25–0.45)
                   On entry the print misregisters for ~400 ms: the colour plates slide apart and snap back,
                   a callback to Kalinga Rush's fake ending. Reduced motion turns it into a simple fade.
Pralaya  cosmic    deep neel + seafoam. The three lanes dim; far behind them Vishnu rests on Shesha on the
         ocean     cosmic ocean, a faint, respectful silhouette. Only the banners' lamps glow.
```
**Class colours** are on card frames and sigils only (§3.1). **Kshetra leads** are in §3.4.

### 4.5 Indian colour traditions to draw on (verify each before release; cite in `LORE.md`)
- **Pattachitra** (Odisha): hingula red, haritala yellow, conch-shell white, lamp-black and an indigo-type blue. Use it for the Katha page borders and the class-colour card borders (flowers, fish, conch, creeper).
- **Pipili appliqué** (Odisha): layered cut-cloth in vivid colours with visible stitched edges. Use it for the **Dhvaja banners** and the Mahadhvaja (sun or moon emblem, elephants, parrots, flowers).
- **Tanjore painting** (Tamil Nadu): gold leaf and inset "gems". Use it for the Trimurti card frames, in `goldLeaf` and nothing else.
- **Kalighat pat** (Bengal): bold, sweeping outlines. These may inform the brush line on card art, especially for Kālī and Durga.
- **Kerala mural** palette (ochres, green, white, black): a reference for Kartikeya/Murugan's card art, applied within our palette.

### 4.6 Layout (match Kalinga Rush)
**Portrait (phone), top to bottom:**
```
maroon page
  TRILOK LEELA · LEELA 3 · vs GARGI            ☀▲▲▲  ☾▲▲▲    ← peach tracked caps; banner score (folded = lowered)
  TRETA YUGA · 1:42 · PRANA ×1.5   [die: 3]                  ← gold tracked caps
  Hanuman leaps                                               ← huge cream headline, two lines max,
  the ocean.                                                     Inter Tight 900, tracking −0.03em
  ─────────────────────────────────────────────  thin light edge line (as in the reference)
  [ Lane I   · Kshetra strip · signboard hangs at the midline ]
  ─ thin cream scroll rule ─
  [ Lane II  · Kshetra strip ]                                 ← battlefield window, logical 1280×960:
  ─ thin cream scroll rule ─                                     three 1280×300 lanes + two 30 px rules
  [ Lane III · Kshetra strip ]
  ─────────────────────────────────────────────
  ◉◉◉◉◉◉◔○○○  6 / 10                                          ← Prana diyas
  [card][card][card][card]    next ▸ [card]                    ← the hand, on quiet maroon
```
- One tile is 64 logical px. A unit stands about 1.6 tiles tall. On a 390 px-wide phone a unit must be **≥ 28 CSS px tall** and a card in hand **≥ 72 CSS px wide**. If those minimums fail, shrink the header, never the lanes.
- **Landscape / desktop:** the header shrinks to a slim strip (label · yuga line · one-line headline). The battlefield fills the centre and the hand sits along the bottom.
- **The title-card system:** the headline changes on these events: match start, each yuga, each Kshetra reveal, each card's *first* play in a match (its `line` from `cards.kdl`), each banner lowered, Pralaya, and the result. At most one change every 3 s; events wait in a queue with priorities. Examples: "Narasimha bursts from the pillar." · "The banner of Kishkindha is lowered." · "Kali Yuga. Everything at triple speed." · "Pralaya. First banner lowered wins." · "Trilok Vijay."
- **Hanging signboards:** one per lane, hanging at the midline. It is a dark board in the frame colour with tracked gold `KSHETRA II` and the cream title `KISHKINDHA`, and the rule beneath in small cream text.
- **Title screen,** laid out like Kalinga Rush's: huge cream "Trilok" over peach "Leela", a "Play at …" line with the URL in gold, a short gold rule, then two lines of muted cream: *Twenty gods. Three worlds. Four ages.* / *The dice are still rolling on Kailash.* Behind it is a painted vignette of Shiva and Parvati at their game of dice on Kailash. The vignette is inspired by the idea of the Ellora panels but copies none of them. It is quiet and affectionate, and the dice board becomes the three lanes when you press Play.

### 4.7 Cards and textbook touches
- **Card face (5:7):** painted hero art fills the card. The god's weapon or aura breaks over the top edge of the frame. The thin border is Pattachitra-style in the class colour; Trimurti cards use goldLeaf in the Tanjore style. Top-left is the **Prana cost in a diya badge**: a laterite lamp, a haldi flame and a cream numeral that turns tota when a Kshetra discounts it. Top-right is the class sigil. The bottom plate is in the frame colour, with the name in cream Inter Tight 800, the Devanagari name in gold Baloo 2, and the epithet in small peach tracked caps.
- **Card detail** (long-press or right-click): the Avahana, Nitya and Visarjana lines, the stats as small icons, and a link to its Katha page.
- **Hero art:** heroic, comic-book energy (low angles, strong rim light, glowing astras) painted in the textbook palette and gouache finish, so it sits inside the maroon frame without clashing. Faces are serene and warm, never grim or snarling. Fierce forms (Narasimha, Kālī, Durga) are fierce in power, not in cruelty.
- **On-field sprites:** compact heroic proportions, about 4–5 heads tall, with bold silhouettes. Each god's signature attribute must read at 28 px: Ganesha's elephant head, Hanuman's mace, Rama's bow, Shiva's trident and crescent, Vishnu's chakra, Durga's lion, Kartikeya's peacock, Saraswati's veena, Lakshmi's lotus, Krishna's flute and peacock feather. Frames: idle, walk, strike, *avahana* (descent) and *visarjana* (lotus return).
- **Katha pages** slide up as cream textbook pages (the `cream` card with `frame` text). Each has a seafoam "Did you know?" box, a dotted fill-in, a red tick once unlocked and a Devanagari page number. The back cover can carry a printed price ("Price ₹ 2.50") and "Printed at Trilok Press" (both fictional).
- The **Leela Report** (§2.7) uses the same cream card style.

### 4.8 Typography (Google Fonts)
- Headlines and title: **Inter Tight** 800–900 (or **Archivo** 800–900), letter-spacing about −0.03em, two lines max.
- Label and yuga line: the same family, bold, all caps, letter-spacing 0.25–0.3em.
- Body, Katha text and all Devanagari: **Baloo 2**. Tamil (Murugan): **Baloo Thambi 2**. Fallbacks: Noto Sans Devanagari and Noto Sans Tamil.
- Use Devanagari sparingly and correctly: card names, Kshetra names, yuga names on signboards, the report stamps and page numerals. **Every Indic-script string must be checked by a native reader before release.** Keep them in `STRINGS_TO_VERIFY.md` (title त्रिलोक लीला, the 20 names, the 12 Kshetras, the yugas, प्राण, ध्वज, आवाहन, नित्य, विसर्जन, कथा, the stamps विजय / पुनः / सम).

### 4.9 Avoid
A flat-vector or "corporate" look · cream-paper backgrounds for the main frame (the frame stays maroon) · muddy sepia · pastel washes · neon of any kind · pale default skin on mortals · lightening any deity's traditional skin colour · grimdark or gore · sexualised depictions · copying any shape, card frame, composition or character design from Marvel Snap, Clash Royale, Marvel, Amar Chitra Katha, Ellora's panels or any other work · real logos.

### 4.10 Art pipeline (as in Kalinga Rush, inside the game-bible's homes)
Painted illustration is the target, and procedural shapes alone will not reach it. So:
- Build every Kshetra, card frame, banner and god first as **procedural placeholder painters** in the right palette and layout: layered gradients, silhouettes and attributes. These are scripts in the repo, so the game is fully playable and every story renders.
- Write `ASSETS.md`. For each Kshetra, include one image-generation prompt per lane layer (sky, far, mid, near, ground). For each god, include a card-art prompt and a side-view sprite-sheet prompt; also cover the Dhvaja, the Mahadhvaja and the title vignette. Each prompt states: painterly 2D; soft gouache-like shading; the colours of a 1970s–80s Indian children's textbook illustration; the hex codes of the scene's lead and support colours; the exact traditional iconography from `LORE.md`; a transparent background for every non-sky layer and every sprite; wide strips that tile horizontally for lanes; no text, no logos, no likeness of any real person, and no resemblance to Marvel or other existing characters.
- Content points at the painted files (for example `art/kishkindha/far.webp`). If a file exists, load it; otherwise fall back to the procedural painter.
- All painted art must pass colour QA (§4.11) **and the respect review** (§7) before it ships.

### 4.11 Colour QA (automate it as a script; report, don't lint)
- Every hue is a token in the one `:root`. The game-bible tweak map and `game-bible-tidy` keep it there; propose no new lint guard (the game-bible leaves new guards to the human).
- A `Palette` story shows the frame colours, the scene palette, the deity and team tokens, the class colours, the Kshetra leads, the yuga grades, and every text/background contrast pair.
- `scripts/colour-qa.mjs` uses the starter's `shots` script to screenshot every Kshetra story at three moments, in each yuga, in portrait and landscape. It checks that lane mean saturation is within the band for that yuga, that the Kshetra's lead hue is among the three largest hue groups, that no neon pixels appear, and that the frame is within ΔE 5 of `frame`. It writes the results to `docs/colour-report.md`.
- A unit test checks that every UI text/background pair meets WCAG AA.

---

## 5. Balance: easy to learn, deep to master, always fair

- **Each class has a job and a counter** (§3.1). No card may be unanswerable. Every card must have at least two cheaper counters in the pool, and the sim proves it.
- **Balance sim** (`npm run sim`, on the pure core): Guru vs Guru, 5,000+ matches. It uses random legal decks plus every starter-deck pairing, and seeded Kshetra draws. It reports:
  - each card's win rate when in a deck; target **45–55%**
  - each class's win rate; target **47–53%**
  - each starter deck against each other starter deck; target **40–60%**
  - left-side vs right-side win rates within ±1 point (the board is symmetric, so prove it)
  - Pralaya rate **10–25%**; Trilok Vijay rate **≤ 20%**; regulation finish in **≥ 75%** of matches
  - no card in more than 60% of the top-10% decks
  - **the actual cause of every lowered banner**: which card dealt the damage, not which card was nearest (the Bulwark lesson from the Liora Labs post)
  - Prana wasted per yuga, and the Kshetra win-rate skew
- **Golden runs:** fixed seeds whose results are snapshot-tested, so a rule change that moves them is caught.
- **The agent reports; the human decides.** When a number is out of band, the agent writes the finding, the evidence from the sim, and 1–3 levers (for example: "Surya: lower the ramp from ×3 to ×2.5, or raise his cost to 5"). It never silently retunes, and it prefers changing a **word** over changing a stat when the problem is behaviour, not size.
- **Readable difficulty:** Taapoi's tutorial matches use only two lanes and no Kshetras until match 3. Assist mode (Settings) makes the bot react more slowly and gives your banners +25% HP; the report is stamped "Assisted".

---

## 6. Audio (original, procedural Web Audio)
- **Instruments,** synthesised or recorded originally: mridangam and dhol patterns, manjira (cymbals), bansuri, veena, harmonium drone, temple bells, the **shankh** (conch) for the match start, yuga turns and every lowered banner, and the damaru for Shiva's third eye.
- **Tempo follows the yugas:** Satya ~84 BPM → Treta ~96 → Dvapara ~112 → Kali ~132 (double-time percussion) → Pralaya, a low drone with an accelerating damaru.
- **Signature cues:** Krishna's flute phrase when his enchantment fires · Saraswati's veena while she plays · Vayu's rising wind · Ganga's river shimmer · Lakshmi's soft bells on each Prana.
- **No recited mantras or sacred chants as sound effects, ever.** Conch and bells are ceremonial cues only.
- Audio is muted until the first input (autoplay rules). Music and SFX have separate toggles. No copyrighted songs or samples.

---

## 7. Respect and accuracy rules (non-negotiable)

Games that have put Hindu deities into combat have drawn sustained protest. A well-known case is the 2012 protest by Hindu groups against SMITE's depiction of Kālī and other deities. This game must be one a devout grandmother could watch over a child's shoulder and smile at.

1. **Leela, not war.** No deity is ever killed, wounded, bloodied, humiliated or shown being "defeated". Units *return to light* (visarjana). Hits are gulal and light (§4.3).
2. **No ranking of gods.** In-game text celebrates the move, never a loser. "Shiva beats Vishnu" and similar lines are banned everywhere: headlines, tips, the report, store copy. Counters are mechanics, not theology. Never frame Shaiva, Vaishnava or Shakta traditions as rivals.
3. **Iconography as tradition shows it:** the right arms, weapons, mudras, vahanas and skin colours, recorded per god in `LORE.md`. Attire is modest and traditional. **No sexualisation of any deity, ever.** Kālī follows a stylised Dakshina-Kālī iconography: no realistic severed heads, no blood, and her dark skin is never lightened. Have her depiction reviewed by Shakta practitioners.
4. **No deity is a joke, a mascot or a taunt.** Emotes are blessings only (§2.5). Gods are never stepped on, thrown or used as projectiles. Ganesha is never the "cute fat" punchline, and Hanuman is never a "monkey" joke.
5. **No present-day contested sites.** Ayodhya, Mathura, Kashi/Varanasi and any other site in current dispute never appear as Kshetras, and no real temple is ever a battlefield, an obstacle or a target. Shrines and divine abodes appear only as distant scenery.
6. **No political or communal slogans** in UI, audio or emotes, including chants that are used in present-day politics.
7. **Scope stays honest.** The 20 cards come from Hindu traditions. The Buddha, the Jain Tirthankaras and the Sikh Gurus are never cards: their own traditions do not treat them as gods to be fielded in a contest, and their followers would rightly object. Jagannath, Balabhadra and Subhadra stay off the battlefield, carrying Kalinga Rush §7 forward.
8. **Mythology is labelled.** Every Katha page names its text. Nothing mythic is dated or presented as history, and no claim is made for or against the historicity of any mythic place or event.
9. **Regional diversity, accurately:** Kartikeya is also Murugan, Kālī's art may draw on Bengal, Rama's bow is Kodanda in southern tellings, and so on. Every name and spelling goes in `STRINGS_TO_VERIFY.md`.
10. **Practitioner review before release.** Write `REVIEW.md`: a checklist per god (art, sprite, card text, Katha page, audio cue), signed off by reviewers from the relevant traditions. The respect rules also go to the look critic (§9, Phase 5): the critic fails any frame that breaks them.
11. **No real brand logos and no Marvel IP** (§1).

---

## 8. Tech spec: the game-bible stack

- **Follow the `game-bible` skill.** A new game begins as a **copy of its `starter/`**, runs its tests green, and only then replaces the placeholder game. Keep the engine (`src/decl`), `content-load.ts`, `clock.ts`, `rng.ts` and the guard tests as copied.
- **Stack:** TypeScript (strict), Vite, **Pixi v8** (2D), **KDL** for content and screens, the **CSS dialect** for look and motion, **zustand** (vanilla), **zod** at trust boundaries (content, saves), **Storybook** (`@storybook/html-vite`) and **vitest**. No React or JSX. It is a static build with no backend.
- **Functional core, imperative shell.** The match is `(state, action) → state`: pure, with a seeded RNG in the state and time passed in as an argument. Each transition appends `events` (`{ type: 'visarjana', card: 'kali', lane: 2 }`), and the shell animates from them. The 1D lane simulation runs at a fixed 30 Hz step on the core; rendering interpolates.
- **The tweak map for this game** (each kind of change has one home; when a change fits no row, add the row and say so):

| Change | Home |
|---|---|
| A god card: cost, class, stats, words, epithet, Avahana `line`, tags | `content/cards.kdl` |
| A Kshetra: name, rule words, lead/support tokens, painted layers | `content/kshetras.kdl` |
| Yugas: order, die face, seconds, Prana multiplier, reveal, grade token, headline | `content/match.kdl` |
| Banners: HP, hit, range, positions; deck rules (8 cards, 1 Trimurti) | `content/match.kdl` |
| Bots: names, reaction time, Prana habits, starter decks | `content/bots.kdl`, `content/decks.kdl` |
| Katha pages and their source keys | `content/katha.kdl` (+ `LORE.md`) |
| A number a rule reads (tile size, base Prana rate, spell-vs-banner factor, sight range) | `src/tuning.ts`, with the unit in the name and the reason beside it |
| Every hue, team colour, deity skin token, class colour and yuga grade | a token in `src/screens/shared.css :root` |
| How the render looks: grain, warm cast, halftone, misregister amount, depth haze | `--look-*` tokens in the same `:root` |
| Screens: title, deck builder, match header, hand, Katha book, report, settings | `src/screens/<screen>.kdl` + `.css` |
| A behaviour word | its registry in the core module that owns the rule, plus a catalog row and a test |
| A procedural painter or bespoke visual (gulal puff, lotus return) | an fx function in the shell, or a `defineElement` in `screens/shared.ts` |

- **Content sketches** (the agent finalises the shape in Phase 1): see `content/cards.kdl` and `content/match.kdl` for the finalised shape.
- **Saves:** zustand `persist` with zod validation on rehydrate. Save the unlocked Katha pages, decks, settings and stats. Every storage read and write is in try/catch, and the game works without storage.
- **Accessibility:** Assist mode; reduced motion (no misregister, no shake, softened gulal); team **shapes** as well as colours; scalable Katha text; full keyboard play (§2.5); a pause that freezes the clock.
- **Debug URL params:** `?card=hanuman` (sandbox with that card), `?kshetra=kishkindha,meru,patala`, `?yuga=kali`, `?seed=123`, `?bot=gargi`, `?god=1` (your banners can't fall), `?palette=1` (opens the Palette story).
- **Reel mode** `?reel=1`: a 1080×1920 portrait layout with the header-over-battlefield composition. Gargi plays Gargi, and the camera dwells on headline moments for a ~45 s screen-recordable reel. Optional hook cards in the title-card style: *"What if India's gods had their own card game?"* → *"So I painted twenty of them."*
- **Performance:** 60 fps on a mid-range Android phone. Load painted layers per Kshetra lazily, and keep a texture atlas per god. Lighthouse performance ≥ 90 on mobile.

---

## 9. Build order: the Liora Labs workflow, with human gates

Commit after every step. Never mix foundation work with feature work in one commit. Each gate ends with a short report to the human: what was built, screenshots, test-output tails, and open questions. **Stop at every gate and wait.**

### Phase 1 — Vocabulary before content (no game rules yet)
1. Copy the game-bible `starter/`, rename it, and get all tests green. Commit "Start from the game-bible starter".
2. **Palette and look first:** put every token in §4.1–4.4 into the one `:root`, and every `--look-*` (grain, warm cast, halftone, misregister, yuga grades) beside them. Build the **Palette story**.
3. **Content kinds** as zod schemas handed to `loadKdl`: `card`, `kshetra`, `yuga`, `pralaya`, `dhvaja`, `deck`, `bot`, `katha`. Load the **real data** from §3 into `content/*.kdl` now, as content and not code. The words parse but do nothing yet.
4. **Behaviour words**, each a small pure function in the registry of the core module that owns its rule, with one catalog row and one test each. **Reuse before you add.** Triggers (`avahana`, `visarjana`, `every`, `with`) wrap words rather than multiplying them. Proposed set:
   `hp hit speed reach splash stationary lifetime · taunt leap shield-at emerge-at-dhvaja fury-below guard first-strike grow-on-withdraw gather meditate damage knockback pull stun ramp heal haste calm reveal-next prana create pacifist inspire discount-next dmg · cost-cut regen dmg-mult dhvaja-hp speed-mult reach-cut amrit dhvaja-haste veil echo`
5. **Screen prefabs** (KDL and CSS): `title-card` header (label, yuga line, headline), `signboard`, `card` (face, hand-size, detail), `prana-diyas`, `banner-score`, `long-die`, `katha-page`, `report-card`, `emote`. **Keyframes:** `title-card-in`, `yuga-turn`, `kshetra-unfurl`, `misregister`, `avahana-descend`, `visarjana-lotus`, `banner-lower`, `gulal-puff`.
6. `docs/declarative-ui.md` (the catalog) lists every word, kind, prefab, token and keyframe, and the drift test passes.

**→ GATE 1 (human):** open the Palette story and the catalog. Tune colours and look numbers directly in CSS. Approve, rename or merge words. Nothing proceeds until the vocabulary is approved.

### Phase 2 — Storybook as the shared visual check
Write a named story for each situation, mounting the real renderer with procedural placeholders. Each story **sets up core state directly** and has a `play` function that drives the real canvas through the tap driver and **asserts the behaviour**. A story fails if the behaviour doesn't happen. At minimum:
- **One story per card** (20). For example:
  - *Ganesha:* fails unless all three enemy Kartikeyas within 4 tiles target Ganesha.
  - *Krishna:* fails if Krishna deals any damage in 20 s, or if enemies within 3.5 tiles are not enchanted every 5 s.
  - *Surya:* fails unless the beam on a single Vishnu reaches ≥ 2.9× its first tick after 3 s, and fails if it ramps on a banner.
  - *Hanuman + Rama:* fails unless Hanuman's hits are 25% bigger only while Rama shares his lane.
  - *Ganga + Shiva:* the river lasts 10 s with Shiva in the lane and 5 s without.
  - *Shiva:* the third eye hits every enemy unit in the lane and never a banner.
- **One story per Kshetra** (12). For example, *Kishkindha:* a unit crosses the lane 25% faster than in a plain lane.
- **Match stories:** *Yugas* (Prana per minute ×1 / ×1.5 / ×2 / ×3 within 2%, lanes II and III reveal on time) · *Pralaya* (the first lowered banner ends the match) · *Mahadhvaja* (can't be damaged until that lane's Dhvaja falls) · *Trimurti* (the deck builder refuses a second Trimurti card) · *Respect* (a defeated god always plays `visarjana-lotus`; no deity sprite is ever tinted red on hit; no emote other than the four blessings exists).
- **Screen stories:** *Header* (every `line` in `cards.kdl` and `match.kdl` fits in two lines at 390 px wide) · *Hand* (dragging a card onto lane II at tile 6 plays it there) · title, deck builder, Katha book and Leela Report each get their own story.

**→ GATE 2 (human):** review every story by eye in Storybook and nitpick. `npm run test:stories` must pass headless.

### Phase 3 — The base build (same commit order as the PRISMFALL run in the post)
1. **Foundation:** confirm the copied declarative UI engine, content loader and clock (already done in Phase 1).
2. **Core:** match state; the step rule (a fixed 30 Hz lane sim); targeting, blocking and deploy zones; Prana and yugas; banners and win rules; every behaviour word wired; the bots (Taapoi, Nachiketa, Gargi).
3. **Shell:** stores, actions and runtime; the Pixi battlefield (three lanes with parallax layers, procedural painters, units reconciled by id); drag-to-play input; header title-card queue; synth audio; screens.
4. **Foundation guards:** catalog drift and screen imports, as copied. Keep `CORE` in step as core modules arrive.
5. **Stories:** all of Phase 2 passing against the real core.

The **vertical slice** is one complete match against Taapoi in portrait on a phone, with procedural art. Then screenshot it in portrait and landscape and compare against `ref/kalinga/` for layout and against §4 for colour. If it reads as flat vector, cream paper, muddy sepia or garish, fix that first.

**→ GATE 3 (human):** play five matches on a phone with one thumb. Report what felt good and what didn't.

### Phase 4 — Balance sim and the honest report
Build `scripts/sim.ts` with real bots and every metric in §5. Run it. Write `docs/balance-report.md` with the tables, the banner-cause ledger and a difficulty chart. List every out-of-band number with 1–3 levers each. **Change nothing until the human picks a lever.** After the human decides, apply the change, re-run, and report before and after.

**→ GATE 4 (human):** decide the balance levers.

### Phase 5 — The look: a Gauntlet Loop with a blind critic
Run this as its own session. The prompt to paste:
> You are the art director for Trilok Leela. The bar is in `ref/kalinga/` (the look we already shipped) and `ref/madras/` (the reference that look came from). Find and keep them open before you start. The rules, content numbers and tuning must not change: the core modules, `tuning.ts` and every stat in `content/*.kdl` change by **zero lines**. Only painters, `src/view/`, CSS, art files and stories may change. Work piece by piece: each Kshetra strip, the card frames, each god's card art and sprites, the banners, the header and the title screen. For each piece, render its story, take a real screenshot (`npm run shots`), and hand that screenshot and one reference screenshot, unlabelled and in random order, to a **fresh critic subagent** with no history and no explanation from you. The critic judges which is the stronger piece of craft (painterliness, depth, colour, type, finish) and whether ours belongs to the same family. It names the single biggest gap, and it also fails any frame that breaks §7 (iconography, dignity, no gore, no sexualisation). Fix the biggest gap and repeat. If the critic can tell which one is ours because ours is weaker, keep going. Don't stop after three rounds. Run colour QA (§4.11) every round. Log each round's verdict in `docs/look-log.md`. Stop when the critic is genuinely impressed, or when I stop the run.

Painted assets from `ASSETS.md` may be dropped in during this phase. They go through the same critic and the same respect check.

**→ GATE 5 (human):** side by side with Kalinga Rush, it reads as the same family. Sign off the art per god in `REVIEW.md`.

### Phase 6 — Katha book, Leela Report, settings, accessibility, audio polish
Build these from the existing vocabulary. Any new word goes in first, alone, with its catalog row.

### Phase 7 — Reel and trailer (a fresh agent)
Send one prompt to a fresh session: *a 30-second motion-graphics reel in the title-card style, made only from real game footage (`?reel=1`) and real assets, with a custom track keyed to the cut, rising through the four yugas, and no voiceover.*

### Phase 8 — Living with it: small requests to fresh agents
- Every later change (for example "make Shiva's third eye feel bigger", "add Garuda as card 21", "Patala feels unfair") goes to a **fresh** session with only the repo, the catalog and the game-bible skill.
- The agent climbs the ladder: an existing word → content → CSS → `tuning.ts` → a pure rule → only then a new word.
- It **diagnoses before fixing**: log the actual cause in the sim before touching numbers. It runs the sim before and after, and it reports anything that moved.
- After any burst of agent work, run `game-bible-tidy`.

### Definition of done
- Every card, Kshetra and yuga has a passing story, and the sim's numbers sit inside every §5 band, or out-of-band numbers have a human-signed exception in `docs/balance-report.md`.
- Colour QA passes for every Kshetra in every yuga, and every UI text pair meets WCAG AA.
- Every Katha line matches `LORE.md`; every Indic string is in `STRINGS_TO_VERIFY.md` with a reviewer's tick; and `REVIEW.md` is signed for all 20 gods.
- Side by side with Kalinga Rush, it reads as the same style.
- Lighthouse performance is ≥ 90 on mobile.
- The designer test passes: you can change any god's cost, any colour or any Kshetra rule without opening a `.ts` file.
- It is fun on a phone with one thumb, and the last twenty seconds of Kali Yuga make your heart race.

---

## 10. Sources (seed `LORE.md` and `docs/workflow.md`; add more as you verify)

**Workflow**
- Liora Labs, *Agentic Speed, Human Control in Game Dev* (29 Sep 2026): lioralabs.dev/blog/agentic-speed-human-control
- The `game-bible` and `game-bible-tidy` skills and the starter: github.com/LioraLabs/claude-plugins/tree/main/plugins/game-bible
- Matt Shumer's Gauntlet Loop: somethingbig.ai/gauntlet-loop
- KDL: kdl.dev · Storybook: storybook.js.org

**Visual**
- Your Kalinga Rush brief and build (`ref/kalinga/`); Madras Rush, madras.v40.in/rush (`ref/madras/`)
- Pattachitra: en.wikipedia.org/wiki/Patachitra · Pipili appliqué: incredibleindia.gov.in (Pipili) · Tanjore painting, Kalighat painting and Kerala murals: their Wikipedia pages **(verify each claim)**

**Lore** (start from these, then cite the primary text on each Katha page)
- Yuga names from the throws of a dice game marked 4-3-2-1, and the 4:3:2:1 durations: en.wikipedia.org/wiki/Yuga_cycle
- Shiva and Parvati playing dice on Kailash, carved at Ellora (Caves 14, 15, 21, 29): esamskriti.com (Ellora Cave 29) · hindu-blog.com (Hindu caves of Ellora)
- Rigveda 1.1 begins with Agni: en.wikipedia.org/wiki/Mandala_1
- Indra's Vajra from Dadhichi's bones: en.wikipedia.org/wiki/Dadhichi · en.wikipedia.org/wiki/Vajra
- Devi Mahatmya (Durga armed by the gods; Kālī from the Goddess's brow) · Valmiki Ramayana (Bala and Sundara Kandas) · Mahabharata (Krishna's vow; Savitri) · Bhagavata Purana (Narasimha) · Shiva Purana (Ganesha at the door) · Rigveda 10.14 (Yama). Use reputable translations, and give a Wikipedia entry point for each god.

**Respect**
- The SMITE controversy (2012) as a cautionary case: engadget.com (27 Jun 2012 and 31 Jul 2012) · kotaku.com (Hindu group wants religious arena combat game pulled)
