// Behaviour words for the two hidden marks: what a choice, a touch or an excuse does to the Raja's suspicion and to
// Bhima's regard. Content writes them as props on any beat, choice or line (`suspicion=1 regard=-2`); content.ts turns
// each into one of these. The rules that read the marks (a second bolt, the midnight shikar) live in game.ts and their
// thresholds in tuning.ts. Catalog: ## Behaviour words.

/** The two numbers the player never sees. */
export type Marks = { suspicion: number; regard: number };

/** What one word does to the marks. */
export type Reward = (m: Marks) => Marks;

export const REWARDS: Record<string, (...args: number[]) => Reward> = {
  /** The Raja's suspicion rises (or falls, when negative) by `n`. */
  suspicion: (n) => (m) => ({ ...m, suspicion: m.suspicion + n }),
  /** Bhima's regard rises (or falls) by `n`. */
  regard: (n) => (m) => ({ ...m, regard: m.regard + n }),
};
