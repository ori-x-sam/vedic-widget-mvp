// The end of F8: a new shore where a child floats a tiny paper boita with a
// lamp, the palette fading back to Record 01's Chilika; the final card, the
// Progress Report, and Endless Kalinga unlocked.
import Phaser from 'phaser';
import { bakedArt } from '../art/bake';
import { RecordStage } from '../art/stage';
import { DEPTH } from '../art/layers';
import { audio } from '../audio';
import { RECORDS } from '../data/records';
import { P } from '../data/palettes';
import { hexToRgb } from '../lib/colour';
import { input } from '../systems/input';
import { journey, newJourney } from '../systems/journey';
import { save } from '../systems/save';
import { applyLayout } from '../ui/layout';
import { showPage } from '../ui/cards';
import { showReportCard } from '../ui/pages';
import { showRecordHeader } from '../ui/header';
import { goToRun } from './flow';
import { startEndless } from './Run';
import { isReducedMotion } from './util';

export class Finale extends Phaser.Scene {
  private stage!: RecordStage;
  private boat!: Phaser.GameObjects.Image;
  private glow!: Phaser.GameObjects.Image;
  private t = 0;

  constructor() {
    super('Finale');
  }

  create(): void {
    const app = document.getElementById('app')!;
    app.classList.remove('is-title');
    app.classList.add('is-playing');
    applyLayout();
    const art = bakedArt('r01')!;
    this.stage = new RecordStage(this, art);
    this.stage.reducedMotion = isReducedMotion();
    this.boat = this.add.image(640, art.laneY + 18, 'fx:paperBoat').setScale(0.5).setDepth(DEPTH.entities);
    this.glow = this.add.image(652, art.laneY - 6, 'fx:glow').setScale(1.4).setAlpha(0.7).setDepth(DEPTH.entities + 0.1);
    this.cameras.main.fadeIn(1400, ...hexToRgb(P.limewhite));
    showRecordHeader({ ...RECORDS.f8, headline: 'The voyage never ended.' }, true);
    audio.play(RECORDS.r01);
    input.enabled = false;
    save((d) => { d.endless = true; d.finished = true; });
    this.time.delayedCall(2600, () => void this.cards());
  }

  private async cards(): Promise<void> {
    const j = journey();
    await showPage({
      label: 'F8 · ∞ · Speculative · not history',
      title: "Kalinga's ships never stopped sailing.",
      lines: ['They just kept finding new seas.', 'You have unlocked <b>Endless Kalinga</b>.'],
      choices: [{ label: 'Progress Report ▸', value: 'next', primary: true }],
    });
    const v = await showReportCard(
      { cowries: j.cowries, diyasLost: j.diyasLost, time: j.time, caught: j.caught.length, total: 45, assisted: j.assisted },
      { title: 'Final Progress Report', choices: [{ label: 'Endless Kalinga ∞', value: 'endless', primary: true }, { label: 'Read again from page one', value: 'again' }, { label: 'Title', value: 'title' }] },
    );
    input.enabled = true;
    input.clear();
    if (v === 'endless') {
      startEndless();
      void goToRun(this);
    } else if (v === 'again') {
      newJourney('r01');
      void goToRun(this);
    } else this.scene.start('Title');
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05);
    this.t += dt;
    this.stage.update(this.t * 24, this.t);
    const bob = Math.sin(this.t * 1.6) * 3;
    this.boat.setPosition(640 + this.t * 6, this.stage.art.laneY + 14 + bob).setRotation(Math.sin(this.t * 1.3) * 0.05);
    this.glow.setPosition(this.boat.x + 8, this.boat.y - 26).setAlpha(0.6 + Math.sin(this.t * 5) * 0.1);
    audio.tick(this.t);
  }
}
