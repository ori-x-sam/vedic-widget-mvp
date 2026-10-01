// Save data + settings in localStorage. Tiny observable store; screens subscribe to re-render.
export interface Settings { music: number; sfx: number; haptics: boolean; autofire: boolean; showSafe: boolean; reducedFx: boolean; muted: boolean }
export interface SaveData {
  coins: number;
  owned: string[];
  loadout: { weapons: string[]; super: string; charm: string };
  beaten: string[];
  seen: string[];
  settings: Settings;
}

const KEY = "slummonkey.save.v1";
export const freshSave = (): SaveData => ({
  coins: 0,
  owned: ["coin", "to-the-moon"],
  loadout: { weapons: ["coin"], super: "to-the-moon", charm: "" },
  beaten: [],
  seen: [],
  settings: { music: 0.55, sfx: 0.8, haptics: true, autofire: false, showSafe: false, reducedFx: false, muted: false },
});

export class Store {
  data: SaveData;
  private subs = new Set<(d: SaveData) => void>();
  constructor(private storage: Storage | null = safeStorage()) {
    this.data = freshSave();
    try {
      const s = this.storage?.getItem(KEY);
      if (s) this.data = { ...freshSave(), ...JSON.parse(s), settings: { ...freshSave().settings, ...JSON.parse(s).settings } };
    } catch { /* corrupt or blocked: start fresh */ }
  }
  update(fn: (d: SaveData) => void) {
    fn(this.data);
    try { this.storage?.setItem(KEY, JSON.stringify(this.data)); } catch { /* ignore */ }
    for (const s of this.subs) s(this.data);
  }
  subscribe(fn: (d: SaveData) => void) { this.subs.add(fn); return () => this.subs.delete(fn); }
  reset() { this.update((d) => Object.assign(d, freshSave())); }
}

function safeStorage(): Storage | null {
  try { const s = window.localStorage; s.getItem("x"); return s; } catch { return null; }
}
