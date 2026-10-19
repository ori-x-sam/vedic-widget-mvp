// Every number a rule reads. Units are in the name: tiles (TILES, one tile is 64 logical px of a lane), seconds (S),
// tiles per second (TPS). Content (gods, Kshetras, yugas, banners) lives in content/*.kdl; look numbers live in
// screens/shared.css.

export const T = {
  // ---------- the board ----------
  /** Lanes on the battlefield, stacked like the registers of a painted scroll. */
  LANES: 3,
  /** A lane's length; you start at tile 0 (left), the opponent at LANE_TILES (right). */
  LANE_TILES: 20,
  /** The midline: your deploy zone ends half a tile short of it. */
  MIDLINE_TILE: 10,
  /** Your deploy zone in a lane, tiles from your end (a lowered Dhvaja extends it, see content/match.kdl). */
  DEPLOY_FROM_TILE: 1,
  DEPLOY_TO_TILE: 9.5,
  /** Reach of a melee strike: about one body's width. */
  MELEE_REACH_TILES: 0.8,
  /** A unit engages the nearest enemy this far ahead; otherwise it walks on to the banner. */
  SIGHT_TILES: 4.5,
  /** `leap` may land anywhere in the lane but this close to a banner (Hanuman can't land on the plinth). */
  LEAP_BANNER_GAP_TILES: 2,

  // ---------- Prana ----------
  /** Prana in hand at the start; the diya row holds PRANA_MAX. */
  PRANA_START: 6,
  PRANA_MAX: 10,
  /** One Prana flows in this often at x1 (Satya Yuga); each yuga multiplies the flow (content/match.kdl). */
  PRANA_EVERY_S: 2.8,

  // ---------- cards ----------
  /** A unit can't act this long after its column of light lands (avahana). */
  AVAHANA_S: 1,
  /** An Astra hangs as a vision over the lane this long, then acts. */
  ASTRA_VISION_S: 0.6,
  /** Astras deal this fraction of their damage to Dhvajas and the Mahadhvaja, so banners fall to gods, not spells. */
  ASTRA_VS_BANNER: 0.35,

  // ---------- PLACEHOLDER: the starter's collecting game (goes with it) ----------
  FIELD_W_U: 12,
  FIELD_H_U: 7,
  BATCH_SIZE: 5,
} as const;
