// Progress, settings and unlocked lessons in localStorage — every read/write
// wrapped so the game still works when storage is unavailable (§8).

export interface Settings {
  assist: boolean;
  reducedMotion: boolean;
  music: boolean;
  sfx: boolean;
  textScale: number;
}

export interface SaveData {
  v: 1;
  lessons: Record<string, { caught: boolean; at: number }>;
  checkpoint: string | null;
  seenTwist: boolean;
  bestCowries: number;
  settings: Settings;
}

const KEY = 'kalinga-rush.v1';

const fresh = (): SaveData => ({
  v: 1,
  lessons: {},
  checkpoint: null,
  seenTwist: false,
  bestCowries: 0,
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
