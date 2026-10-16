// The history bible as typed data (brief §3). Card text must match HISTORY.md.
// Phase 1 carries Record 01 in full plus the outline (date + headline) of all
// 45 records; the remaining lesson cards are added in Phase 2.
import type { ActNum, SceneToken } from './palettes';
import type { VehicleId } from '../systems/physics';

export type CardKind = 'history' | 'tradition' | 'legend' | 'speculative';
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

export interface RecordDef extends RecordOutline {
  ride: VehicleId;
  place: string;
  sign: { date: string; title: string };
  fact: string; // 2–3 sentences for a 12-year-old
  didYouKnow: string;
  exercise: Exercise;
  /** Keys into HISTORY.md. */
  sources: string[];
  dateNote?: string;
  hazards: HazardKind[];
  lead: SceneToken;
  /** Length of the record's run segment at its speed. */
  segmentSeconds: number;
  /** Difficulty window for chunk selection [min, max] (1–10). */
  difficulty: [number, number];
}

export const RECORDS_BEFORE_TWIST = 37;
export const RECORDS_TOTAL = 45;

export const OUTLINE: RecordOutline[] = [
  { id: 'r01', num: 1, act: 1, kind: 'history', dateLine: 'c. 1500 BCE', headline: 'Boat-builders on the Chilika shore.', ride: 'canoe' },
  { id: 'r02', num: 2, act: 1, kind: 'history', dateLine: 'c. 300 BCE', headline: 'A city of eight gates.', ride: 'cart' },
  { id: 'r03', num: 3, act: 1, kind: 'history', dateLine: 'Kartika Purnima', headline: 'The boitas sail for the golden islands.', ride: 'boita' },
  { id: 'r04', num: 4, act: 1, kind: 'history', dateLine: '261 BCE', headline: 'The Kalinga War. An emperor lays down the sword.', ride: 'foot', somber: true },
  { id: 'r05', num: 5, act: 1, kind: 'history', dateLine: 'c. 2nd–1st century BCE', headline: 'Kharavela writes his story in stone.', ride: 'elephant' },
  { id: 'r06', num: 6, act: 2, kind: 'history', dateLine: '6th–7th century CE', headline: "A kingdom in Java carries Kalinga's name.", ride: 'boita' },
  { id: 'r07', num: 7, act: 2, kind: 'history', dateLine: 'Early 7th century CE', headline: 'Parasurameswara: an early Kalinga temple.', ride: 'cart' },
  { id: 'r08', num: 8, act: 2, kind: 'history', dateLine: '8th century CE', headline: 'Vaital Deula: a temple roofed like a boat.' },
  { id: 'r09', num: 9, act: 2, kind: 'history', dateLine: '8th–10th century CE', headline: 'Ratnagiri, the hill of jewels.', ride: 'foot' },
  { id: 'r10', num: 10, act: 2, kind: 'history', dateLine: 'c. 950–975 CE', headline: 'Mukteswara: the gem of Kalinga architecture.' },
  { id: 'r11', num: 11, act: 2, kind: 'history', dateLine: '11th century CE', headline: 'Lingaraja rises over Ekamra.' },
  { id: 'r12', num: 12, act: 2, kind: 'history', dateLine: '11th century CE', headline: 'Ships that carried elephants.', ride: 'boitaElephant' },
  { id: 'r13', num: 13, act: 2, kind: 'tradition', dateLine: 'Tradition', headline: 'Where the goddess dwells.' },
  { id: 'r14', num: 14, act: 2, kind: 'history', dateLine: '12th century CE', headline: 'A temple for Jagannath at Puri.' },
  { id: 'r15', num: 15, act: 2, kind: 'history', dateLine: 'c. 1250 CE', headline: "Konark: the Sun's chariot in stone.", ride: 'boita' },
  { id: 'r16', num: 16, act: 3, kind: 'history', dateLine: '29 Jun 1435', headline: 'Kapilendra Deva is crowned Gajapati.', ride: 'elephant' },
  { id: 'r17', num: 17, act: 3, kind: 'legend', dateLine: 'Legend', headline: 'Two riders and a milkmaid.' },
  { id: 'r18', num: 18, act: 3, kind: 'history', dateLine: '1510', headline: 'Chaitanya arrives in Puri.', ride: 'foot' },
  { id: 'r19', num: 19, act: 3, kind: 'history', dateLine: '1568', headline: 'The last independent kingdom falls.' },
  { id: 'r20', num: 20, act: 4, kind: 'history', dateLine: '1803', headline: 'The East India Company takes Odisha.' },
  { id: 'r21', num: 21, act: 4, kind: 'history', dateLine: 'Mar 1817', headline: 'The Paikas rise.' },
  { id: 'r22', num: 22, act: 4, kind: 'history', dateLine: '1866', headline: "Na'anka: the great famine.", somber: true },
  { id: 'r23', num: 23, act: 4, kind: 'history', dateLine: '1866–1868', headline: 'Odia finds its printed voice.', ride: 'pressCart' },
  { id: 'r24', num: 24, act: 4, kind: 'history', dateLine: '30 Dec 1903', headline: 'The Utkal Sammilani gathers in Cuttack.' },
  { id: 'r25', num: 25, act: 4, kind: 'history', dateLine: '1 Apr 1936', headline: 'Odisha becomes a province of its own.' },
  { id: 'r26', num: 26, act: 4, kind: 'history', dateLine: '11 Oct 1938', headline: 'A boatboy says no.', ride: 'countryBoat', somber: true },
  { id: 'r27', num: 27, act: 5, kind: 'history', dateLine: '24 Jul 1947', headline: 'A Dakota flies to Java.', ride: 'dakota' },
  { id: 'r28', num: 28, act: 5, kind: 'history', dateLine: '13 Apr 1948', headline: 'A new capital is planned at Bhubaneswar.', ride: 'bicycle' },
  { id: 'r29', num: 29, act: 5, kind: 'history', dateLine: '13 Jan 1957', headline: 'Hirakud Dam opens.', ride: 'bicycle' },
  { id: 'r30', num: 30, act: 5, kind: 'history', dateLine: '3 Feb 1959', headline: 'Rourkela lights its first blast furnace.', ride: 'train' },
  { id: 'r31', num: 31, act: 5, kind: 'history', dateLine: '29 Oct 1999', headline: 'The Super Cyclone.', ride: 'foot', somber: true },
  { id: 'r32', num: 32, act: 6, kind: 'history', dateLine: '1 Nov 2011', headline: 'Orissa becomes Odisha.', ride: 'bus' },
  { id: 'r33', num: 33, act: 6, kind: 'history', dateLine: '12 Oct 2013', headline: 'Phailin: a million moved to safety.' },
  { id: 'r34', num: 34, act: 6, kind: 'history', dateLine: '20 Feb 2014', headline: 'Odia becomes a classical language.' },
  { id: 'r35', num: 35, act: 6, kind: 'history', dateLine: '2018', headline: 'Hockey comes home.', ride: 'scooter' },
  { id: 'r36', num: 36, act: 6, kind: 'history', dateLine: '17 Jan 2024', headline: 'A walkway around Shree Mandira.' },
  { id: 'r37', num: 37, act: 6, kind: 'history', dateLine: '2026 · Now', headline: 'Chips on the coast.', ride: 'scooter' },
  { id: 'f1', num: 38, act: 7, kind: 'speculative', dateLine: '1 Apr 2036', headline: 'Odisha turns one hundred.', ride: 'maglev' },
  { id: 'f2', num: 39, act: 7, kind: 'speculative', dateLine: '2047', headline: 'Chilika, restored and humming.', ride: 'eboat' },
  { id: 'f3', num: 40, act: 7, kind: 'speculative', dateLine: '2061', headline: "The coast cyclones can't break.", ride: 'glider' },
  { id: 'f4', num: 41, act: 7, kind: 'speculative', dateLine: '2088', headline: 'Talapatra in glass.' },
  { id: 'f5', num: 42, act: 7, kind: 'speculative', dateLine: '2120', headline: "Konark's wheel, unfurled in orbit.", ride: 'lightsail' },
  { id: 'f6', num: 43, act: 7, kind: 'speculative', dateLine: 'Kartika Purnima 2150', headline: 'Bali Jatra beyond the sky.', ride: 'starBoita' },
  { id: 'f7', num: 44, act: 7, kind: 'speculative', dateLine: '2200', headline: 'Some things never change.' },
  { id: 'f8', num: 45, act: 7, kind: 'speculative', dateLine: '∞', headline: 'The voyage never ended.', ride: 'starBoita' },
];

export const RECORDS: Record<string, RecordDef> = {
  r01: {
    ...OUTLINE[0],
    ride: 'canoe',
    place: 'Golbai Sasan, on the Malaguni river north of Chilika',
    sign: { date: 'c. 1500 BCE', title: 'Golbai Sasan' },
    fact:
      'At Golbai Sasan, on the Malaguni river just north of Chilika lagoon, archaeologists dug up many woodworking adzes — tools for shaping logs. So many adzes suggest this was a boat-building centre. The people here lived in round wooden huts with floors of rammed earth.',
    didYouKnow:
      "Chilika is often called Asia's largest brackish-water lagoon: river water and sea water mix there, and Irrawaddy dolphins swim in it.",
    exercise: {
      kind: 'fill',
      prompt: 'Many woodworking ____ found at Golbai Sasan suggest it was a boat-building centre.',
      options: ['adzes', 'coins', 'bricks'],
      answer: 'adzes',
    },
    sources: ['golbai-sasan', 'chilika'],
    dateNote: 'Estimates span the 2nd millennium BCE; displayed as "c. 1500 BCE".',
    hazards: ['reed', 'mud', 'stakes'],
    lead: 'peacock',
    segmentSeconds: 34,
    difficulty: [1, 3],
  },
};

export function outlineById(id: string): RecordOutline | undefined {
  return OUTLINE.find((r) => r.id === id);
}

export function recordByNum(num: number): RecordDef | undefined {
  const o = OUTLINE.find((r) => r.num === num);
  return o ? RECORDS[o.id] : undefined;
}

/** Odia numerals for page numbers (୦–୯). See STRINGS_TO_VERIFY.md. */
export function odiaNumeral(n: number): string {
  const digits = ['୦', '୧', '୨', '୩', '୪', '୫', '୬', '୭', '୮', '୯'];
  return String(n).split('').map((d) => digits[Number(d)] ?? d).join('');
}
