// Two stores, plain data only, changed only through ./actions with setState (never mutated in place).
// `game` holds the run and the last save point (a snapshot at each night's start and each morning); only the save is
// written to disk, under one raw key, and zod checks it on load. `ui` is the view's own state and is never saved.
import { createStore } from 'zustand/vanilla';
import { persist, type PersistStorage } from 'zustand/middleware';
import { newGame, parseSave, type GameState } from './game';

/** The save's key, so two games on one origin don't share a save. */
export const META_KEY = 'jyotsna-mahal.save';

export type GameStore = { run: GameState; save: GameState | null };

/** Add a name here per screen; the screen's draw function shows itself when this matches. */
export type Screen = 'title' | 'play';
/** The casebook's pages. */
export type Tab = 'evidence' | 'photograph' | 'testimony' | 'note' | 'thoughts' | 'pockets' | 'deduction';
/** A card over everything: a night's title, a night's reveal, an ending, the controls. */
export type Card = { kind: 'title' | 'reveal' | 'ending' | 'controls'; title: string; sub: string; text: string } | null;

export type UiState = {
  screen: Screen;
  casebook: boolean; tab: Tab; entry: number;
  /** The item in his hand (E then uses it), and the first of two picked to combine. */
  held: string | null; pick: string | null;
  /** The dials he is working: which spot, and how they are turned. */
  dials: { spot: string; faces: string[] } | null;
  /** The deduction's answers, one per question ('' unanswered). */
  answers: string[];
  /** His last line (a remark, a thought), and when it was said (game clock, s). */
  toast: { text: string; at: number; thought: boolean } | null;
  /** The spot under the eye. */
  target: string | null;
  /** The door under the eye that he can shut behind him or open again (then `target` is null). */
  door: string | null;
  card: Card;
  /** Bhima has seen him. */
  alarm: boolean;
  /** Played by touch (a phone): the on-screen pad shows, and the screens say "tap" not "click". */
  touch: boolean;
  /** The chapters menu is open (every day and night, for playtesting). */
  menu: boolean;
  /** The walking thumbstick while a thumb is on it: its centre and the knob's offset, design px. */
  stick: { x: number; y: number; dx: number; dy: number } | null;
};
export const initialUi: UiState = {
  screen: 'title', casebook: false, tab: 'evidence', entry: 0, held: null, pick: null, dials: null, answers: [],
  toast: null, target: null, door: null, card: null, alarm: false, touch: false, menu: false, stick: null,
};

function disk<T>(fn: (ls: Storage) => T): T | null {
  if (import.meta.env.STORYBOOK) return null; // stories never read or write saves
  try { return fn(localStorage); } catch { return null; } // private mode
}

// persist calls setItem on every set; only write when the save point changed.
let written: GameState | null = null;
const storage: PersistStorage<{ save: unknown }> = {
  getItem: () => ({ state: { save: disk((ls) => JSON.parse(ls.getItem(META_KEY) ?? 'null')) }, version: 0 }),
  setItem: (_, { state }) => { if (state.save === written) return; written = state.save as GameState; disk((ls) => ls.setItem(META_KEY, JSON.stringify(state.save))); },
  removeItem: () => { disk((ls) => ls.removeItem(META_KEY)); },
};

export const game = createStore<GameStore>()(persist((): GameStore => ({ run: newGame(), save: null }), {
  name: META_KEY,
  storage,
  partialize: (g) => ({ save: g.save }),
  merge: (saved, cur) => ({ ...cur, save: parseSave((saved as { save: unknown } | undefined)?.save) }),
}));
// persist doesn't write after hydrating; an identity set saves once, replacing a corrupt save with nothing.
game.setState((s) => s);

export const ui = createStore<UiState>()(() => initialUi);
