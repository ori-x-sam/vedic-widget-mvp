// Title screen, laid out like the reference: huge cream "Kalinga" over peach
// "Rush", a "Play at …" line, a short gold rule and a two-line teaser. The
// game window behind it idles through Record 01. Below: Play (or Continue
// from your checkpoint), start again from the very beginning, chapters,
// the lesson book, settings — and Endless Kalinga once it is unlocked.
import Phaser from 'phaser';
import { bakedArt } from '../art/bake';
import { RecordStage } from '../art/stage';
import { audio } from '../audio';
import { ACT_ROMAN, outlineById } from '../data/records';
import { applyLayout } from '../ui/layout';
import { dismiss, pill } from '../ui/cards';
import { applyTextScale, showChapters, showLessonBook, showSettings } from '../ui/pages';
import { input } from '../systems/input';
import { makeRunner } from '../systems/physics';
import { load } from '../systems/save';
import { actStart, newJourney, resumeJourney } from '../systems/journey';
import { PlayerView } from './parts/player';
import { goToRun } from './flow';
import { startEndless } from './Run';
import { isReducedMotion, isTouch } from './util';

export class Title extends Phaser.Scene {
  private stage!: RecordStage;
  private player!: PlayerView;
  private t = 0;
  private scroll = 0;
  private off: (() => void) | null = null;
  private hint: HTMLElement | null = null;
  private busy = false;

  constructor() {
    super('Title');
  }

  create(): void {
    const app = document.getElementById('app')!;
    app.classList.add('is-title');
    app.classList.remove('is-playing');
    applyTextScale();
    const art = bakedArt('r01')!;
    this.stage = new RecordStage(this, art);
    this.stage.reducedMotion = isReducedMotion();
    this.player = new PlayerView(this, { ride: 'canoe', mode: 'run', laneY: art.laneY, water: true });
    this.busy = false;
    this.buildMenu();
    audio.play(null, { title: true });

    const coarse = isTouch();
    this.hint = pill(coarse ? 'Tap anywhere to start' : 'Press <span class="gold">Space</span> or click to start', 'bottom', 0, true);
    const hintBelow = document.getElementById('below-hint');
    if (hintBelow) hintBelow.textContent = coarse ? 'One button: tap to jump, hold to jump higher.' : 'One button: Space, ↑, W or click. Hold to jump higher.';

    this.off = input.onPress(() => this.primary());
    this.events.once('shutdown', () => {
      this.off?.();
      dismiss(this.hint);
      document.getElementById('menu')!.innerHTML = '';
      document.querySelector('.title-inf')?.remove();
    });
    applyLayout();
  }

  private hasProgress(): boolean {
    const r = load().run;
    return !!r && (r.checkpoint !== 'r01' || r.caught.length > 0);
  }

  private buildMenu(): void {
    const d = load();
    const menu = document.getElementById('menu')!;
    const cp = d.run ? outlineById(d.run.checkpoint) : undefined;
    const primary = this.hasProgress() && cp
      ? `<button class="btn btn-gold" type="button" data-a="continue">Continue · Lesson ${cp.num} · Act ${ACT_ROMAN[cp.act - 1]}</button>`
      : '<button class="btn btn-gold" type="button" data-a="play">Play</button>';
    const small: string[] = [];
    if (this.hasProgress()) small.push('<button class="btn btn-line btn-small" type="button" data-a="restart">Start from the very beginning</button>');
    if (d.actReached > 1) small.push('<button class="btn btn-line btn-small" type="button" data-a="chapters">Chapters</button>');
    small.push('<button class="btn btn-line btn-small" type="button" data-a="book">Lesson book</button>');
    small.push('<button class="btn btn-line btn-small" type="button" data-a="settings">Settings</button>');
    if (d.endless) small.push('<button class="btn btn-line btn-small" type="button" data-a="endless">Endless Kalinga ∞</button>');
    menu.innerHTML = `${primary}<div class="menu-row">${small.join('')}</div>`;
    menu.querySelectorAll<HTMLButtonElement>('[data-a]').forEach((b) => (b.onclick = () => this.action(b.dataset.a!)));
    document.querySelector('.title-inf')?.remove();
    if (d.seenTwist) {
      const inf = document.createElement('div');
      inf.className = 'title-inf';
      inf.textContent = '∞';
      inf.setAttribute('aria-hidden', 'true');
      document.getElementById('app')!.appendChild(inf);
    }
  }

  private primary(): void {
    if (this.busy || document.getElementById('card-layer')!.classList.contains('open')) return;
    this.action(this.hasProgress() ? 'continue' : 'play');
  }

  private async action(a: string): Promise<void> {
    if (this.busy) return;
    audio.sfx('select');
    switch (a) {
      case 'play':
      case 'restart':
        newJourney('r01');
        return this.go();
      case 'continue':
        resumeJourney();
        return this.go();
      case 'endless':
        startEndless();
        return this.go();
      case 'chapters': {
        this.busy = true;
        const v = await showChapters();
        this.busy = false;
        if (v === 'back') return;
        newJourney(actStart(Number(v)));
        return this.go();
      }
      case 'book':
        this.busy = true;
        await showLessonBook();
        this.busy = false;
        input.clear();
        return;
      case 'settings':
        this.busy = true;
        await showSettings((s) => { audio.setMusic(s.music); audio.setSfx(s.sfx); });
        this.busy = false;
        input.clear();
        this.buildMenu();
        return;
    }
  }

  private go(): void {
    this.busy = true;
    input.clear();
    void goToRun(this);
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05);
    this.t += dt;
    this.scroll += 70 * dt;
    this.stage.update(this.scroll, this.t);
    this.player.update(this.t, dt, makeRunner(this.stage.art.laneY), 0, this.stage.reducedMotion);
    audio.tick(this.t);
  }
}
