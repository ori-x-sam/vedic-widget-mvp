# Jyotsna Mahal — the game brief

*Seven nights to the full moon.*

This is the design brief for the game. Every agent reads it before touching the repo. It says what the game **should be**. The `game-bible` skill says how the code is built. The KDL and CSS say what the game **currently contains**. When this brief and the content disagree, don't quietly pick one: flag it in your report.

---

## 1. The pitch

Autumn 1946. In the sal jungles of the Orissa hill states, in a princely state the maps barely bother with, the Raja's half-brother — the best shikari in the hills — went into the palace one night and, the palace says, came out as a tiger's dinner. His mother doesn't believe it. Neither does the Political Agent, who cannot accuse a ruling prince without proof.

So **Inspector Ambrose Thistlewood** of the Calcutta Police arrives with a folding plate camera, a steamer trunk and a cover story: he is here to photograph the Raja's Kumar Purnima celebrations for a souvenir album. He has seven nights, one for each night the moon takes to grow full.

By night he slips out of a bolted guest room and works through the palace one wing at a time. Each wing is an escape room that gives up one piece of the truth. By day he drinks, hunts, plays cards and laughs at the Raja's jokes, because the Raja must never wonder why the photographer keeps asking questions.

First person, like BioShock. Campy like a gothic melodrama that knows exactly what it is. Frightening the way a locked door nobody will open is frightening.

---

## 2. Where and when

**Chandragarh** — a fictional Garhjat princely state in the hills of interior Orissa (today's Odisha), one of the Orissa States under a British Political Agent. Sal and bamboo jungle on laterite and granite hills. Tigers, sloth bears, wild boar, chital, jackals, hill mynahs. A village at the palace gates, a temple, a waterfall a morning's ride away. The nights take place entirely inside the palace; the days range a little further — the verandahs, the gardens, and the jungle for the shikar and the drive in.

**Jyotsna Mahal, "the Moonlight Palace."** Why it looks Rajasthani in Odisha: the dynasty claims Rajput descent, as many Garhjat houses did, and in the 1700s a Raja married a princess of Mewar who brought her own masons east. They built in pink sandstone and white marble on a granite ridge above the jungle: jharokhas, jaali screens, cusped arches, chhatri domes along the roofline, a mirror hall, a zenana behind lattices, a stepwell in the inner court.

**The Durbar Wing.** In 1911 the old Raja went to the King-Emperor's coronation durbar at Delhi and came home in love with the modern age. He bolted an Edwardian wing onto the palace: a durbar hall under Belgian crystal chandeliers, a billiard room, a music room of phonographs and wax cylinders, a magic-lantern theatre, and a dynamo house that lights the wing — and the kitchens' ice machine and cold larder — with electricity, when it works. He died in 1931. Nothing has been dusted since. This is where the BioShock Infinite grandeur lives: a whole optimistic age, gilded, preserved and rotting.

**1946.** Independence is a year away, and the princely states will be swallowed soon after. Everyone in the palace can feel the floor tilting. The Raja drinks more. The Political Agent is nervous. The Empire that sent Thistlewood is packing its bags, and he knows it. Use this as atmosphere, never as a lecture.

**The calendar.** The game runs from a half moon to **Kumar Purnima**, the full moon of Ashwin, when Odisha celebrates the moon and the night traditionally ends in games of dice and cards. The moon is the game's clock: every night it is visibly fuller, sits in a different place in the sky, and throws different patterns through the jaalis.

---

## 3. The voice

The tonal source is the short story in `reference/`: Manoj Das, *A Trip into the Jungle*, from *Mystery of the Missing Cap and Other Stories*. Read it once before working on anything the player reads or hears. **Never copy its sentences, dialogue or character names into the game.** Learn its moves instead:

- **Irony in the narration.** The prose never tells you what to think of the rich. It describes them precisely and lets you laugh, then flinch. Its metaphors are domestic and slightly grotesque — food, animals, household things — dropped mid-sentence onto a person.
- **The civilised going primitive.** Educated, bored, wealthy people give themselves permission to be savage, with a philosophy ready to excuse it. Their manners survive the savagery perfectly intact.
- **The dignified outsider.** The one person in the party with real grace is the one they rank lowest, and his quiet refusal to be impressed is what they cannot forgive.
- **Horror by implication.** Nothing is shown. A room isn't opened. A question isn't answered. The worst thing is the thing everyone agrees not to check.
- **Repetition as dread.** A knock repeated at intervals. A line said three times until it stops meaning anything and starts meaning everything.
- **An ending that won't close.** The engine noise drowns out everything, and we never quite know.

**Camp plus horror, the recipe.** The characters are played at full volume — the Raja's laugh, the philosopher's lectures, the delicate lady's swoons, the sour wife's sniff — and the game enjoys them. The horror sits underneath the comedy and is never played for laughs: the larder, the knock, the ash pit. **The jackals behind the palace are the game's laugh track**: they howl on cue after a punchline, and sometimes when there wasn't one. Gore is never shown. A menu card does the work.

**Thistlewood's voice.** His casebook is prim, dry and precise, and gets a little less prim each night. He notices clothes, smells and lies. He is the straight man; the palace is the comedian; the jungle is the audience.

---

## 4. The player

**Inspector Ambrose Thistlewood**, Calcutta Police (Special Branch). A fussy bachelor of fifty in a linen suit, posing as "Mr. A. Thistlewood, photographer." Not a fighter. Seen only as hands and sleeves. His tools:

- **The camera.** A folding plate camera. Anything photographed goes into the casebook as evidence. Photographing the wrong thing in company raises suspicion.
- **The casebook.** Clues, photographs, testimony, a sketch map of what has been explored, and the deduction pages where the final accusation is assembled.
- **A pocket watch.** The night's clock. Dawn arrives with the watchman's knock.
- **A candle stub and a matchbox.** His only light at night — which is also what gets him seen.
- **His manners.** Every conversation is a tool.

No weapons at night. On the day of the shikar he is handed a rifle, and what he does with it is a choice, not a fight.

---

## 5. The cast

Original characters. The story supplies their DNA, not their names.

| Character | Who | Played as | Wants from Thistlewood | Hides |
|---|---|---|---|---|
| **Raja Bhairab Narayan Singh Deo** — "Raja Sahib" | Ruler of Chandragarh | Huge, perfumed, sweating, delighted with himself. A monster gone soft from decades of excess, whose remaining hobbies are standing too close to women and laughing at his own jokes. Terrifying because he is ridiculous *and* absolute. When he's afraid he laughs, and the laugh goes on a beat too long. | Admiration from an Englishman; an album that makes him look like a king | Everything |
| **Mr. Pitambar Ghatak**, B.A. (Oxon., not completed) | House guest from Calcutta | Chubby, forked moustache, calls every woman "child." Author of a privately printed pamphlet arguing that civilised men need occasional, deliberate relapses into savagery. | An audience | That his pamphlet was the permission for what happened |
| **Mrs. Sarojini Ghatak** | His wife | Delivers remarks with her eyes closed, as if the room smelled, biting off each word. Every word innocent; every sentence poison. Not in love with her husband; badly in love with Mr. Sahukar. | To know what you know about everyone else | A jealousy that turned violent |
| **Mr. Dibakar Sahukar** | Timber contractor | Parks his cigar in the corner of his mouth before holding forth, then glances round after each pronouncement to make sure it was appreciated. Calls himself a wolf. Adores his wife extravagantly and out loud. | The Raja's sal forest lease | The dead man refused to let the forest be sold |
| **Mrs. Lilabati Sahukar** | His wife | Professionally delicate: shrieks at crushed butterflies, faints into convenient arms, weaponises fragility. | To be adored — and to be sure nobody believes what the dead man's smile said about her | She made the accusation that started the beating |
| **Sudam** (the victim, never seen alive) | The old Raja's son by Malati; driver, huntsman and forest steward to his half-brother | Gloomy, handsome, the best shot in the hills; the only one in that hunting party who would not shoot a pregnant doe. Present in photographs, in the mynah's mimicry, in what people won't say. | — | — |
| **Bhima**, the chowkidar | Night watchman | Old, enormous, silent, devoted to the old Raja's memory. Knocks softly, at intervals, never louder. Patrols with a lantern. Has handled the house's unpleasant business for forty years. | To be left alone with his guilt | What he carried into the jungle at dawn |
| **Malati** | Sudam's mother, once a dancer at the old Raja's court | Everyone says she left the palace years ago. The servants say a woman in white with ankle bells walks the roof of the abandoned zenana on moonlit nights, and that she is a ghost. | Her son's name | Herself |
| **Jagu**, the khansama | The cook | Small, fast, terrified; speaks in proverbs and recipes. Cooked the feast that night and hasn't slept well since. | For Thistlewood to eat | What was on the fire |
| **The Dewan** | The Raja's chief minister | Pince-nez, ledgers, quotes Gladstone, believes in double-entry bookkeeping the way others believe in God. | For the state's books to balance | The forest lease, the electricity accounts, the old Raja's papers |
| **Kotwal**, the hill mynah | The Raja's pet, in a brass cage | Mimics any voice perfectly, including ones it shouldn't have heard. Comic relief on day one; the most frightening witness in the palace by day five. | Chillies | Everything it heard |
| **Major Reginald Pomfret** | Political Agent for the Orissa States | Arrives on the last day for the feast. Pompous, afraid of the Raja, more afraid of a scandal. The man Thistlewood must convince. | No trouble | That he already suspects |

---

## 6. The truth

**Spoilers. This is the fixed solution. Nothing in the game may contradict it; every night reveals a piece of it.**

**The motive.** Before he married his Rani, the old Raja secretly married Malati in a registered ceremony. Their son Sudam was born two years before Bhairab. That makes Sudam the elder legitimate son and, by the old Raja's will, his heir. The old Raja locked the marriage certificate and the will in the toshakhana and recorded a confession on a wax cylinder that he never let anyone play. Last summer, with the merger coming and privy purses to be settled, Malati told Sudam who he was. Sudam told the Raja he wanted nothing — only that the jungle never be sold. The Raja heard only that his throne had a rival.

**The plan.** The Raja invited the Ghataks and the Sahukars to a jungle shikar on the last full moon, knowing exactly what they were: a philosopher who preached savagery, a contractor whose lease Sudam blocked, a delicate lady Sudam would certainly fail to adore, and a jealous wife. He supplied the drink.

**The night.** On the drive in, Sudam refused to shoot a pregnant doe and let it go into the jungle. That evening, alone with him, Mrs. Sahukar tried to charm him and got only a polite, amused smile. When the party returned she accused him of assault. The guests beat him unconscious and threw him into the game larder beside a half-dead boar. Then they built a fire in the walled kitchen garden, roasted the boar, drank and danced until they collapsed. At dawn none of them could swear whether it was the boar they had eaten. Nobody would open the larder to find out. They drove away and have been telling each other ever since that it was a bad dream.

**The murder.** Sudam was alive in the larder. At ten past four, before the watchman's first knock, the Raja went to the larder alone with his key, switched on its light, and strangled his half-brother with his own silk cummerbund. A thread of it caught on the larder bolt. He went back to bed and at breakfast told Bhima to "do the necessary" about the rogue in the larder.

**The cover-up.** Bhima opened the larder and found Sudam dead. He carried him into the jungle, marked him with claws pulled from a mounted tiger's paw in the trophy gallery, and let the palace announce that a man-eater had taken him. An old moth-eaten skin from the gallery storeroom was paraded as the man-eater, "shot in revenge." Bhima hid the claws and Sudam's rifle at the bottom of the stepwell.

**So:** the guests believe they are murderers, perhaps worse. They ate a boar. They are guilty of a savage beating and a cowardly silence — not of murder. **The Raja is the murderer. Bhima is the accessory. The old Raja's papers are the motive.**

**What stays unanswered.** After Malati leaves the palace in the epilogue, ankle bells are still heard on the zenana roof. The game never explains them.

### Where the evidence lives

| Proves | Evidence | Found |
|---|---|---|
| The tiger story is staged | The "man-eater" hide is old and moth-eaten; its plaque is dated after Sudam vanished; a mounted paw is missing claws | Night 1 |
| Malati is alive; Sudam was the old Raja's son | Malati herself; her palm-leaf letter | Night 2 |
| The guests' motives; the Raja planned the party | Ghatak's pamphlet annotated in the Raja's hand; the unsigned forest lease and Sudam's letter refusing it; the Raja's invitation drafts; the mynah's mimicry | Night 3 |
| They ate the boar; Sudam was alive in the larder | Boar tusks in the kitchen garden ash pit; the cook's menu slate; scratches inside the larder door; Sudam's coat button; a silk thread on the bolt | Night 4 |
| Someone was at the larder at 4:10 a.m.; the marriage | The dynamo house log shows the larder light switched on at 4:10; the old Raja's wax-cylinder confession | Night 5 |
| The cover-up | The tiger claws and Sudam's rifle at the bottom of the stepwell; Bhima's confession (if he trusts you) or his tin trunk (if he doesn't) | Night 6 |
| The murderer and the motive | The marriage certificate and the will in the toshakhana; the Raja's cummerbund, torn where the thread came from | Night 7 |

The accusation must be provable **with or without** Bhima's confession.

---

## 7. The shape of play

**The loop: day, then night.**

- **Morning** begins with Bhima's knock. Breakfast with the Raja is compulsory. Then the day offers a handful of engagements — conversations, the shikar, portrait sittings, cards, billiards, walks — each taking a slot of the day. You can't do everything. Engagements give keys, access, items, testimony and hints, and move the two hidden numbers below.
- **Evening:** drinks on the verandah, dinner, and then the guest wing is bolted from outside "because of the tiger."
- **Night:** escape your room, work through the night's wing while Bhima patrols, and get back before dawn. A clock in the Durbar Wing chimes the quarters.

**Two hidden numbers.**

- **The Raja's suspicion.** Rises when you're seen where you shouldn't be, photograph the wrong thing in company, ask too directly, or give a poor excuse. Falls when you flatter, drink with him, lose at cards gracefully, laugh at the right moments. Never shown as a bar. You read it in how the Raja greets you at breakfast, how many lanterns are on the patrol, whether your door is bolted once or twice. At its peak the Raja invites you on a midnight shikar (see the endings).
- **Bhima's regard.** Rises when you show the decency the house has forgotten — sparing the doe, thanking the servants, not humiliating anyone. Decides whether he confesses on Night 6 or chases you.

**Caught at night.** A short chase, then an excuse scene. Excuses are dialogue choices, and each one's cost depends on what you've set up by day: "I was photographing the moon" works well if you told the Raja on Day 2 that you photograph the moon.

**Dawn** is pressure, not failure. The night clock's length is a tuning number. Being out of bed at the knock costs suspicion, never progress.

**No soft-locks.** Whatever you choose in a morning, every night stays solvable: required items always have a route. Optional engagements give hints, shortcuts and extra truth.

**Saves** at each knock and at the start of each night.

**Controls.** Desktop browser, keyboard and mouse with pointer lock; a gamepad if it's cheap. An examine mode for objects: turn them, zoom, open compartments. No combat.

---

## 8. The seven days and nights

The spine below is fixed: the order, the places, and what each night proves. The puzzle ideas are seeds. Invent better ones freely, as long as each night still proves its piece of the truth.

| | Day | Night | Moon | The night proves |
|---|---|---|---|---|
| 1 | The drive in | The Bolted Door — guest room and trophy gallery | Half | The tiger story is staged |
| 2 | The sittings | The House of Mirrors — Sheesh Mahal and abandoned zenana | Waxing | Malati lives; Sudam was the old Raja's son |
| 3 | The shikar | The Dewan's Arithmetic — library, record room, billiard room | Waxing | The guests' motives; the Raja planned it |
| 4 | Luncheon and cards | What Was Roasted — kitchens, larder, walled kitchen garden | Gibbous | They ate the boar; Sudam was alive in the larder |
| 5 | The Raja's machines | The Old Raja's Voice — dynamo house, durbar hall, music room, lantern theatre | Gibbous | Someone was at the larder at 4:10; the secret marriage |
| 6 | The waterfall picnic | What Bhima Carried — watchman's lodge and stepwell | Nearly full | The cover-up |
| 7 | Kumar Purnima | The Full Moon — toshakhana, rooftop chhatris, the feast | Full | The murderer and the motive |

### Day 1 — The drive in
The opening. A jeep grinding through miles of jungle with the guests bickering in the back: the cast introduced at full volume. At a bend, a pregnant doe at the foot of a hill. The Raja presses a rifle into his guest of honour's hands. Shoot (the Raja is delighted, Bhima's regard falls), spare it (the Raja sulks, Mrs. Sahukar has hysterics, Bhima notices), or hesitate until it's gone. Arrival, the Raja's welcome, drinks on the verandah, a tiger roaring somewhere far off, and the sound of a bolt sliding home outside your door.

### Night 1 — The Bolted Door
*Teaches the camera, the casebook, the watchman and the knock.*
- Escape the bolted guest room: the punkah, a jaali transom above the door, a hairpin and the camera's tripod leg combined into something long enough to lift the bolt from inside.
- The trophy gallery: brass plaques with shikar dates, ordered into a code for the corridor door; the "man-eater" hide, old and moth-eaten under a brand-new plaque; a mounted tiger's paw missing two claws (it pays off on Night 6).
- Bhima's first patrol: lantern light under doors, soft footsteps, somewhere to hide.

### Day 2 — The sittings
Photograph each guest for the album, one by one. Each sitting is a conversation and a chance to observe: what they fidget with, what they won't face the lens about. The Raja's portrait in the durbar wing, with Kotwal the mynah on his wrist. A walk past the locked zenana garden.

### Night 2 — The House of Mirrors
*The ghost set piece.*
- The Sheesh Mahal: mirror panels to turn until a beam of moonlight crosses the hall and lights a fresco.
- A jaali whose shadow resolves into Odia numerals only when the moon reaches a certain height; a children's slate in the zenana schoolroom teaches the numerals first.
- A palm-leaf letter that looks blank until rubbed with lamp-soot, the way talapatra manuscripts are read.
- Following the ankle bells through the dark zenana to a woman in white on the roof — who is very much alive.

### Day 3 — The shikar
Machans, beaters, and a tiger that never comes. Real pugmarks that tell a different story from the palace's. The spot where Sudam's "remains" were found, and the forest guard who found them. Mr. Sahukar's blaze marks on the sal trees.

### Night 3 — The Dewan's Arithmetic
- Ledgers to cross-reference: forest receipts, the unsigned lease, Sudam's letter refusing it.
- Billiard balls racked in an order that opens a cabinet.
- Mr. Ghatak's pamphlet, annotated in the Raja's hand.
- The Raja's draft invitations to that night's party.
- Kotwal in the dark, mimicking voices from the night of the shikar. Funny at first.

### Day 4 — Luncheon and cards
A long luncheon on the terrace: gossip, alibis that don't match, Mrs. Ghatak's innocent poison, a swoon from Mrs. Sahukar on cue. A game of cards. Win Jagu's trust — eat his pakhala, praise the right thing — and he lets the kitchen key fall where you can find it.

### Night 4 — What Was Roasted
*The horror peak.*
- A spice-box lock keyed to pancha phutana, the Odia five-spice; the kitchen teaches it first.
- Jagu's menu slate from that night.
- The larder: scratches on the inside of the door, Sudam's coat button, a silk thread on the bolt.
- The walled kitchen garden's ash pit: dig through it and find boar tusks. Relief, played for laughs, because the scream comes next.
- A knocking from inside a room that should be empty. The answer is ridiculous. The dread isn't.

### Day 5 — The Raja's machines
The Raja shows off his father's Durbar Wing, billiards and cigars, and tests his photographer with questions about lenses and plates (the answers are in Thistlewood's own trunk, if the player read the manual). The Dewan explains the dynamo with terrible pride.

### Night 5 — The Old Raja's Voice
*The BioShock Infinite showpiece.*
- Restart the dynamo: belts, valves, gauges. The chandeliers come up one by one over the durbar hall.
- The dynamo house's circuit log: the larder light, switched on at 4:10 a.m. on the night of the shikar.
- Wax cylinders played at the wrong speed — the dead Raja as a chipmunk, then as a demon — until the governor is set right and the confession plays.
- Magic-lantern slides of the 1911 durbar, put in order to reveal the first numbers of the toshakhana combination.

### Day 6 — The waterfall picnic
The guests begin to unravel. Mr. Ghatak lectures on ghosts and the scientific impossibility thereof, then won't walk back alone. Bhima watches Thistlewood all day; this is the last chance to earn or lose his regard.

### Night 6 — What Bhima Carried
- Bhima's lodge: his tin trunk, the house's secrets, kept for forty years.
- The stepwell: sluice gates to open in the right order, lowering the water landing by landing to the bottom, where the claws and Sudam's rifle lie.
- Bhima himself, at the bottom of the steps. High regard: he sits down and confesses. Low regard: a chase up the flooded stairs in lantern light.

### Day 7 — Kumar Purnima
Major Pomfret arrives. The palace dresses for the full moon. The Raja is in a mood: generous or dangerous, depending on his suspicion.

### Night 7 — The Full Moon
- A moondial on the roof among the chhatris that gives the last digit only under a full moon.
- The toshakhana: slides plus numerals plus moondial. Inside, the marriage certificate and the will.
- The Raja's dressing room: the cummerbund, torn where the thread came from.
- The feast and a game of pasha dice with the Raja, played while the accusation is assembled in the casebook.
- **The accusation:** the casebook asks who beat Sudam, who killed him, who hid him, what the guests ate, and why he died. Answers are confirmed in groups, never one by one, so they can't be guessed.

---

## 9. Escape-room rules

Every night is designed the way a good escape room is.

1. **Self-contained.** Everything needed is inside the night's wing, plus what the day can give. A first-timer takes roughly thirty to forty-five minutes (a tuning number).
2. **Chart first.** Design each night as a puzzle dependency chart before writing its content: the locks, what opens each, what each gives. The chart lives with the night and appears in its story.
3. **Parallel threads.** Two or three threads that converge on a final lock. Never one long corridor of puzzles.
4. **Every key is in the fiction.** A clue, an item, an observation, a conversation. No outside knowledge: if a puzzle uses Odia numerals or a spice blend, the palace teaches it first.
5. **Vary the locks.** Combinations, keys, light, sound, order, assembly, cipher, hidden compartments, observation, dialogue. No two adjacent puzzles of the same kind.
6. **One "aha" per puzzle.** Fair, not obscure. No pixel hunting: once noticed, a clue is readable at a glance.
7. **Few red herrings,** themed, and each still tells you something about a character.
8. **Every touch answers.** Every interaction gets a sound or a casebook line. Every solved lock is a satisfying physical event: a bolt slides, a panel swings, a chandelier comes up.
9. **Hints are diegetic and progressive.** Thistlewood thinks aloud in his casebook after a while stuck; later hints get blunter. Hints cost time, never progress.
10. **Nothing important can be lost or missed forever.** Used-up items leave the inventory.
11. **Every night ends on a reveal and a question**: a reveal that changes how you see someone, and a question that sends you into the next morning.

---

## 10. Endings

Each ending is a short in-engine scene.

- **The Full Moon** — the true ending. The right accusation (the Raja killed him, the guests beat him, Bhima hid him, the papers are why) laid before Major Pomfret at the feast. The Raja laughs a beat too long, then stops. Epilogue: the jeep leaves at dawn, Malati at the roadside, a doe and her fawn at the jungle's edge — and ankle bells on the zenana roof.
- **The Jackals Laugh** — accuse the guests alone. The Raja is effusively grateful. The guests are taken away; Thistlewood is thanked, photographed and driven off. The jackals howl.
- **The Necessary** — accuse Bhima alone. He doesn't argue. The Raja's hand lands on Thistlewood's shoulder and stays there.
- **The Midnight Shikar** — the bad ending, reachable whenever suspicion peaks. The Raja invites his guest on a midnight shikar. Cut to breakfast the next morning: the guests compliment the meat. The menu card. The jackals.

---

## 11. The look

**The bar:** BioShock Infinite's interiors, and real Rajput palaces. From BioShock Infinite take three things only: the density of set dressing that tells stories, painterly saturated directional light, and a grand world rotting under its own optimism. Nothing else — no names, logos, characters, powers or assets.

**Two lights.**
- **The moon** — pale, cool, radiant. A silver-blue key strong enough to read by, falling through jaalis and arches in patterned shafts, with a faint haze in the air. Its height and fullness change every night.
- **The flame** — small warm amber pools: brass hanging lamps, diyas, candles, Thistlewood's own candle stub.
- **The dynamo** — in the Durbar Wing, once restarted: bulbs too bright, greenish-yellow, buzzing, never quite steady. Modernity looking slightly ill.
- **Day** — hot, white, saturated Indian daylight, close to overexposed, so the nights feel colder by contrast.

**Colour is rationed.** Moonlight, sandstone, marble and blue-black shadow everywhere. Saturated colour only in a mirror glint, stained glass, a flame, a sari's border — and red when something is wrong.

**Architecture and dressing.** Pink and honey sandstone; white marble with inlaid stone flowers; mirror-mosaic halls; jharokhas, jaali screens, cusped arches, chhatris; courtyards with dry fountains; a stepwell going down into black water; the zenana behind lattices. In the Durbar Wing: crystal chandeliers, Edwardian wallpaper peeling off sandstone, billiard tables, phonographs, magic lanterns, glass trophy cases, tiger skins with glass eyes. Everywhere: punkahs, faded frescoes of court and hunting scenes, oleograph calendar prints, shikar photographs in silver frames, period printed ephemera (menu cards, durbar souvenirs, gramophone sleeves, cigarette tins, shikar notices). Every room shows what someone was doing when they stopped.

**The jungle** is dense sal, black-green, silver-edged by the moon. From the palace it is always visible through some window and always audible.

**People** are stylised, not realistic: readable by silhouette across a dark hall, exaggerated like a theatre poster — the Raja's bulk, Ghatak's forked moustache, Mrs. Sahukar's handkerchief, Bhima's height and lantern, Malati's white sari. Period dress: achkan and safa, saris of the forties, khaki and sola topis for the shikar, the Major's uniform.

**First person:** Thistlewood's hands and linen cuffs, holding the camera or the candle; a slight head bob; a lean around corners.

**The interface** is diegetic wherever it can be. The casebook is a Raj-era police notebook with borders in the manner of Odia pattachitra painting, set in an open-licensed period serif, with Odia script (an open-licensed Noto Oriya face) wherever the fiction uses it. Interaction prompts are small and quiet.

---

## 12. The sound

Synthesised in code, like the rest of the game.

- **The knock** — soft, repeated at intervals. Dawn. The game's signature.
- **Ankle bells** — the ghost.
- **Jackals** — the laugh track.
- **A tiger's roar**, far off. Never seen.
- **The dynamo** — hum, belts, buzzing bulbs.
- **The wax cylinders** — hiss and crackle around a dead man's voice.
- **Under the night**, a tanpura-like drone; wind through jaalis, whistling a different pitch in each room; crickets; the creak of a punkah.
- **Music** from the old Raja's records: shehnai and sarangi-like melodies, synthesised.
- **Dialogue is text.** Each character has a signature non-verbal sound: the Raja's laugh, Mrs. Ghatak's sniff, Sahukar's cigar, the flutter of Mrs. Sahukar's handkerchief, Kotwal's whistle.

---

## 13. Getting it right

- **Research before inventing**: architecture, 1940s dress, food, flora and fauna, the Odia script and numerals, the Raj's offices and titles.
- **The satire is even-handed.** It targets the decadent rich and the Empire's officials alike, Indian and British. The servants are the most dignified people in the palace.
- **Worship spaces are scenery treated with respect**, never puzzles to desecrate.
- **No exoticised mysticism.** The ghost is a woman. The haunting is guilt. The one thing left unexplained stays small.

### Glossary

| Word | Meaning |
|---|---|
| jharokha | an enclosed balcony projecting from a wall, with screened windows |
| jaali | a pierced stone lattice screen |
| chhatri | a domed, pillared rooftop pavilion |
| zenana | the women's quarters |
| durbar | a royal court or ceremonial assembly |
| toshakhana | the treasury of gifts and valuables |
| baoli | a stepwell |
| punkah | a ceiling fan pulled by rope |
| shikar, shikari | a hunt; a hunter |
| machan | a tree platform for hunting |
| hanka | a beat: beaters driving game towards the guns |
| chowkidar | watchman |
| khansama | cook |
| Dewan | chief minister of a princely state |
| ghungroo | dancers' ankle bells |
| pakhala | Odia rice soaked in water, eaten in the heat |
| pancha phutana | Odia five-spice: mustard, cumin, fennel, fenugreek, nigella |
| talapatra | palm-leaf manuscript, incised with a stylus and rubbed with soot to read |
| pattachitra | Odia cloth-scroll painting |
| pasha | a dice game |
| Kumar Purnima | the full moon of Ashwin, celebrated in Odisha |
| achkan, safa | a long formal coat; a turban |
| sola topi | pith helmet |

---

## 14. Not this game

- No combat. No gore on screen.
- Nothing borrowed from BioShock except the quality bar.
- No sentences, dialogue or names copied from the reference story.
- No real people as characters. History appears as history: the 1911 durbar is crowds, elephants and pavilions on a lantern slide.
