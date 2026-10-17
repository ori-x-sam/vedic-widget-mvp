// Progress, settings and unlocked lessons in localStorage — every read/write
// wrapped so the game still works when storage is unavailable (§8).

export interface Settings {
  assist: boolean;
  reducedMotion: boolean;
  music: boolean;
  sfx: boolean;
  textScale: number;
}

/** The journey in progress: where to resume and the running totals for the report card. */
export interface RunSave {
  /** Record to resume from (start of that record). */
  checkpoint: string;
  cowries: number;
  diyasLost: number;
  /** Seconds played this journey. */
  time: number;
  assisted: boolean;
  /** Records caught on this journey. */
  caught: string[];
}

export interface SaveData {
  v: 1;
  lessons: Record<string, { caught: boolean; at: number }>;
  /** Kept for old saves; the live checkpoint is run.checkpoint. */
  checkpoint: string | null;
  run: RunSave | null;
  /** Highest act whose start the player has reached (chapter checkpoints on the title). */
  actReached: number;
  seenTwist: boolean;
  endless: boolean;
  bestCowries: number;
  bestEndless: number;
  finished: boolean;
  settings: Settings;
}

const KEY = 'kalinga-rush.v1';

const fresh = (): SaveData => ({
  v: 1,
  lessons: {},
  checkpoint: null,
  run: null,
  actReached: 1,
  seenTwist: false,
  endless: false,
  bestCowries: 0,
  bestEndless: 0,
  finished: false,
  settings: { assist: false, reducedMotion: false, music: true, sfx: true, textScale: 1 },
});

let cache: SaveData | null = null;

export function load(): SaveData {
  if (cache) return cache;
  let data = fresh();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      if (parsed && parsed.v === 1) data = { ...data, ...parsed, settings: { ...data.settings, ...(parsed.settings ?? {}) } };
    }
  } catch {
    // storage blocked or corrupt: play on with defaults
  }
  cache = data;
  return data;
}

export function save(mutate: (d: SaveData) => void): SaveData {
  const d = load();
  mutate(d);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // ignore: progress just won't persist
  }
  return d;
}

/** Forget everything except settings (title → "start from the very beginning" keeps lessons). */
export function resetProgress(keepLessons = true): void {
  save((d) => {
    const s = d.settings;
    const lessons = d.lessons;
    const keep = { seenTwist: d.seenTwist, endless: d.endless, bestCowries: d.bestCowries, bestEndless: d.bestEndless, finished: d.finished, actReached: d.actReached };
    Object.assign(d, fresh(), keep, { settings: s, lessons: keepLessons ? lessons : {} });
  });
}
