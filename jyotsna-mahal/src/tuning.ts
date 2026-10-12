// Every number a rule reads. Units are in the name: world units (U, about a metre), seconds (S), game minutes (MIN),
// degrees (DEG). Content (what exists, what it says, what it costs) lives in content/*.kdl; look numbers live in
// screens/shared.css.

export const T = {
  // ---------- the night's clock ----------
  /** Real seconds from the bolt to the dawn knock. The brief wants a first-timer to take 30-45 minutes over a night,
      so dawn comes at about the middle of that: hurry matters, and dawn is pressure, never failure. */
  NIGHT_S: 2100,
  /** The pocket watch at the bolt and at the dawn knock, minutes after midnight of the evening (25:30 is 1:30 a.m.). */
  NIGHT_START_MIN: 23 * 60 + 30,
  DAWN_MIN: 24 * 60 + 5 * 60 + 30,
  /** The Durbar Wing clock chimes every quarter hour of watch time. */
  CHIME_EVERY_MIN: 15,
  /** After dawn the knock repeats this often (real s) until he is back in bed, and each knock costs this much suspicion. */
  KNOCK_EVERY_S: 40,
  KNOCK_SUSPICION: 1,

  // ---------- Thistlewood ----------
  /** Walking pace: a fussy man of fifty in a hurry. */
  WALK_U_S: 1.9,
  /** His body's radius against walls and furniture. */
  BODY_U: 0.25,
  /** How far beyond a spot's own radius his hand reaches. */
  REACH_U: 1.4,
  /** On a phone: the walking thumbstick's reach (design px; full pace at the rim) and its dead middle (0..1). */
  STICK_R_PX: 52,
  STICK_DEAD: 0.12,
  /** On a phone: degrees the eye turns per design px a thumb drags. */
  TOUCH_DEG_PX: 0.3,

  // ---------- the hidden marks ----------
  /** Where the marks start on the first morning. */
  SUSPICION_START: 3,
  REGARD_START: 0,
  /** Suspicion at which the Raja proposes a midnight shikar: the bad ending. */
  SUSPICION_PEAK: 10,

  // ---------- Bhima ----------
  /** How far his lantern lets him see a man in the dark, and a man carrying a lit candle. */
  SIGHT_U: 5,
  CANDLE_SIGHT_U: 10,
  /** Half the width of his gaze. A candle is seen from any side: it lights the walls. */
  SIGHT_HALF_DEG: 50,
  /** Within this he notices you whichever way he faces (he hears you breathe). */
  NEAR_U: 1.2,
  /** "Who's there?": how long he stands before he comes for you. */
  ALERT_S: 1.1,
  /** Pace when he comes for you: a little slower than yours, so breaking his sight and hiding works. */
  CHASE_U_S: 1.6,
  /** He gives up after this long without sight of you, and walks back along his trail. */
  LOSE_S: 3.5,
  /** This close and he has you. */
  CATCH_U: 0.9,
  /** Being seen at all costs this much suspicion (an excuse decides the rest). */
  SEEN_SUSPICION: 1,

  // ---------- the casebook ----------
  /** A wrong deduction costs watch time: thinking it over again. Guessing is slow on purpose. */
  WRONG_DEDUCTION_MIN: 20,
  /** A wrong code costs watch time too: the dials are stiff and loud. */
  WRONG_CODE_MIN: 2,
} as const;
