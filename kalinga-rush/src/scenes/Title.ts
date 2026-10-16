// Title screen, laid out like the reference: huge cream "Kalinga" over peach
// "Rush", a "Play at …" line, a short gold rule and a two-line teaser. The
// game window behind it idles through Record 01.
import Phaser from 'phaser';
import { bakedArt } from '../art/bake';
import { RecordStage } from '../art/stage';
import { applyLayout } from '../ui/layout';
import { dismiss, pill } from '../ui/cards';
import { input } from '../systems/input';
import { makeRunner } from '../systems/physics';
import { PlayerView } from './parts/player';
import { isReducedMotion } from './util';

export class Title extends Phaser.Scene {
  private stage!: RecordStage;
  private player!: PlayerView;
  private t = 0;
  private scroll = 0;
  private off: (() => void) | null = null;
  private hint: HTMLElement | null = null;

  constructor() {
    super('Title');
  }

  create(): void {
    const app = document.getElementById('app')!;
    app.classList.add('is-title');
    app.classList.remove('is-playing');
    applyLayout();
    const art = bakedArt('r01')!;
    this.stage = new RecordStage(this, art);
    this.stage.reducedMotion = isReducedMotion();
    this.player = new PlayerView(this, art.laneY);
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    this.hint = pill(coarse ? 'Tap anywhere to start' : 'Press <span class="gold">Space</span> or click to start', 'bottom', 0, true);
    const hintBelow = document.getElementById('below-hint');
    if (hintBelow) hintBelow.textContent = coarse ? 'One button: tap to jump, hold to jump higher.' : 'One button: Space, ↑, W or click. Hold to jump higher.';

    const go = () => this.start();
    this.off = input.onPress(go);
    const btn = document.getElementById('btn-play') as HTMLButtonElement;
    btn.onclick = go;
    this.events.once('shutdown', () => {
      this.off?.();
      btn.onclick = null;
      dismiss(this.hint);
    });
  }

  private start(): void {
    input.clear();
    this.scene.start('Run', { recordId: 'r01' });
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05);
    this.t += dt;
    this.scroll += 70 * dt;
    this.stage.update(this.scroll, this.t);
    this.player.update(this.t, dt, makeRunner(this.stage.art.laneY), 0, this.stage.reducedMotion);
  }
}
