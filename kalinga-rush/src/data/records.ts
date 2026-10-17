// The history bible as typed data (brief §3). Card text must match HISTORY.md.
import type { ActNum, AnyToken } from './palettes';
import type { Arch } from './hazards';
import type { VehicleId } from '../systems/physics';

export type CardKind = 'history' | 'tradition' | 'legend' | 'speculative';
/** Kept for the Phase 1 hazard sprites (reeds, mudbanks, fishing stakes). */
export type HazardKind = 'reed' | 'mud' | 'stakes';

export interface Exercise {
  kind: 'fill' | 'truefalse';
  /** Use "____" where the blank goes. */
  prompt: string;
  options: string[];
  answer: string;
}

export interface RecordOutline {
  id: string; // 'r01' … 'r37', 'f1' … 'f8'
  num: number; // 1–45
  act: ActNum;
  kind: CardKind;
  dateLine: string;
  headline: string; // ≤ 9 words
  ride?: VehicleId;
  somber?: boolean;
}

export interface Mechanics {
  /** Wind gusts: 'push' bends the jump arc back (1999), 'boost' lifts you (2061). */
  wind?: 'push' | 'boost';
  /** Darkness / low-contrast stretches lit only around Taapoi (Act IV). */
  dark?: boolean;
  /** Glowing cyclone shelters: calm zones that are also checkpoints (2013). */
  shelters?: boolean;
  /** Odia letters as platforms (2014). */
  platforms?: boolean;
  /** Gates synced to the mardala (∞). */
  rhythm?: boolean;
  noCowries?: boolean;
  noHazards?: boolean;
  /** Very few hazards: a breathing moment. */
  sparse?: boolean;
  /** Act IV → full colour at the province's birth (1936). */
  flood?: boolean;
  rain?: boolean;
  night?: boolean;
}

export type Terrain = 'water' | 'sea' | 'land' | 'air' | 'orbit';

export interface RecordDef extends RecordOutline {
  ride: VehicleId;
  place: string;
  sign: { date: string; title: string };
  fact: string;
  didYouKnow: string;
  exercise: Exercise;
  /** Keys into HISTORY.md. */
  sources: string[];
  dateNote?: string;
  terrain: Terrain;
  /** Archetype → painted visual for this era. */
  hazards: Partial<Record<Arch, string>>;
  lead: AnyToken;
  segmentSeconds: number;
  /** Difficulty window for chunk selection [min, max] (1–10). */
  difficulty: [number, number];
  mech: Mechanics;
  /** In-world prompt above the first hazard. */
  tutorial: string;
  /** New idea taught in this record's safe intro (§5). */
  teach?: string;
  /** What the "record" looks like when it isn't a palm leaf. */
  recordVis?: 'leaf' | 'drum' | 'oar';
  friends?: 'dolphin' | 'kirtan' | 'turtle';
}

export const RECORDS_BEFORE_TWIST = 37;
export const RECORDS_TOTAL = 45;

export const ACT_NAMES: Record<ActNum, string> = {
  1: 'Kalinga Sagar',
  2: 'The Temple Coast',
  3: 'Gajapati',
  4: 'Company & Resistance',
  5: 'Naya Odisha',
  6: 'Odisha, Now',
  7: 'ଭବିଷ୍ୟତ · The Future',
};
export const ACT_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

type Base = Omit<RecordDef, keyof RecordOutline | "segmentSeconds" | "difficulty" | "mech" | "lead"> & {
  ride: VehicleId;
  segmentSeconds?: number;
  difficulty?: [number, number];
  mech?: Mechanics;
  lead?: AnyToken;
};

export const OUTLINE: RecordOutline[] = [
  { id: 'r01', num: 1, act: 1, kind: 'history', dateLine: 'c. 1500 BCE', headline: 'Boat-builders on the Chilika shore.', ride: 'canoe' },
  { id: 'r02', num: 2, act: 1, kind: 'history', dateLine: 'c. 300 BCE', headline: 'A city of eight gates.', ride: 'cart' },
  { id: 'r03', num: 3, act: 1, kind: 'history', dateLine: 'Kartika Purnima', headline: 'The boitas sail for the golden islands.', ride: 'boita' },
  { id: 'r04', num: 4, act: 1, kind: 'history', dateLine: '261 BCE', headline: 'The Kalinga War. An emperor lays down the sword.', ride: 'foot', somber: true },
  { id: 'r05', num: 5, act: 1, kind: 'history', dateLine: 'c. 2nd–1st century BCE', headline: 'Kharavela writes his story in stone.', ride: 'elephant' },
  { id: 'r06', num: 6, act: 2, kind: 'history', dateLine: '6th–7th century CE', headline: "A kingdom in Java carries Kalinga's name.", ride: 'boita' },
  { id: 'r07', num: 7, act: 2, kind: 'history', dateLine: 'Early 7th century CE', headline: 'Parasurameswara: an early Kalinga temple.', ride: 'cart' },
  { id: 'r08', num: 8, act: 2, kind: 'history', dateLine: '8th century CE', headline: 'Vaital Deula: a temple roofed like a boat.', ride: 'cart' },
  { id: 'r09', num: 9, act: 2, kind: 'history', dateLine: '8th–10th century CE', headline: 'Ratnagiri, the hill of jewels.', ride: 'foot' },
  { id: 'r10', num: 10, act: 2, kind: 'history', dateLine: 'c. 950–975 CE', headline: 'Mukteswara: the gem of Kalinga architecture.', ride: 'cart' },
  { id: 'r11', num: 11, act: 2, kind: 'history', dateLine: '11th century CE', headline: 'Lingaraja rises over Ekamra.', ride: 'cart' },
  { id: 'r12', num: 12, act: 2, kind: 'history', dateLine: '11th century CE', headline: 'Ships that carried elephants.', ride: 'boitaElephant' },
  { id: 'r13', num: 13, act: 2, kind: 'tradition', dateLine: 'Tradition', headline: 'Where the goddess dwells.', ride: 'cart' },
  { id: 'r14', num: 14, act: 2, kind: 'history', dateLine: '12th century CE', headline: 'A temple for Jagannath at Puri.', ride: 'cart' },
  { id: 'r15', num: 15, act: 2, kind: 'history', dateLine: 'c. 1250 CE', headline: "Konark: the Sun's chariot in stone.", ride: 'foot' },
  { id: 'r16', num: 16, act: 3, kind: 'history', dateLine: '29 Jun 1435', headline: 'Kapilendra Deva is crowned Gajapati.', ride: 'elephant' },
  { id: 'r17', num: 17, act: 3, kind: 'legend', dateLine: 'Legend', headline: 'Two riders and a milkmaid.', ride: 'elephant' },
  { id: 'r18', num: 18, act: 3, kind: 'history', dateLine: '1510', headline: 'Chaitanya arrives in Puri.', ride: 'foot' },
  { id: 'r19', num: 19, act: 3, kind: 'history', dateLine: '1568', headline: 'The last independent kingdom falls.', ride: 'foot' },
  { id: 'r20', num: 20, act: 4, kind: 'history', dateLine: '1803', headline: 'The East India Company takes Odisha.', ride: 'palanquin' },
  { id: 'r21', num: 21, act: 4, kind: 'history', dateLine: 'Mar 1817', headline: 'The Paikas rise.', ride: 'foot' },
  { id: 'r22', num: 22, act: 4, kind: 'history', dateLine: '1866', headline: "Na'anka: the great famine.", ride: 'foot', somber: true },
  { id: 'r23', num: 23, act: 4, kind: 'history', dateLine: '1866–1868', headline: 'Odia finds its printed voice.', ride: 'pressCart' },
  { id: 'r24', num: 24, act: 4, kind: 'history', dateLine: '30 Dec 1903', headline: 'The Utkal Sammilani gathers in Cuttack.', ride: 'bicycle' },
  { id: 'r25', num: 25, act: 4, kind: 'history', dateLine: '1 Apr 1936', headline: 'Odisha becomes a province of its own.', ride: 'bicycle' },
  { id: 'r26', num: 26, act: 4, kind: 'history', dateLine: '11 Oct 1938', headline: 'A boatboy says no.', ride: 'countryBoat', somber: true },
  { id: 'r27', num: 27, act: 5, kind: 'history', dateLine: '24 Jul 1947', headline: 'A Dakota flies to Java.', ride: 'dakota' },
  { id: 'r28', num: 28, act: 5, kind: 'history', dateLine: '13 Apr 1948', headline: 'A new capital is planned at Bhubaneswar.', ride: 'bicycle' },
  { id: 'r29', num: 29, act: 5, kind: 'history', dateLine: '13 Jan 1957', headline: 'Hirakud Dam opens.', ride: 'bicycle' },
  { id: 'r30', num: 30, act: 5, kind: 'history', dateLine: '3 Feb 1959', headline: 'Rourkela lights its first blast furnace.', ride: 'train' },
  { id: 'r31', num: 31, act: 5, kind: 'history', dateLine: '29 Oct 1999', headline: 'The Super Cyclone.', ride: 'foot', somber: true },
  { id: 'r32', num: 32, act: 6, kind: 'history', dateLine: '1 Nov 2011', headline: 'Orissa becomes Odisha.', ride: 'bus' },
  { id: 'r33', num: 33, act: 6, kind: 'history', dateLine: '12 Oct 2013', headline: 'Phailin: a million moved to safety.', ride: 'foot' },
  { id: 'r34', num: 34, act: 6, kind: 'history', dateLine: '20 Feb 2014', headline: 'Odia becomes a classical language.', ride: 'foot' },
  { id: 'r35', num: 35, act: 6, kind: 'history', dateLine: '2018', headline: 'Hockey comes home.', ride: 'scooter' },
  { id: 'r36', num: 36, act: 6, kind: 'history', dateLine: '17 Jan 2024', headline: 'A walkway around Shree Mandira.', ride: 'foot' },
  { id: 'r37', num: 37, act: 6, kind: 'history', dateLine: '2026 · Now', headline: 'Chips on the coast.', ride: 'scooter' },
  { id: 'f1', num: 38, act: 7, kind: 'speculative', dateLine: '1 Apr 2036', headline: 'Odisha turns one hundred.', ride: 'maglev' },
  { id: 'f2', num: 39, act: 7, kind: 'speculative', dateLine: '2047', headline: 'Chilika, restored and humming.', ride: 'eboat' },
  { id: 'f3', num: 40, act: 7, kind: 'speculative', dateLine: '2061', headline: "The coast cyclones can't break.", ride: 'glider' },
  { id: 'f4', num: 41, act: 7, kind: 'speculative', dateLine: '2088', headline: 'Talapatra in glass.', ride: 'maglev' },
  { id: 'f5', num: 42, act: 7, kind: 'speculative', dateLine: '2120', headline: "Konark's wheel, unfurled in orbit.", ride: 'lightsail' },
  { id: 'f6', num: 43, act: 7, kind: 'speculative', dateLine: 'Kartika Purnima 2150', headline: 'Bali Jatra beyond the sky.', ride: 'starBoita' },
  { id: 'f7', num: 44, act: 7, kind: 'speculative', dateLine: '2200', headline: 'Some things never change.', ride: 'foot' },
  { id: 'f8', num: 45, act: 7, kind: 'speculative', dateLine: '∞', headline: 'The voyage never ended.', ride: 'starBoita' },
];

const tf = (prompt: string, answer: 'True' | 'False'): Exercise => ({ kind: 'truefalse', prompt, options: ['True', 'False'], answer });
const fill = (prompt: string, answer: string, others: string[]): Exercise => ({ kind: 'fill', prompt, options: [answer, ...others], answer });

/** Level length: the brief's ~34 s per record, made 30% longer. */
export const SEGMENT_S = 44;

const BASE: Record<string, Base> = {
  r01: {
    ride: 'canoe', terrain: 'water', place: 'Golbai Sasan, on the Malaguni river north of Chilika',
    sign: { date: 'c. 1500 BCE', title: 'Golbai Sasan' },
    fact: 'At Golbai Sasan, on the Malaguni river just north of Chilika lagoon, archaeologists dug up many woodworking adzes — tools for shaping logs. So many adzes suggest this was a boat-building centre. The people here lived in round wooden huts with floors of rammed earth.',
    didYouKnow: "Chilika is often called Asia's largest brackish-water lagoon: river water and sea water mix there, and Irrawaddy dolphins swim in it.",
    exercise: fill('Many woodworking ____ found at Golbai Sasan suggest it was a boat-building centre.', 'adzes', ['coins', 'bricks']),
    sources: ['golbai-sasan', 'chilika'], dateNote: 'Estimates span the 2nd millennium BCE; displayed as "c. 1500 BCE".',
    hazards: { small: 'reed', wide: 'mud', tall: 'stakes' }, friends: 'dolphin', tutorial: 'Jump the reeds', teach: 'Tap to jump',
  },
  r02: {
    ride: 'cart', terrain: 'land', place: 'Sisupalgarh, near Bhubaneswar', sign: { date: 'c. 300 BCE', title: 'Sisupalgarh' },
    fact: "Sisupalgarh, near today's Bhubaneswar, was a nearly square fortified city of about 1.2 square kilometres. Its walls rose a little over 9 metres, with a moat outside and eight brick-and-stone gateways — two on each side. It is identified with Tosali, also called Kalinganagari.",
    didYouKnow: 'Sisupalgarh was first excavated by B.B. Lal in 1948, and estimates put its population at 20,000–25,000 people.',
    exercise: tf('Sisupalgarh had eight gateways, two on each side.', 'True'), sources: ['sisupalgarh'],
    hazards: { pit: 'moat', roller: 'pot', walker: 'oxcart', small: 'milestone' }, tutorial: 'Jump the moat ditches',
  },
  r03: {
    ride: 'boita', terrain: 'sea', place: 'An estuary port on the Kalinga coast', sign: { date: 'Kartika Purnima', title: 'Boita Bandana' },
    fact: "Kalinga's merchant-mariners, the sadhabas, sailed to Sri Lanka, Java, Sumatra, Borneo, Bali and Burma with goods such as pepper, cinnamon, cardamom, silk, camphor and gold. The Bay of Bengal was once called the Sea of Kalinga. They set out on Kartika Purnima, when the winds favoured the voyage.",
    didYouKnow: 'The chant "ā kā mā bai" names the four sacred months — Asadha, Kartika, Magha and Baisakha. The voyages are remembered today in Boita Bandana and Cuttack\'s Bali Jatra.',
    exercise: fill('The Bay of Bengal was once called the Sea of ____.', 'Kalinga', ['Java', 'Pearls']), sources: ['maritime-odisha', 'boita-bandana'],
    hazards: { small: 'wave', tall: 'bigwave', wide: 'rock', floater: 'squall' }, friends: 'dolphin', tutorial: 'Jump the waves',
  },
  r04: {
    ride: 'foot', terrain: 'land', place: 'Dhauli hill above the Daya river', sign: { date: '261 BCE', title: 'Dhauli' },
    fact: "Emperor Ashoka's Rock Edict XIII records the terrible loss of life in his war against Kalinga. Afterwards he turned away from war towards dhamma, which he spread through edicts carved on rocks and pillars.",
    didYouKnow: 'Special "Kalinga edicts" are carved at Dhauli and at Jaugada. At Dhauli, an elephant is carved out of the living rock above them.',
    exercise: fill("Ashoka's Rock Edict ____ records the loss of life in the Kalinga War.", 'XIII', ['I', 'VII']), sources: ['kalinga-war'],
    hazards: { small: 'stone' }, mech: { sparse: true }, segmentSeconds: 34, tutorial: 'Step over the stones',
  },
  r05: {
    ride: 'elephant', terrain: 'land', place: 'Udayagiri and Khandagiri hills', sign: { date: 'c. 2nd–1st century BCE', title: 'Hathigumpha' },
    fact: "On Udayagiri hill near Bhubaneswar, the 17-line Hathigumpha ('Elephant Cave') inscription, in Prakrit and Brahmi script, tells the life of King Kharavela of Kalinga. It says he brought back the 'Kalinga Jina' image that a Nanda king had carried away.",
    didYouKnow: 'Udayagiri and Khandagiri are twin hills full of rock-cut caves. One of them, the Rani Gumpha, has two storeys.',
    exercise: fill('The Hathigumpha inscription is written in ____ script.', 'Brahmi', ['Odia', 'Roman']), sources: ['hathigumpha'],
    hazards: { small: 'steps', roller: 'monkey', floater: 'leaves' }, tutorial: 'Jump the rock steps',
  },
  r06: {
    ride: 'boita', terrain: 'sea', place: 'The coast of Central Java', sign: { date: '6th–7th century CE', title: 'Kalingga, Java' },
    fact: "A kingdom in Central Java called Kalingga — 'Holing' in Chinese sources — took its name from Kalinga. It was known as a centre for Buddhist scholars.",
    didYouKnow: "Traders from Kalinga sailed to Java, Sumatra and Bali, so Kalinga's name travelled with them.",
    exercise: tf("Chinese sources called the Javanese kingdom 'Holing'.", 'True'), sources: ['kalingga'],
    hazards: { small: 'wave', wide: 'reef', tall: 'bigwave' }, friends: 'dolphin', tutorial: 'Jump the reef',
    teach: 'Hold the button to jump higher',
  },
  r07: {
    ride: 'cart', terrain: 'land', place: 'Old Bhubaneswar', sign: { date: 'Early 7th century CE', title: 'Parasurameswara' },
    fact: "Parasurameswara in Old Bhubaneswar was built under the Shailodbhava kings. It is one of the earliest surviving examples of the Kalinga temple style: a curved tower over the sanctum, plus a hall for devotees.",
    didYouKnow: 'In a Kalinga temple the curved tower is the rekha deula and the hall in front of it is the jagamohana.',
    exercise: fill('The hall for devotees in front of a Kalinga temple is the ____.', 'jagamohana', ['gopuram', 'minaret']), sources: ['kalinga-temples'],
    hazards: { small: 'block', wide: 'chips', tall: 'scaffold' }, tutorial: 'Jump the stone blocks',
  },
  r08: {
    ride: 'cart', terrain: 'land', place: 'Bhubaneswar', sign: { date: '8th century CE', title: 'Vaital Deula' },
    fact: "Vaital Deula in Bhubaneswar is a khakhara temple with a long, barrel-vaulted roof. The roof is said to look like an upturned boat, and its crowning part is called voita — the same word as Kalinga's ships.",
    didYouKnow: "Most Kalinga temples have tall curved towers; a khakhara roof like Vaital Deula's is long and rounded instead.",
    exercise: tf("Vaital Deula's roof is said to look like an upturned boat.", 'True'), sources: ['kalinga-temples'],
    hazards: { small: 'basket', wide: 'chips', tall: 'scaffold', roller: 'pot' }, tutorial: 'Jump the baskets',
  },
  r09: {
    ride: 'foot', terrain: 'land', place: 'Ratnagiri, Jajpur', sign: { date: '8th–10th century CE', title: 'Ratnagiri' },
    fact: "Ratnagiri, Lalitgiri and Udayagiri form Odisha's Buddhist 'Diamond Triangle', named after Vajrayana — 'diamond vehicle' — Buddhism. They flourished under the Bhaumakara kings in the 8th–10th centuries.",
    didYouKnow: 'Lalitgiri was lived in for a very long time: from about the 2nd–3rd century BCE to the 13th century CE.',
    exercise: fill('Ratnagiri means the hill of ____.', 'jewels', ['elephants', 'lamps']), sources: ['diamond-triangle'],
    hazards: { small: 'stupa', wide: 'carved', tall: 'pillar' }, tutorial: 'Hop the votive stupas',
  },
  r10: {
    ride: 'cart', terrain: 'land', place: 'A mango grove in Bhubaneswar', sign: { date: 'c. 950–975 CE', title: 'Mukteswara' },
    fact: "The small Mukteswara temple in Bhubaneswar has an arched stone gateway, or torana, that is unique among the city's temples. It began a century of experiments that led to the Rajarani and Lingaraja temples.",
    didYouKnow: "Mukteswara is often called 'the gem of Kalinga architecture'.",
    exercise: tf("Mukteswara's arched gateway is called a torana.", 'True'), sources: ['mukteswara'],
    hazards: { small: 'mangoBasket', roller: 'mango', tall: 'ladder', wide: 'leafpile' }, tutorial: 'Mind the mango baskets',
  },
  r11: {
    ride: 'cart', terrain: 'land', place: 'Ekamra, Old Bhubaneswar', sign: { date: '11th century CE', title: 'Lingaraja' },
    fact: 'The towering Lingaraja temple was begun by the Somavamsi kings and added to by the Gangas. Its tower, porch, dance hall and offering hall stand in a line, each a different height.',
    didYouKnow: 'A carving on the Lingaraja temple shows a woman steering a boat with an oar.',
    exercise: fill('Lingaraja was begun by the ____ kings.', 'Somavamsi', ['Mughal', 'Maratha']), sources: ['kalinga-temples'],
    hazards: { small: 'basket', wide: 'handcart', tall: 'pole', roller: 'coconut' }, tutorial: 'Jump the flower baskets',
  },
  r12: {
    ride: 'boitaElephant', terrain: 'sea', place: 'The open Bay of Bengal', sign: { date: '11th century CE', title: 'The Sea of Kalinga' },
    fact: "An 11th-century stone relief from Bhubaneswar, now in the Odisha State Museum, shows a boat carrying elephants. It is proof of how big Kalinga's ships could be.",
    didYouKnow: 'Elephants were valuable — and heavy — cargo. Notice how much lower your boita jumps with one on board.',
    exercise: tf('The relief showing a boat with elephants is in the Odisha State Museum.', 'True'), sources: ['maritime-odisha'],
    hazards: { small: 'wave', tall: 'bigwave', wide: 'rock' }, tutorial: 'Heavy cargo: jump early', teach: 'Heavy cargo: your jump is lower, so jump earlier',
  },
  r13: {
    ride: 'cart', terrain: 'land', place: 'Jajpur, Puri and Ganjam', sign: { date: 'Tradition', title: 'Shakti Peethas' },
    fact: 'By tradition Odisha holds several Shakti Peethas. Biraja in Jajpur is linked with the navel of Sati, and an old tantric hymn names Viraja as the goddess of Utkala and Vimala as the goddess of Puri.',
    didYouKnow: "One common list counts Vimala and Tara Tarini among the four 'Adi' — first — Shakti Peethas.",
    exercise: tf("Biraja's shrine is at Jajpur, on the Baitarani river.", 'True'), sources: ['shakti-peethas'],
    hazards: { small: 'stone', wide: 'puddle' }, mech: { sparse: true }, tutorial: 'Jump the stones',
  },
  r14: {
    ride: 'cart', terrain: 'land', place: 'Bada Danda, Puri', sign: { date: '12th century CE', title: 'Puri' },
    fact: 'The great temple of Jagannath at Puri was begun by Anantavarman Chodaganga of the Eastern Ganga dynasty (r. c. 1078–1150). The eight-spoked Nilachakra on top is made of eight metals (ashtadhatu), and the flag above it is changed every day.',
    didYouKnow: "European sailors called it the White Pagoda. By tradition Puri is the eastern of India's four dhams.",
    exercise: fill('The eight-spoked wheel on top of the Puri temple is the ____.', 'Nilachakra', ['Ashokachakra', 'Dharmachakra']), sources: ['jagannath-temple'],
    hazards: { small: 'basket', wide: 'handcart', roller: 'coconut', tall: 'pole' }, tutorial: 'Jump the baskets',
  },
  r15: {
    ride: 'foot', terrain: 'land', place: 'Konark, by the sea', sign: { date: 'c. 1250 CE', title: 'Konark' },
    fact: "Konark's Sun Temple was built around 1250 by King Narasimhadeva I (r. 1238–1264) as Surya's chariot in stone, with 24 carved wheels and 7 horses. Sailors used its dark tower as a landmark and called it the Black Pagoda.",
    didYouKnow: 'One carving at Konark shows a boat carrying a giraffe — a hint of trade with Africa. Konark has been a UNESCO World Heritage Site since 1984.',
    exercise: fill("Konark's stone chariot has ____ carved wheels.", '24', ['12', '7']), sources: ['konark'],
    hazards: { small: 'stone', wide: 'dune', pit: 'foam' }, tutorial: 'Jump the dunes',
  },
  r16: {
    ride: 'elephant', terrain: 'land', place: 'Bhubaneswar', sign: { date: '29 Jun 1435', title: 'Coronation' },
    fact: "Kapilendra Deva founded the Suryavamsi Gajapati empire, which at its height stretched from the lower Ganga to the Kaveri. Gajapati means 'lord of elephants'.",
    didYouKnow: 'The Gajapati age was the last great age of an independent Odisha — it ended in 1568 (Lesson 19).',
    exercise: fill("Gajapati means 'lord of ____'.", 'elephants', ['horses', 'ships']), sources: ['gajapati'],
    hazards: { walker: 'elephantHerd', tall: 'banner', small: 'pot' }, tutorial: 'Elephants crossing!', teach: 'Things move now — watch their speed',
  },
  r17: {
    ride: 'elephant', terrain: 'land', place: 'The road to Kanchi', sign: { date: 'Legend', title: 'Kanchi–Kaveri' },
    fact: "In the Kanchi–Kaveri legend of King Purushottama Deva (r. 1467–1497), Jagannath and Balabhadra ride ahead of the king's army as two horsemen. A milkmaid named Manika gives them curd.",
    didYouKnow: 'The story is painted on the walls of the Jagannath temple.',
    exercise: tf('In the legend, the milkmaid is called Manika.', 'True'), sources: ['gajapati'],
    hazards: {}, mech: { noHazards: true }, segmentSeconds: 26, tutorial: '',
  },
  r18: {
    ride: 'foot', terrain: 'land', place: 'Bada Danda, Puri — Rath Yatra', sign: { date: '1510', title: 'Rath Yatra' },
    fact: 'In 1510 Chaitanya came to Puri and made it his home until 1533; King Prataparudra Deva became his patron. At Rath Yatra, huge crowds pull three great wooden chariots along Bada Danda.',
    didYouKnow: 'The Gajapati king still sweeps the chariots with a golden broom before they roll.',
    exercise: fill('Chaitanya made ____ his home until 1533.', 'Puri', ['Cuttack', 'Konark']), sources: ['chaitanya', 'rath-yatra'],
    hazards: { small: 'flowerHeap', wide: 'rope', roller: 'coconut' }, friends: 'kirtan', tutorial: 'Jump the flower heaps — and the kirtan!',
  },
  r19: {
    ride: 'foot', terrain: 'land', place: 'A palm-leaf forest path at dusk', sign: { date: '1568', title: 'The mridanga' },
    fact: 'In 1568 the Karrani sultanate of Bengal defeated King Mukunda Deva, and the Jagannath temple was attacked. Tradition says a devotee, Bisara Mohanty, saved the Lord\'s sacred Brahma by hiding it inside a mridanga drum.',
    didYouKnow: 'Tradition says the Rath Yatra paused for about nine years until the Brahma was restored.',
    exercise: tf('Tradition says the sacred Brahma was hidden in a mridanga drum.', 'True'), sources: ['bisara-mohanty'],
    hazards: { small: 'root', wide: 'log', floater: 'branch' }, recordVis: 'drum', tutorial: 'Catch the drum — run!',
  },
  r20: {
    ride: 'palanquin', terrain: 'land', place: 'Khurda, below Barunei hill', sign: { date: '1803', title: 'Khurda' },
    fact: 'After the Second Anglo-Maratha War, the East India Company took Odisha in 1803, and the Raja of Khurda lost his throne.',
    didYouKnow: 'Cowrie shells were Odisha\'s everyday money until the East India Company abolished them — the cowries you collect are a nod to that.',
    exercise: tf('The Company took Odisha after the Second Anglo-Maratha War.', 'True'), sources: ['company-rule'],
    hazards: { tall: 'tollgate', pit: 'pothole', small: 'milestone', walker: 'oxcart' }, mech: { dark: true }, tutorial: 'Jump the toll gates',
    teach: 'Dark stretches ahead: watch the lamplight',
  },
  r21: {
    ride: 'foot', terrain: 'land', place: 'Khurda forest', sign: { date: 'Mar 1817', title: 'Paika Bidroha' },
    fact: "In March 1817 the Paikas — Odisha's traditional militia — rose against Company rule, led by Buxi Jagabandhu. Their grievances included lost rent-free lands, taxes demanded in silver instead of cowries, and new controls on salt.",
    didYouKnow: "'Buxi' was a title: Jagabandhu was the commander of the Raja of Khurda's forces.",
    exercise: fill('The Paikas objected to taxes demanded in ____ instead of cowries.', 'silver', ['salt', 'rice']), sources: ['paika'],
    hazards: { small: 'stump', wide: 'log', roller: 'boulder' }, mech: { dark: true }, tutorial: 'Jump the stumps',
  },
  r22: {
    ride: 'foot', terrain: 'land', place: 'Coastal Odisha', sign: { date: '1866', title: "Na'anka" },
    fact: "The famine of 1866 took the lives of about a third of coastal Odisha's people. It pushed demands for irrigation, roads and communication.",
    didYouKnow: 'Relief kitchens, called anna chhatra, were set up to feed people.',
    exercise: tf('The 1866 famine pushed demands for irrigation and roads.', 'True'), sources: ['famine-1866'],
    hazards: { small: 'shrub' }, mech: { sparse: true, noCowries: true }, segmentSeconds: 32, tutorial: '',
  },
  r23: {
    ride: 'pressCart', terrain: 'land', place: 'Cuttack', sign: { date: '1866–1868', title: 'Utkal Dipika' },
    fact: 'Utkal Dipika, an Odia newspaper, began in Cuttack in 1866. By 1868 Fakir Mohan Senapati was publishing from Balasore, and a college opened in Cuttack — later Ravenshaw.',
    didYouKnow: 'Before printing, Odia books were written by hand on palm leaves — like the records you are catching.',
    exercise: fill('Utkal Dipika began in ____ in 1866.', 'Cuttack', ['Puri', 'Balasore']), sources: ['print-odia'],
    hazards: { floater: 'newsprint', small: 'typeCrate', wide: 'paperBundle', roller: 'inkBarrel' }, tutorial: "Don't jump into the flying newsprint",
  },
  r24: {
    ride: 'bicycle', terrain: 'land', place: 'Cuttack', sign: { date: '30 Dec 1903', title: 'Utkal Sammilani' },
    fact: "On 30 December 1903 the Utkal Sammilani gathered in Cuttack. Led by Madhusudan Das, 'Utkal Gourab', it campaigned to unite the scattered Odia-speaking lands.",
    didYouKnow: "'Utkal Gourab' means 'the pride of Utkal' — Utkal is an old name for Odisha.",
    exercise: tf("Madhusudan Das was called 'Utkal Gourab'.", 'True'), sources: ['utkal-sammilani'],
    hazards: { small: 'chair', wide: 'bench', tall: 'bannerPole', roller: 'wheelRim' }, tutorial: 'Jump the chairs',
  },
  r25: {
    ride: 'bicycle', terrain: 'land', place: 'Cuttack', sign: { date: '1 Apr 1936', title: 'Utkal Divas' },
    fact: 'Orissa became a separate province on 1 April 1936 — the first province formed on the basis of language. Odisha celebrates it every year as Utkal Divas.',
    didYouKnow: "That's why Odisha's birthday is in April: 1 April is Utkal Divas, or Odisha Day.",
    exercise: fill('Every 1 April, Odisha celebrates ____.', 'Utkal Divas', ['Rath Yatra', 'Bali Jatra']), sources: ['utkal-sammilani'],
    hazards: { small: 'lampStand', wide: 'newspapers', roller: 'conch', tall: 'garlandPole' }, mech: { flood: true }, tutorial: 'Jump the lamp stands',
  },
  r26: {
    ride: 'countryBoat', terrain: 'water', place: 'Nilakanthapur ghat, Brahmani river', sign: { date: '11 Oct 1938', title: 'Nilakanthapur ghat' },
    fact: "Twelve-year-old Baji Rout, a boatman's son and a member of the Prajamandal's children's wing, refused to ferry the police across the Brahmani river, and was killed. He is remembered as India's youngest martyr of the freedom struggle.",
    didYouKnow: 'Baji Rout came from Dhenkanal, then a princely state, where the Prajamandal was campaigning for people\'s rights.',
    exercise: tf('Baji Rout refused to ferry the police across the river.', 'True'), sources: ['baji-rout'],
    hazards: { small: 'driftwood', wide: 'sandbar' }, mech: { sparse: true, night: true, rain: true }, segmentSeconds: 34, recordVis: 'oar', tutorial: '',
  },
  r27: {
    ride: 'dakota', terrain: 'air', place: 'Over the Java Sea', sign: { date: '24 Jul 1947', title: 'Java → India' },
    fact: "At Nehru's request, pilot Biju Patnaik flew Indonesian leader Sutan Sjahrir out of Dutch-controlled Java, reaching India via Singapore on 24 July 1947. Indonesia honoured him with the title Bhumi Putra.",
    didYouKnow: 'Kalinga reached Indonesia again — this time by air.',
    exercise: fill('Indonesia honoured Biju Patnaik with the title ____.', 'Bhumi Putra', ['Bharat Ratna', 'Utkal Gourab']), sources: ['biju-patnaik'],
    hazards: { air: 'stormcell', floater: 'birds' }, tutorial: 'Hold to climb, let go to glide', teach: 'Flight: hold to climb, let go to glide down',
  },
  r28: {
    ride: 'bicycle', terrain: 'land', place: 'Bhubaneswar new capital', sign: { date: '13 Apr 1948', title: 'New Capital' },
    fact: 'On 13 April 1948 Nehru laid the foundation stone of a new capital at Bhubaneswar. Planner Otto Koenigsberger designed it around neighbourhood units, originally for about 40,000 people.',
    didYouKnow: "The new city was planned right beside Old Bhubaneswar's ancient temple town.",
    exercise: tf("Bhubaneswar's planner was Otto Koenigsberger.", 'True'), sources: ['bhubaneswar-plan'],
    hazards: { small: 'surveyStake', wide: 'chain', tall: 'theodolite', walker: 'cow' }, tutorial: 'Jump the survey stakes',
  },
  r29: {
    ride: 'bicycle', terrain: 'land', place: 'Hirakud Dam, Sambalpur', sign: { date: '13 Jan 1957', title: 'Hirakud' },
    fact: 'Hirakud Dam across the Mahanadi opened on 13 January 1957. It is the longest earthen dam in the world, with a reservoir about 55 km long, and was India\'s first big multipurpose river project after independence.',
    didYouKnow: "'Multipurpose' means one dam doing many jobs: storing water for farms, holding back floods and making electricity.",
    exercise: fill('Hirakud Dam is built across the ____ river.', 'Mahanadi', ['Brahmani', 'Baitarani']), sources: ['hirakud'],
    hazards: { floater: 'spray', walker: 'cattle', small: 'milestone' }, tutorial: 'Jump the cattle — not the spray',
  },
  r30: {
    ride: 'train', terrain: 'land', place: 'Rourkela', sign: { date: '3 Feb 1959', title: 'Rourkela' },
    fact: "On 3 February 1959 Rourkela lit its first blast furnace, named 'Parvati'. It was India's first integrated public-sector steel plant, built with West German collaboration.",
    didYouKnow: 'Look for the hockey goals in the township fields — the Rourkela area is famous for its hockey players.',
    exercise: tf("Rourkela's first blast furnace was named 'Parvati'.", 'True'), sources: ['rourkela'],
    hazards: { walker: 'slagCart', small: 'railSwitch', tall: 'signal', wide: 'sleepers' }, tutorial: 'Jump the rail switches',
  },
  r31: {
    ride: 'foot', terrain: 'land', place: 'Paradip coast', sign: { date: '29 Oct 1999', title: 'Paradip' },
    fact: 'On 29 October 1999 a super cyclone made landfall near Paradip with winds of about 250 km/h. It killed around 10,000 people.',
    didYouKnow: 'Odisha learned from it — the next chapter shows how.',
    exercise: tf('The 1999 super cyclone made landfall near Paradip.', 'True'), sources: ['cyclones'],
    hazards: { small: 'debris', wide: 'fallenPalm', floater: 'flyingSheet' }, mech: { wind: 'push', rain: true, sparse: true }, segmentSeconds: 40,
    tutorial: 'Gusts push your jump back', teach: 'Wind: gusts push your jump — watch the streaks',
  },
  r32: {
    ride: 'bus', terrain: 'land', place: 'A highway in Odisha', sign: { date: '1 Nov 2011', title: 'Orissa → Odisha' },
    fact: "From 1 November 2011 the state's English name changed from Orissa to Odisha, and its language from Oriya to Odia.",
    didYouKnow: "The state's name changed through the Orissa (Alteration of Name) Act, 2011; the language's through a constitutional amendment passed alongside it.",
    exercise: fill('Since 2011 the language is spelled ____ in English.', 'Odia', ['Oriya', 'Udiya']), sources: ['name-change'],
    hazards: { small: 'paintBucket', tall: 'ladder', walker: 'cow', wide: 'barricade' }, tutorial: 'Jump the paint buckets', teach: 'Faster now — and night is coming',
  },
  r33: {
    ride: 'foot', terrain: 'land', place: 'Ganjam coast', sign: { date: '12 Oct 2013', title: 'Phailin' },
    fact: 'After 1999, Odisha set up India\'s first state disaster management authority and built cyclone shelters. Before Cyclone Phailin struck on 12 October 2013, about a million people were evacuated, and deaths fell to double digits.',
    didYouKnow: 'The glowing shelters in this chapter are your checkpoints — just as real shelters kept people safe.',
    exercise: tf('About a million people were evacuated before Phailin.', 'True'), sources: ['cyclones'],
    hazards: { small: 'debris', wide: 'branchPile', floater: 'flyingSheet' }, mech: { wind: 'push', shelters: true, rain: true }, tutorial: 'Shelters are safe — and checkpoints',
  },
  r34: {
    ride: 'foot', terrain: 'land', place: 'An Odia alphabet chart', sign: { date: '20 Feb 2014', title: 'Classical Odia' },
    fact: 'On 20 February 2014 Odia became India\'s sixth classical language. Classical languages are honoured for their long history and rich old literature.',
    didYouKnow: 'The letters you are running on come from the Odia alphabet chart every Odia child learns.',
    exercise: fill('Odia became India\'s ____ classical language.', 'sixth', ['first', 'tenth']), sources: ['odia-classical'],
    hazards: { small: 'inkpot', wide: 'slate' }, mech: { platforms: true }, tutorial: 'Run along the letters',
  },
  r35: {
    ride: 'scooter', terrain: 'land', place: 'Kalinga Stadium, Bhubaneswar', sign: { date: '2018', title: 'Hockey' },
    fact: "Bhubaneswar hosted the 2018 Men's Hockey World Cup. In 2023 it co-hosted again with Rourkela's 20,000-seat Birsa Munda stadium — the first time any nation hosted two editions in a row.",
    didYouKnow: 'Remember the hockey goals in Rourkela\'s township fields in Lesson 30?',
    exercise: tf("India hosted the Men's Hockey World Cup in 2018 and again in 2023.", 'True'), sources: ['hockey'],
    hazards: { roller: 'hockeyBall', small: 'cone', tall: 'goal', wide: 'kitBag' }, mech: { night: true }, tutorial: 'Hockey balls incoming!',
  },
  r36: {
    ride: 'foot', terrain: 'land', place: 'Shree Mandira, Puri', sign: { date: '17 Jan 2024', title: 'Parikrama' },
    fact: 'On 17 January 2024 the Shree Mandira Parikrama heritage corridor opened in Puri. It creates a 75-metre zone around the temple\'s outer wall for pilgrims.',
    didYouKnow: "The temple's outer wall is the Meghanada Pacheri (Lesson 14).",
    exercise: fill('The corridor creates a ____-metre zone around the temple.', '75', ['7', '750']), sources: ['parikrama'],
    hazards: { small: 'planter', wide: 'queueRail', tall: 'shadeUmbrella' }, tutorial: 'Jump the planters',
  },
  r37: {
    ride: 'scooter', terrain: 'land', place: 'Info Valley, Bhubaneswar', sign: { date: '2026 · Now', title: 'Info Valley' },
    fact: "Work began at Bhubaneswar's Info Valley on India's first end-to-end silicon carbide chip plant. In 2026 the state announced plans for an ~871-acre semiconductor hub near Naraj.",
    didYouKnow: 'From dugout canoes to computer chips: 3,500 years of Kalinga builders.',
    exercise: tf('The new chip plant is at Info Valley in Bhubaneswar.', 'True'), sources: ['semiconductor'],
    hazards: { small: 'cone', wide: 'boxes', walker: 'robot', tall: 'barrier' }, mech: { night: true }, tutorial: 'Jump the traffic cones',
  },
  f1: {
    ride: 'maglev', terrain: 'land', place: 'The Bhubaneswar–Cuttack–Puri–Paradip tri-city', sign: { date: '1 Apr 2036', title: 'Boita Line' },
    fact: "Real: Odisha turns one hundred on 1 April 2036, and the state's Vision 2036 aims for a US$500 billion economy. Imagined: Bhubaneswar, Cuttack, Puri and Paradip joined into one glowing tri-city by the Boita Line — maglev pods shaped like boitas.",
    didYouKnow: 'Every future idea in this supplementary reader grows out of something real from an earlier lesson.',
    exercise: tf('The Boita Line already exists today.', 'False'), sources: ['vision-2036'],
    hazards: { small: 'cargoPod', floater: 'drone', walker: 'serviceBot' }, tutorial: 'Hop the cargo pods', teach: 'Not in syllabus: everything gets faster',
  },
  f2: {
    ride: 'eboat', terrain: 'water', place: 'Chilika', sign: { date: '2047', title: 'Chilika' },
    fact: 'Imagined: Irrawaddy dolphins thrive in Chilika, floating solar panels shade the canals, and tiny lantern-drones guide olive ridley turtle hatchlings to the sea at night. Real: olive ridley turtles nest in huge numbers on Odisha\'s beaches.',
    didYouKnow: 'Your electric boat is a callback to the dugout canoe of Lesson 1.',
    exercise: tf('Olive ridley turtles nest on Odisha\'s beaches.', 'True'), sources: ['future-notes'],
    hazards: { small: 'buoy', wide: 'logBoom', floater: 'drone' }, friends: 'turtle', mech: { night: true }, tutorial: 'Jump the buoys',
  },
  f3: {
    ride: 'glider', terrain: 'air', place: 'The mangrove coast', sign: { date: '2061', title: 'Storm coast' },
    fact: 'Imagined: towns walled by mangroves, shelters that rise on stilts, and turbines that harvest storm winds. Real: after 1999, Odisha built cyclone shelters and learned to evacuate fast (Lesson 33).',
    didYouKnow: 'The wind has flipped: now a gust lifts you if you ride it.',
    exercise: tf('In this chapter, gusts push you down.', 'False'), sources: ['future-notes', 'cyclones'],
    hazards: { air: 'stormcell', floater: 'turbineGust' }, mech: { wind: 'boost', rain: true }, tutorial: 'Ride the gusts', teach: 'Gusts now lift you — ride them',
  },
  f4: {
    ride: 'maglev', terrain: 'land', place: 'Raghurajpur and the Naraj chip city', sign: { date: '2088', title: 'Glass talapatra' },
    fact: "Imagined: Odisha's palm-leaf manuscript tradition reborn as glass data-leaves holding all of Odia literature, Pattachitra painters in Raghurajpur painting with light, and the Naraj chip valley grown into a city. Real: Raghurajpur is Odisha's heritage village of Pattachitra painters.",
    didYouKnow: 'The palm leaves you have been catching are called talapatra.',
    exercise: fill('The palm-leaf records are called ____.', 'talapatra', ['pattachitra', 'boita']), sources: ['future-notes'],
    hazards: { small: 'dataCube', tall: 'lightPillar', floater: 'drone' }, tutorial: 'Hop the data cubes',
  },
  f5: {
    ride: 'lightsail', terrain: 'orbit', place: 'Low orbit above Konark', sign: { date: '2120', title: 'Surya Array' },
    fact: "Imagined: a 24-spoked solar-sail array in orbit — Surya's chariot as a power station. Real: Konark's stone chariot has 24 wheels (Lesson 15).",
    didYouKnow: 'Low gravity: tap to flip between the floor and the ceiling.',
    exercise: tf('The Surya Array is real today.', 'False'), sources: ['future-notes', 'konark'],
    hazards: { small: 'antenna', ceil: 'panel' }, tutorial: 'Tap to flip gravity', teach: 'Orbit: tap to flip gravity',
  },
  f6: {
    ride: 'starBoita', terrain: 'air', place: 'Above the Kalinga coast', sign: { date: 'Kartika Purnima 2150', title: 'Bali Jatra' },
    fact: 'Imagined: on the Kartika full moon, boita-shaped starships launch from the Kalinga coast while children float lamp-drones on the sea.',
    didYouKnow: '"ā kā mā bai" — the old sailing chant of Lesson 3 still echoes.',
    exercise: fill('Starships launch on Kartika ____.', 'Purnima', ['Amavasya', 'Ekadashi']), sources: ['future-notes', 'boita-bandana'],
    hazards: { air: 'asteroid', floater: 'satellite' }, tutorial: 'Hold to climb', teach: 'Hold to climb through the stars',
  },
  f7: {
    ride: 'foot', terrain: 'land', place: 'Bada Danda, Puri', sign: { date: '2200', title: 'Rath Yatra' },
    fact: 'Imagined: Puri in 2200. The city around is unrecognisable, but Rath Yatra on Bada Danda is exactly as it always was — wooden chariots, ropes and crowds — with little robots helping sweep the road.',
    didYouKnow: 'The chariot canopies keep their colours: red and yellow, red and green, red and black.',
    exercise: tf('In 2200 the chariots are still made of wood.', 'True'), sources: ['future-notes', 'rath-yatra'],
    hazards: {}, mech: { noHazards: true }, segmentSeconds: 26, tutorial: '',
  },
  f8: {
    ride: 'starBoita', terrain: 'air', place: 'A new sea', sign: { date: '∞', title: 'New seas' },
    fact: "Kalinga's ships never stopped sailing. They just kept finding new seas.",
    didYouKnow: 'You have unlocked Endless Kalinga.',
    exercise: tf('The voyage never ended.', 'True'), sources: ['future-notes'],
    hazards: { air: 'meteor' }, mech: { rhythm: true }, segmentSeconds: 70, tutorial: 'Follow the drum', teach: 'Fly the gates to the mardala',
  },
};

const LEADS: Record<number, AnyToken> = { 1: 'peacock', 2: 'laterite', 3: 'sindoor', 4: 'neel', 5: 'marigold', 6: 'rani', 7: 'neel' };

/** Difficulty window that slides upward through the game (§5). */
export function difficultyWindow(num: number): [number, number] {
  const k = (num - 1) / 44;
  const lo = Math.max(1, Math.round(1 + k * 6.5));
  const hi = Math.min(10, Math.round(3 + k * 7.5));
  return [lo, Math.max(lo, hi)];
}

function build(o: RecordOutline): RecordDef {
  const b = BASE[o.id];
  const mech = b.mech ?? {};
  let difficulty = b.difficulty ?? difficultyWindow(o.num);
  if (mech.sparse || o.somber) difficulty = [1, Math.min(3, difficulty[1])];
  return {
    ...o,
    ...b,
    ride: b.ride,
    mech,
    lead: b.lead ?? LEADS[o.act],
    segmentSeconds: b.segmentSeconds ?? SEGMENT_S,
    difficulty,
  };
}

export const RECORDS: Record<string, RecordDef> = Object.fromEntries(OUTLINE.map((o) => [o.id, build(o)]));

export function outlineById(id: string): RecordOutline | undefined {
  return OUTLINE.find((r) => r.id === id);
}

export function recordByNum(num: number): RecordDef | undefined {
  const o = OUTLINE.find((r) => r.num === num);
  return o ? RECORDS[o.id] : undefined;
}

export function nextRecord(id: string): RecordOutline | undefined {
  const i = OUTLINE.findIndex((r) => r.id === id);
  return i >= 0 ? OUTLINE[i + 1] : undefined;
}

/** Odia numerals for page numbers (୦–୯). See STRINGS_TO_VERIFY.md. */
export function odiaNumeral(n: number): string {
  const digits = ['୦', '୧', '୨', '୩', '୪', '୫', '୬', '୭', '୮', '୯'];
  return String(n).split('').map((d) => digits[Number(d)] ?? d).join('');
}
