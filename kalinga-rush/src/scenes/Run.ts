// The run: one record of the journey at a time. Fixed-step simulation
// (shared with the bots), parallax scenery, Taapoi on the era's ride,
// hazards, cowries, the record, mechanic overlays, lessons, checkpoints and
// the act pages. Lives and cowries carry across records (systems/journey).
import Phaser from 'phaser';
import { GAME_W, GAME_H, PLAYER_X, STEP } from '../config';
import { OUTLINE, RECORDS, nextRecord, outlineById, type RecordDef } from '../data/records';
import { FRAME, P } from '../data/palettes';
import { hexToRgb } from '../lib/colour';
import { vehicle } from '../data/vehicles';
import { bakedArt } from '../art/bake';
import { RecordStage } from '../art/stage';
import { audio } from '../audio';
import { DEBUG } from '../systems/debug';
import { input } from '../systems/input';
import { recordSpeed } from '../systems/difficulty';
import { buildLevel } from '../systems/spawner';
import { createSim, stepSim, type Level, type SimOptions, type SimState } from '../systems/sim';
import { planInput, solveLevel } from '../systems/solver';
import type { VehicleProfile } from '../systems/physics';
import { actStart, advance, backToCheckpoint, journey, newJourney, recordCaught, type Journey } from '../systems/journey';
import { load, save } from '../systems/save';
import { applyLayout } from '../ui/layout';
import { initHud, setCowries, setLives, setRecords } from '../ui/hud';
import { dismiss, floatText, pill, showLesson } from '../ui/cards';
import { showActComplete, showGameOver, showLessonBook, showPause, showReportCard, showSettings, applyTextScale, type RunStats } from '../ui/pages';
import { PlayerView } from './parts/player';
import { EntityViews } from './parts/entities';
import { Fx } from './parts/fx';
import { Weather } from './parts/weather';
import { goToRun, prebakeNext, SEED } from './flow';
import { isReducedMotion, isTouch } from './util';

/** Reel mode: seconds of each record shown before cutting to the next. */
const REEL_S = 6;
/** Endless Kalinga: lap length. */
const ENDLESS_S = 30;

let sessionTaught = false;
const EDGE = hexToRgb(FRAME.frameEdge);
const PAPER = hexToRgb(P.limewhite);

export class Run extends Phaser.Scene {
  private j!: Journey;
  private rec!: RecordDef;
  private profile!: VehicleProfile;
  private level!: Level;
  private sim!: SimState;
  private simOpts!: SimOptions;
  private stage!: RecordStage;
  private player!: PlayerView;
  private ents!: EntityViews;
  private fx!: Fx;
  private weather!: Weather;
  private acc = 0;
  private t = 0;
  private paused = false;
  private busy = false;
  private timeScale = 1;
  private reduced = false;
  private plan: Uint8Array | null = null;
  private planK = 0;
  private introPill: HTMLElement | null = null;
  private firstJumpDone = false;
  private startT = 0;
  private reel = false;
  private endless = false;
  private offs: (() => void)[] = [];

  constructor() {
    super('Run');
  }

  create(): void {
    const app = document.getElementById('app')!;
    app.classList.remove('is-title');
    app.classList.add('is-playing');
    this.reduced = isReducedMotion();
    app.classList.toggle('reduced-motion', this.reduced);
    applyTextScale();

    this.j = journey();
    this.endless = this.j.mode === 'endless';
    this.reel = DEBUG.reel;
    this.rec = RECORDS[this.j.recordId] ?? RECORDS.r01;
    const rec = this.rec;
    const art = bakedArt(rec.id)!;
    const assist = this.j.assisted || DEBUG.assist;
    this.profile = vehicle(rec.ride);
    const speed = this.endless ? endlessSpeed(this.j.lap, rec.num) : recordSpeed(rec.num, assist);
    const levelOpts = {
      seed: this.endless ? SEED() * 1000 + this.j.lap : SEED(), speed, laneY: art.laneY, profile: this.profile, assist,
      seconds: this.endless ? ENDLESS_S : undefined,
      difficulty: this.endless ? endlessWindow(this.j.lap) : undefined,
    };
    this.level = buildLevel(rec, levelOpts);
    let start = this.j.resumeScroll;
    if (this.reel) start = Math.max(0, this.level.seconds * 0.42 - REEL_S / 2) * speed;
    if (DEBUG.at > 0) start = 0;
    this.simOpts = { god: DEBUG.god || this.reel, lives: this.j.lives, startScroll: start };
    this.sim = createSim(this.level, this.simOpts);
    this.sim.maxLives = this.j.maxLives;
    this.sim.cowries = this.j.cowries;
    this.startT = this.sim.t;
    this.acc = 0;
    this.t = this.sim.t;
    this.paused = false;
    this.busy = false;
    this.timeScale = 1;
    this.firstJumpDone = false;

    const length = this.level.endX - PLAYER_X;
    this.stage = new RecordStage(this, art, length);
    this.stage.reducedMotion = this.reduced;
    this.weather = new Weather(this, this.level, { rain: !!rec.mech.rain, night: false, reduced: this.reduced });
    this.player = new PlayerView(this, { ride: rec.ride, mode: this.level.mode, laneY: art.laneY, water: rec.terrain === 'water' || rec.terrain === 'sea' });
    this.ents = new EntityViews(this, this.level);
    this.fx = new Fx(this);

    initHud(this.j.maxLives);
    setLives(this.sim.lives);
    setCowries(this.sim.cowries, false);
    setRecords(this.j.caught.length, this.recordsTotal());
    applyLayout();
    input.clear();
    input.enabled = true;

    // Autopilot replays the solvability bot's frame-perfect plan (reel / QA).
    if (DEBUG.auto || this.reel) {
      const probe = buildLevel(rec, levelOpts);
      const res = solveLevel(probe, this.profile, { startScroll: start });
      this.plan = res.ok ? res.plan : null;
      this.planK = 0;
    } else this.plan = null;

    // Music and the title-card sting.
    const prevAct = OUTLINE.find((o) => o.num === rec.num - 1)?.act;
    if (!this.reel || this.j.resumeScroll === 0) this.scene.launch('TitleCard', { recordId: rec.id, endless: this.endless ? this.j.lap : 0 });
    audio.play(rec, { beats: this.level.beats });
    if (prevAct !== rec.act && start === 0) audio.conch(1.6);

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
      this.time.delayedCall(250, () => ((window as unknown as { __KR_READY__: boolean }).__KR_READY__ = true));
    } else if (!this.reel && start === 0) {
      if (!sessionTaught) {
        sessionTaught = true;
        const fly = this.level.mode === 'flight', flip = this.level.mode === 'gravity';
        const what = fly ? 'hold to <span class="gold">climb</span>, let go to glide' : flip ? 'tap to <span class="gold">flip gravity</span>' : 'to <span class="gold">jump</span> · hold to go higher';
        this.introPill = pill(isTouch() ? `Tap ${fly ? '&amp; hold' : 'anywhere'} ${what}` : `Press <span class="gold">Space</span> ${what}`, 'top');
      } else if (rec.teach) {
        this.introPill = pill(rec.teach, 'top');
        this.time.delayedCall(4500, () => { dismiss(this.introPill); this.introPill = null; });
      }
    }

    // Pause: button, Esc or P.
    const btn = document.getElementById('btn-pause') as HTMLButtonElement | null;
    if (btn) btn.onclick = () => this.pause();
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') this.pause();
    };
    window.addEventListener('keydown', onKey);
    const onHide = () => { if (document.hidden) this.pause(); };
    document.addEventListener('visibilitychange', onHide);
    this.offs = [() => window.removeEventListener('keydown', onKey), () => document.removeEventListener('visibilitychange', onHide)];

    this.events.once('shutdown', () => {
      dismiss(this.introPill);
      this.scene.stop('TitleCard');
      this.offs.forEach((f) => f());
      if (btn) btn.onclick = null;
    });
  }

  private recordsTotal(): number {
    return load().seenTwist || this.rec.act === 7 ? 45 : 37;
  }

  /** One fixed simulation step with the current input (or autopilot). */
  private step(): void {
    let pressed: boolean;
    let held: boolean;
    if (this.plan) {
      ({ pressed, held } = planInput(this.plan, this.planK++));
      input.consumePress();
    } else {
      pressed = input.consumePress();
      held = input.held;
    }
    stepSim(this.sim, this.level, this.profile, { pressed, held }, STEP, this.simOpts);
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05);
    if (!this.paused && !this.busy) {
      this.acc += dt * this.timeScale;
      while (this.acc >= STEP) {
        this.step();
        this.acc -= STEP;
        if (this.sim.events.length) this.handleEvents();
        if (this.paused || this.busy) break;
      }
      this.t = this.sim.t;
      if (this.reel && this.t - this.startT > REEL_S && !this.busy) this.reelNext();
    }
    if (!this.paused) audio.tick(this.sim.t, this.busy ? 0 : this.timeScale);
    this.renderFrame(dt);
  }

  private renderFrame(dt: number): void {
    const scroll = this.sim.scroll;
    this.stage.update(scroll, this.t);
    if (this.rec.mech.flood) {
      const p = (scroll + PLAYER_X) / this.level.endX;
      this.stage.setFlood((p - 0.3) / 0.35);
    }
    this.weather.update(scroll, this.t, PLAYER_X + this.sim.dx, this.sim.runner.y, this.reduced);
    this.ents.dark = this.weather.darkness;
    this.ents.update(this.sim, this.t, dt);
    this.player.update(this.t, dt, this.sim.runner, this.sim.invuln, this.reduced, this.sim.dx);
    this.fx.update(dt);
  }

  private pause(): void {
    if (this.paused || this.busy || DEBUG.qa || this.reel) return;
    this.paused = true;
    input.enabled = false;
    const loop = async (): Promise<void> => {
      const v = await showPause();
      if (v === 'book') { await showLessonBook(); return loop(); }
      if (v === 'settings') {
        await showSettings((s) => { audio.setMusic(s.music); audio.setSfx(s.sfx); });
        return loop();
      }
      if (v === 'checkpoint') {
        this.j.lives = this.j.maxLives;
        backToCheckpoint();
        this.j.time += this.sim.t - this.startT;
        return void goToRun(this);
      }
      if (v === 'title') {
        this.j.time += this.sim.t - this.startT;
        this.scene.start('Title');
        return;
      }
      input.clear();
      input.enabled = true;
      this.paused = false;
    };
    void loop();
  }

  private handleEvents(): void {
    const evs = this.sim.events.splice(0);
    const laneY = this.level.laneY;
    const water = this.rec.terrain === 'water' || this.rec.terrain === 'sea';
    for (const ev of evs) {
      switch (ev.type) {
        case 'jump':
          audio.sfx('jump');
          if (water) this.fx.splash(PLAYER_X - 20, laneY + 2, 6, 0.6);
          else this.fx.dust(PLAYER_X - 10, this.sim.runner.y + 2, 4);
          this.firstPress();
          break;
        case 'flip':
          audio.sfx('flip');
          this.fx.sparkle(PLAYER_X, this.sim.runner.y, 3);
          this.firstPress();
          break;
        case 'land':
          if (water) { this.fx.splash(PLAYER_X, laneY + 2, 10, 0.9); audio.sfx('splash'); }
          else { this.fx.dust(PLAYER_X, this.sim.runner.y + 2, 7); audio.sfx('land'); }
          break;
        case 'hit':
          audio.sfx('hit');
          this.ents.hit(ev.e);
          this.player.hitT = 0.5;
          this.fx.puff(PLAYER_X, this.sim.runner.y - 60);
          if (water) this.fx.splash(PLAYER_X + 30, laneY, 8, 0.8);
          if (!this.simOpts.god) this.j.diyasLost++;
          this.j.lives = this.sim.lives;
          setLives(this.sim.lives);
          if (!this.reduced) this.cameras.main.shake(180, 0.006);
          break;
        case 'cowrie':
          audio.sfx('cowrie');
          this.fx.sparkle(ev.e.x - this.sim.scroll, ev.e.y);
          setCowries(this.sim.cowries);
          break;
        case 'dolphinLeap':
          this.fx.splash(ev.e.dolphin!.fromX - this.sim.scroll, laneY + 6, 12, 1);
          audio.sfx('dolphin');
          break;
        case 'dolphinBonus':
          this.fx.sparkle(PLAYER_X, this.sim.runner.y - 80, 5);
          setCowries(this.sim.cowries);
          floatText(`+${ev.amount} · Dolphin arc!`, PLAYER_X / GAME_W, (this.sim.runner.y - 150) / GAME_H);
          break;
        case 'friendBonus':
          audio.sfx('cheer');
          this.ents.cheer(ev.e);
          setCowries(this.sim.cowries);
          floatText(ev.e.vis === 'turtle' ? `+${ev.amount} · Safe passage!` : `+${ev.amount} · Hari bol!`, PLAYER_X / GAME_W, (this.sim.runner.y - 150) / GAME_H);
          break;
        case 'checkpoint':
          audio.sfx('checkpoint');
          this.j.resumeScroll = ev.x - PLAYER_X;
          this.j.lives = this.sim.lives;
          pill('Shelter reached · <span class="gold">checkpoint</span>', 'mid', 1600);
          break;
        case 'gust':
          audio.sfx('gust');
          break;
        case 'record':
          this.onRecord();
          break;
        case 'recordMissed':
          pill(this.rec.recordVis === 'drum' ? 'The drum rolled past…' : this.rec.recordVis === 'oar' ? 'The oar drifted past…' : 'The palm leaf drifted past…', 'mid', 2200);
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

  private firstPress(): void {
    if (this.firstJumpDone) return;
    this.firstJumpDone = true;
    if (this.introPill) {
      dismiss(this.introPill, 1800);
      this.introPill = null;
    }
  }

  private onRecord(): void {
    const rec = this.rec;
    const v = this.ents.takeRecordView(this.level.recordEntity!);
    this.fx.sparkle(PLAYER_X + 40, this.sim.runner.y - 140, 7);
    audio.sfx('record');
    this.j.cowries = this.sim.cowries;
    this.j.lives = this.sim.lives;
    if (v) {
      this.tweens.add({ targets: [v.main, v.glow].filter(Boolean), x: GAME_W - 90, y: 40, scale: 0.2, alpha: 0.2, duration: 700, ease: 'Cubic.easeIn', onComplete: () => { v.main.destroy(); v.glow?.destroy(); } });
    }
    if (this.endless) {
      this.sim.cowries += 10;
      setCowries(this.sim.cowries);
      floatText('+10 · Record!', PLAYER_X / GAME_W, (this.sim.runner.y - 150) / GAME_H);
      return;
    }
    if (this.reel) return;
    recordCaught(rec.id);
    setRecords(this.j.caught.length, this.recordsTotal());
    if (DEBUG.auto) return;
    // Slow-mo while the record flies up to the HUD, then stamp the lesson.
    this.timeScale = 0.25;
    this.time.delayedCall(720, () => {
      this.paused = true;
      input.enabled = false;
      prebakeNext(this, rec.id);
      showLesson(rec, true).then(() => {
        this.timeScale = 1;
        this.paused = false;
        input.clear();
        input.enabled = true;
      });
    });
  }

  private onDead(): void {
    this.busy = true;
    input.enabled = false;
    audio.sfx('dead');
    this.j.time += this.sim.t - this.startT;
    if (this.endless) {
      this.time.delayedCall(900, () => this.endlessOver());
      return;
    }
    const shelter = this.j.resumeScroll > 0;
    const cpId = shelter ? this.rec.id : load().run?.checkpoint ?? this.rec.id;
    const cp = outlineById(cpId)!;
    this.time.delayedCall(900, () => {
      showGameOver(cp, shelter).then((v) => {
        input.enabled = true;
        input.clear();
        if (v === 'title') {
          backToCheckpoint();
          this.scene.start('Title');
          return;
        }
        if (v === 'restart') {
          newJourney('r01');
        } else if (v === 'act') {
          const id = actStart(cp.act);
          const keep = this.j;
          newJourney(id);
          journey().time = keep.time;
          journey().diyasLost = keep.diyasLost;
        } else {
          backToCheckpoint();
        }
        void goToRun(this);
      });
    });
  }

  private stats(): RunStats {
    return { cowries: this.j.cowries, diyasLost: this.j.diyasLost, time: this.j.time, caught: this.j.caught.length, total: this.recordsTotal(), assisted: this.j.assisted };
  }

  private onEnd(): void {
    this.busy = true;
    input.enabled = false;
    this.j.cowries = this.sim.cowries;
    this.j.lives = this.sim.lives;
    this.j.time += this.sim.t - this.startT;
    if (this.endless) {
      this.j.lap++;
      this.j.distance += this.level.endX - PLAYER_X;
      this.j.recordId = pickEndless(this.j.lap);
      this.j.resumeScroll = 0;
      void goToRun(this);
      return;
    }
    const rec = this.rec;
    if (rec.id === 'r37') {
      this.cameras.main.fadeOut(600, ...EDGE);
      this.time.delayedCall(650, () => this.scene.start('FakeEnding'));
      return;
    }
    if (rec.id === 'f8') {
      this.cameras.main.fadeOut(900, ...PAPER);
      this.time.delayedCall(950, () => this.scene.start('Finale'));
      return;
    }
    const next = advance();
    if (!next) return;
    const go = () => {
      this.cameras.main.fadeOut(260, ...EDGE);
      this.time.delayedCall(280, () => void goToRun(this));
    };
    if (next.act !== rec.act) {
      audio.conch(1.8);
      prebakeNext(this, rec.id);
      const page = async (): Promise<void> => {
        const v = await showActComplete(rec.act, next, this.stats());
        if (v === 'book') { await showLessonBook(); return page(); }
        input.enabled = true;
        input.clear();
        if (v === 'restart') newJourney('r01');
        go();
      };
      void page();
      return;
    }
    input.enabled = true;
    go();
  }

  private reelNext(): void {
    this.busy = true;
    const next = nextRecord(this.rec.id);
    this.j.recordId = next ? next.id : 'r01';
    this.j.resumeScroll = 0;
    this.cameras.main.fadeOut(200, ...EDGE);
    this.time.delayedCall(220, () => void goToRun(this));
  }

  private endlessOver(): void {
    const dist = Math.round((this.j.distance + this.sim.scroll) / 100);
    const best = Math.max(load().bestEndless, dist);
    save((d) => { d.bestEndless = best; });
    showReportCard(
      { cowries: this.sim.cowries, diyasLost: this.j.diyasLost, time: this.j.time, caught: this.j.lap, total: this.j.lap, assisted: this.j.assisted },
      {
        title: 'Endless Kalinga',
        note: `Distance sailed: <b>${dist} kos</b> · Best: <b>${best} kos</b> · Laps: <b>${this.j.lap}</b>`,
        choices: [{ label: 'Sail again', value: 'again', primary: true }, { label: 'Title', value: 'title' }],
      },
    ).then((v) => {
      input.enabled = true;
      input.clear();
      if (v === 'again') {
        startEndless();
        void goToRun(this);
      } else this.scene.start('Title');
    });
  }
}

// ---- Endless Kalinga ------------------------------------------------------------------
const ENDLESS_POOL = OUTLINE.filter((o) => !RECORDS[o.id].mech.noHazards && !RECORDS[o.id].somber && o.id !== 'f8').map((o) => o.id);

function pickEndless(lap: number): string {
  // Deterministic but varied: walk the whole reader in a shuffled order.
  const i = (lap * 17 + 5) % ENDLESS_POOL.length;
  return ENDLESS_POOL[i];
}

export function startEndless(): Journey {
  const j = newJourney(pickEndless(0), 'endless');
  return j;
}

function endlessSpeed(lap: number, num: number): number {
  const base = recordSpeed(Math.min(37, Math.max(20, num)));
  return base * Math.min(1.45, 1 + lap * 0.035);
}

function endlessWindow(lap: number): [number, number] {
  const lo = Math.min(8, 4 + Math.floor(lap / 2));
  return [lo, Math.min(10, lo + 3)];
}
