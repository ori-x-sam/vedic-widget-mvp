// Logical resolution and core tuning constants (brief §5).
export const GAME_W = 1280;
export const GAME_H = 720;

/** Fixed simulation step (120 Hz) so physics are identical in-game and in the bots. */
export const STEP = 1 / 120;

/** Player's fixed screen x (world scrolls past). */
export const PLAYER_X = 300;

export const BASE_SPEED = 280; // px/s
export const SPEED_PER_RECORD = 0.035; // +3.5% per record

/** Hazards must be visible at least this long before they reach the player (§2.1). */
export const MIN_TELEGRAPH_S = 1;

export const LIVES = 3;
export const ASSIST_LIVES = 5;
export const ASSIST_SPEED = 0.75;

export const INVULN_S = 1.4;
