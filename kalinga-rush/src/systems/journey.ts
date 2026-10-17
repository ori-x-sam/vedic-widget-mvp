// The journey: one playthrough of the reader, record after record. Lives
// (diyas) carry across records; catching a record sets a checkpoint (every
// record in Acts I–VI, every two records in Act VII, none inside F8). Losing
// every diya sends you back to the checkpoint with the diyas refilled. When an
// act is complete the player may continue, or start again from the very start.
import { ASSIST_LIVES, LIVES } from '../config';
import { OUTLINE, RECORDS, nextRecord, type RecordOutline } from '../data/records';
import { load, save, type RunSave } from './save';

export interface Journey {
  mode: 'story' | 'endless';
  recordId: string;
  lives: number;
  maxLives: number;
  cowries: number;
  diyasLost: number;
  time: number;
  assisted: boolean;
  caught: string[];
  /** Mid-record checkpoint (cyclone shelters): world scroll to resume from. */
  resumeScroll: number;
  /** Endless: lap number and distance. */
  lap: number;
  distance: number;
}

let J: Journey | null = null;

export function journey(): Journey {
  if (!J) J = fromSave() ?? newJourney('r01');
  return J;
}

export function newJourney(startId = 'r01', mode: Journey['mode'] = 'story'): Journey {
  const assist = load().settings.assist;
  const maxLives = assist ? ASSIST_LIVES : LIVES;
  J = { mode, recordId: startId, lives: maxLives, maxLives, cowries: 0, diyasLost: 0, time: 0, assisted: assist, caught: [], resumeScroll: 0, lap: 0, distance: 0 };
  if (mode === 'story') persist(startId);
  return J;
}

function fromSave(): Journey | null {
  const r = load().run;
  if (!r || !RECORDS[r.checkpoint]) return null;
  const assist = load().settings.assist;
  const maxLives = assist ? ASSIST_LIVES : LIVES;
  return { mode: 'story', recordId: r.checkpoint, lives: maxLives, maxLives, cowries: r.cowries, diyasLost: r.diyasLost, time: r.time, assisted: r.assisted || assist, caught: [...r.caught], resumeScroll: 0, lap: 0, distance: 0 };
}

/** Resume the saved journey from its checkpoint (title → Continue). */
export function resumeJourney(): Journey {
  J = fromSave() ?? newJourney('r01');
  return J;
}

function persist(checkpoint: string): void {
  if (!J || J.mode !== 'story') return;
  const run: RunSave = { checkpoint, cowries: J.cowries, diyasLost: J.diyasLost, time: J.time, assisted: J.assisted, caught: [...J.caught] };
  save((d) => {
    d.run = run;
    d.checkpoint = checkpoint;
    const act = RECORDS[checkpoint]?.act ?? 1;
    if (act > d.actReached) d.actReached = act;
  });
}

/** Does catching this record set a checkpoint? (§5) */
export function isCheckpointRecord(o: RecordOutline): boolean {
  if (o.act < 7) return true;
  return o.id === 'f2' || o.id === 'f4' || o.id === 'f6';
}

/** Called when the record is caught. Saves the lesson and moves the checkpoint on. */
export function recordCaught(id: string): void {
  const j = journey();
  if (!j.caught.includes(id)) j.caught.push(id);
  save((d) => {
    d.lessons[id] = { caught: true, at: Date.now() };
    d.bestCowries = Math.max(d.bestCowries, j.cowries);
  });
  const o = OUTLINE.find((r) => r.id === id)!;
  const next = nextRecord(id);
  if (j.mode === 'story' && next && isCheckpointRecord(o)) persist(next.id);
}

/** Advance to the next record after the current one ends. Returns null at the very end. */
export function advance(): RecordOutline | null {
  const j = journey();
  const next = nextRecord(j.recordId) ?? null;
  j.resumeScroll = 0;
  if (next) {
    j.recordId = next.id;
    // Keep a save of the running totals at the existing checkpoint.
    const cp = load().run?.checkpoint ?? next.id;
    persist(cp);
  }
  return next;
}

/** Lost every diya: back to the checkpoint (or the shelter inside this record). */
export function backToCheckpoint(): string {
  const j = journey();
  j.lives = j.maxLives;
  if (j.resumeScroll > 0) return j.recordId;
  const run = load().run;
  const cp = j.mode === 'story' ? run?.checkpoint ?? j.recordId : j.recordId;
  // Cowries picked up since the checkpoint go back with it; time and lost diyas stay honest.
  if (j.mode === 'story' && run) {
    j.cowries = run.cowries;
    j.caught = j.caught.filter((id) => run.caught.includes(id));
  }
  j.recordId = cp;
  return cp;
}

/** First record of an act. */
export function actStart(act: number): string {
  return OUTLINE.find((r) => r.act === act)!.id;
}

export function recordsTotalFor(seenTwist: boolean): number {
  return seenTwist ? 45 : 37;
}
