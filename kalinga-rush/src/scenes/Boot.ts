// Boot: bake Record 01's art (records bake lazily as you reach them), then go
// to the title — or straight to where a debug param asks (§8):
// ?record=14 ?act=7 ?twist=1 ?reel=1 (plus ?qa / ?at / ?auto for the tools).
import Phaser from 'phaser';
import { bakeRecord } from '../art/bake';
import { audio } from '../audio';
import { OUTLINE } from '../data/records';
import { DEBUG } from '../systems/debug';
import { actStart, newJourney } from '../systems/journey';
import { load } from '../systems/save';
import { goToRun, SEED } from './flow';

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const bar = document.getElementById('loading-bar');
    const s = load().settings;
    audio.setMusic(s.music);
    audio.setSfx(s.sfx);
    bakeRecord(this, 'r01', SEED(), (p) => {
      if (bar) bar.style.width = `${Math.round(p * 100)}%`;
    }).then(() => {
      document.getElementById('app')!.classList.remove('is-loading');
      const byNum = DEBUG.record !== null ? OUTLINE.find((o) => o.num === DEBUG.record) : undefined;
      if (DEBUG.twist) {
        this.scene.start('FakeEnding');
      } else if (byNum) {
        newJourney(byNum.id);
        void goToRun(this);
      } else if (DEBUG.act !== null && DEBUG.act >= 1 && DEBUG.act <= 7) {
        newJourney(actStart(DEBUG.act));
        void goToRun(this);
      } else if (DEBUG.qa || DEBUG.reel) {
        newJourney('r01');
        void goToRun(this);
      } else this.scene.start('Title');
    });
  }
}
