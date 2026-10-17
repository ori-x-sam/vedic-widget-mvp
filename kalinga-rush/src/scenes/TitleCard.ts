// Title-card sting for a record: updates the page header (label, date,
// headline) and flashes the game window like a freshly printed page.
import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config';
import { P } from '../data/palettes';
import { hexToNum } from '../lib/colour';
import { outlineById } from '../data/records';
import { showRecordHeader } from '../ui/header';
import { isReducedMotion } from './util';

export class TitleCard extends Phaser.Scene {
  constructor() {
    super('TitleCard');
  }

  create(data: { recordId: string; endless?: number }): void {
    const rec = outlineById(data.recordId);
    if (rec) showRecordHeader(data.endless ? { ...rec, dateLine: `Endless · lap ${data.endless + 1} · ${rec.dateLine}` } : rec, true);
    if (!isReducedMotion()) {
      const flash = this.add.rectangle(0, 0, GAME_W, GAME_H, hexToNum(P.limewhite), 0.22).setOrigin(0, 0);
      this.tweens.add({ targets: flash, alpha: 0, duration: 420, ease: 'Quad.easeOut' });
    }
    this.time.delayedCall(900, () => this.scene.stop());
  }
}
