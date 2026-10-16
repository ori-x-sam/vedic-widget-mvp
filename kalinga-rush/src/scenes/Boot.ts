// Boot: bake the first record's art (lazily, per record), then go to the
// title — or straight into a run when a debug param asks for one.
import Phaser from 'phaser';
import { bakeRecord } from '../art/bake';
import { DEBUG } from '../systems/debug';

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const bar = document.getElementById('loading-bar');
    const seed = DEBUG.seed ?? 1;
    bakeRecord(this, 'r01', seed, (p) => {
      if (bar) bar.style.width = `${Math.round(p * 100)}%`;
    }).then(() => {
      document.getElementById('app')!.classList.remove('is-loading');
      if (DEBUG.record !== null || DEBUG.qa || DEBUG.reel) this.scene.start('Run', { recordId: 'r01' });
      else this.scene.start('Title');
    });
  }
}
