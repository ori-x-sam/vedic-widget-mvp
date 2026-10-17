// Moving between records: bake the next record's art (lazily, releasing old
// ones so phones keep their memory), then (re)start the Run scene.
import Phaser from 'phaser';
import { bakeRecord, isBaked, keepOnly } from '../art/bake';
import { nextRecord } from '../data/records';
import { DEBUG } from '../systems/debug';
import { journey } from '../systems/journey';
import { dismiss, pill } from '../ui/cards';

export const SEED = () => DEBUG.seed ?? 1;

/** Bake a record if needed, showing a small "turning the page" pill if it takes a moment. */
export async function ensureBaked(scene: Phaser.Scene, id: string): Promise<void> {
  if (isBaked(id)) return;
  const note = pill('Turning the page…', 'mid', 0);
  try {
    await bakeRecord(scene, id, SEED());
  } finally {
    dismiss(note);
  }
}

/** Start (or restart) the run at the journey's current record. */
export async function goToRun(scene: Phaser.Scene): Promise<void> {
  const id = journey().recordId;
  await ensureBaked(scene, id);
  const nxt = nextRecord(id)?.id;
  keepOnly(scene, [id, ...(nxt ? [nxt] : []), 'r01']);
  scene.scene.start('Run');
}

/** Pre-bake the record after `id` while the player reads a lesson. */
export function prebakeNext(scene: Phaser.Scene, id: string): void {
  const nxt = nextRecord(id)?.id;
  if (nxt && !isBaked(nxt)) void bakeRecord(scene, nxt, SEED());
}
