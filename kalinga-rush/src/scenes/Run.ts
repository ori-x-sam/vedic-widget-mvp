// The run: one record segment. Fixed-step simulation (shared with the bots),
// parallax scenery, Taapoi, hazards, cowries, the palm-leaf record, lessons.
import Phaser from 'phaser';
import { ASSIST_LIVES, GAME_W, GAME_H, LIVES, PLAYER_X, STEP } from '../config';
import { RECORDS, outlineById, type RecordDef } from '../data/records';
import { vehicle } from '../data/vehicles';
import { bakedArt } from '../art/bake';
import { RecordStage } from '../art/stage';
import { DEBUG } from '../systems/debug';
import { input } from '../systems/input';
import { recordSpeed } from '../systems/difficulty';
import { buildLevel } from '../systems/spawner';
import { createSim, stepSim, type Level, type SimOptions, type SimState } from '../systems/sim';
import { solveLevel, type Press } from '../systems/solver';
import type { VehicleProfile } from '../systems/physics';
import { load, save } from '../systems/save';
import { applyLayout } from '../ui/layout';
import { initHud, setCowries, setLives, setRecords } from '../ui/hud';
import { dismiss, floatText, pill, showLesson, showPage } from '../ui/cards';
import { dateHtml } from '../ui/header';
import { PlayerView } from './parts/player';
import { EntityViews } from './parts/entities';
import { Fx } from './parts/fx';
import { isReducedMotion, isTouch } from './util';

export class Run extends Phaser.Scene {
  private rec!: RecordDef;
  private profile!: VehicleProfile;
  private level!: Level;
  private sim!: SimState;
  private simOpts!: SimOptions;
  private stage!: RecordStage;
  private player!: PlayerView;
  private ents!: EntityViews;
  private fx!: Fx;
  private acc = 0;
  private t = 0;
  private paused = false;
  private timeScale = 1;
  private reduced = false;
  private plan: Press[] | null = null;
  private planIdx = 0;
  private holdUntil = -1;
  private introPill: HTMLElement | null = null;
  private firstJumpDone = false;
  private recordsCaught = 0;

  constructor() {
    super('Run');
  }

  create(data: { recordId?: string }): void {
    const app = document.getElementById('app')!;
    app.classList.remove('is-title');
    app.classList.add('is-playing');
    this.reduced = isReducedMotion();
    app.classList.toggle('reduced-motion', this.reduced);

    this.rec = RECORDS[data.recordId ?? 'r01'] ?? RECORDS.r01;
    const art = bakedArt(this.rec.id)!;
    const settings = load().settings;
    const assist = settings.assist || DEBUG.assist;
    this.profile = vehicle(this.rec.ride);
    this.level = buildLevel(this.rec, { seed: DEBUG.seed ?? 1, speed: recordSpeed(this.rec.num, assist), laneY: art.laneY, profile: this.profile });
    this.simOpts = { god: DEBUG.god, lives: assist ? ASSIST_LIVES : LIVES };
    this.sim = createSim(this.level, this.simOpts);
    this.acc = 0;
    this.t = 0;
    this.paused = false;
    this.timeScale = 1;
    this.firstJumpDone = false;
    this.planIdx = 0;
    this.holdUntil = -1;
    this.recordsCaught = Object.values(load().lessons).filter((l) => l.caught).length;

    this.stage = new RecordStage(this, art);
    this.stage.reducedMotion = this.reduced;
    this.player = new PlayerView(this, art.laneY);
    this.ents = new EntityViews(this, this.level);
    this.fx = new Fx(this);

    initHud(this.simOpts.lives);
    setLives(this.sim.lives);
    setCowries(0, false);
    setRecords(this.recordsCaught);
    applyLayout();
    input.clear();
    input.enabled = true;

    // Autopilot replays a frame-perfect plan from the solvability bot (reel / QA).
    this.plan = DEBUG.auto || DEBUG.reel ? solveLevel(buildLevel(this.rec, { seed: DEBUG.seed ?? 1, speed: this.level.speed, laneY: art.laneY, profile: this.profile }), this.profile).presses : null;

    this.scene.launch('TitleCard', { recordId: this.rec.id });

    if (DEBUG.at > 0) {
      const steps = Math.round(DEBUG.at / STEP);
      for (let i = 0; i < steps && !this.sim.ended && !this.sim.dead; i++) this.step();
      this.sim.events.length = 0;
      this.t = this.sim.t;
      setLives(this.sim.lives);
      setCowries(this.sim.cowries, false);
    }
    if (DEBUG.qa) {
      this.stage.freezeGrain();
      this.paused = true;
      this.renderFrame(0);
      // Let the QA tool know the frame is ready.
      this.time.delayedCall(250, () => ((window as unknown as { __KR_READY__: boolean }).__KR_READY__ = true));
    } else if (DEBUG.at === 0) {
      this.introPill = pill(isTouch() ? 'Tap anywhere to <span class="gold">jump</span> · hold to go higher' : 'Press <span class="gold">Space</span> to jump · hold to go higher', 'bottom');
    }

    this.events.once('shutdown', () => {
      dismiss(this.introPill);
      this.scene.stop('TitleCard');
    });
  }

  /** One fixed simulation step with the current input (or autopilot). */
  private step(): void {
    let pressed: boolean;
    let held: boolean;
    if (this.plan) {
      const next = this.plan[this.planIdx];
      pressed = !!next && Math.abs(this.sim.t - next.t) < STEP / 2;
      if (pressed) {
        this.holdUntil = next.t + next.hold;
        this.planIdx++;
      }
      held = this.sim.t < this.holdUntil + 1e-9;
      input.consumePress();
    } else {
      pressed = input.consumePress();
      held = input.held;
    }
    stepSim(this.sim, this.level, this.profile, { pressed, held }, STEP, this.simOpts);
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05);
    if (!this.paused) {
      this.acc += dt * this.timeScale;
      while (this.acc >= STEP) {
        this.step();
        this.acc -= STEP;
        if (this.sim.events.length) this.handleEvents();
        if (this.paused) break;
      }
      this.t = this.sim.t;
    }
    this.renderFrame(dt);
  }

  private renderFrame(dt: number): void {
    const scroll = this.sim.scroll;
    this.stage.update(scroll, this.t);
    this.ents.update(this.sim, this.t, dt);
    this.player.update(this.t, dt, this.sim.runner, this.sim.invuln, this.reduced);
    this.fx.update(dt);
  }

  private handleEvents(): void {
    const evs = this.sim.events.splice(0);
    const laneY = this.level.laneY;
    for (const ev of evs) {
      switch (ev.type) {
        case 'jump':
          this.fx.splash(PLAYER_X - 20, laneY + 2, 6, 0.6);
          if (!this.firstJumpDone) {
            this.firstJumpDone = true;
            dismiss(this.introPill, 1800);
            this.introPill = null;
          }
          break;
        case 'land':
          this.fx.splash(PLAYER_X, laneY + 2, 10, 0.9);
          break;
        case 'hit':
          this.ents.hit(ev.e);
          this.player.hitT = 0.5;
          this.fx.puff(PLAYER_X, this.sim.runner.y - 60);
          this.fx.splash(PLAYER_X + 30, laneY, 8, 0.8);
          setLives(this.sim.lives);
          if (!this.reduced) this.cameras.main.shake(180, 0.006);
          break;
        case 'cowrie':
          this.fx.sparkle(ev.e.x - this.sim.scroll, ev.e.y);
          setCowries(this.sim.cowries);
          break;
        case 'dolphinLeap':
          this.fx.splash(ev.e.dolphin!.fromX - this.sim.scroll, laneY + 6, 12, 1);
          break;
        case 'dolphinBonus':
          this.fx.sparkle(PLAYER_X, this.sim.runner.y - 80, 5);
          setCowries(this.sim.cowries);
          floatText(`+${ev.amount} · Dolphin arc!`, PLAYER_X / GAME_W, (this.sim.runner.y - 150) / GAME_H);
          break;
        case 'record':
          this.onRecord();
          break;
        case 'recordMissed':
          pill('The palm leaf drifted past…', 'mid', 2200);
          break;
        case 'dead':
          this.onDead();
          break;
        case 'end':
          this.onEnd();
          break;
        default:
          break;
      }
    }
  }

  private onRecord(): void {
    const rec = this.rec;
    const v = this.ents.takeRecordView(this.level.recordEntity!);
    this.fx.sparkle(PLAYER_X + 40, this.sim.runner.y - 140, 7);
    save((d) => {
      d.lessons[rec.id] = { caught: true, at: Date.now() };
      d.checkpoint = rec.id;
      d.bestCowries = Math.max(d.bestCowries, this.sim.cowries);
    });
    this.recordsCaught = Object.values(load().lessons).filter((l) => l.caught).length;
    // Slow-mo while the leaf flies up to the HUD, then stamp the lesson.
    this.timeScale = 0.25;
    if (v) {
      this.tweens.add({ targets: [v.main, v.glow].filter(Boolean), x: GAME_W - 90, y: 40, scale: 0.2, alpha: 0.2, duration: 700, ease: 'Cubic.easeIn', onComplete: () => { v.main.destroy(); v.glow?.destroy(); } });
    }
    this.time.delayedCall(720, () => {
      setRecords(this.recordsCaught);
      this.paused = true;
      input.enabled = false;
      showLesson(rec, true).then(() => {
        this.timeScale = 1;
        this.paused = false;
        input.clear();
        input.enabled = true;
      });
    });
  }

  private onDead(): void {
    this.paused = true;
    input.enabled = false;
    const o = outlineById(this.rec.id)!;
    pill(`The diyas went out · back to ${dateHtml(o.dateLine)}`, 'mid', 1500);
    this.time.delayedCall(1700, () => {
      input.enabled = true;
      this.scene.restart({ recordId: this.rec.id });
    });
  }

  private onEnd(): void {
    this.paused = true;
    input.enabled = false;
    const lost = this.sim.maxLives - this.sim.lives;
    const next = outlineById('r02')!;
    const stats = `Cowries <b>${this.sim.cowries}</b> · Diyas lost <b>${lost}</b>${DEBUG.god ? ' · god mode' : ''}`;
    const page = this.sim.recordCaught
      ? showPage({
        label: 'Ama Kalinga · to be continued',
        title: 'Lesson 1 is in your reader.',
        lines: [stats, `Next lesson: <b>${dateHtml(next.dateLine)}</b> — ${next.headline}`, 'This vertical slice ends here for now.'],
        choices: [{ label: 'Play again', value: 'again', primary: true }, { label: 'Title', value: 'title' }],
      })
      : showPage({
        label: 'Lesson 1 · not yet stamped',
        title: 'The palm leaf floated away.',
        lines: [stats, 'Catch the palm-leaf record to stamp Lesson 1 into your reader.'],
        choices: [{ label: 'Try again', value: 'again', primary: true }, { label: 'Title', value: 'title' }],
      });
    page.then((v) => {
      input.enabled = true;
      input.clear();
      if (v === 'again') this.scene.restart({ recordId: this.rec.id });
      else this.scene.start('Title');
    });
  }
}
