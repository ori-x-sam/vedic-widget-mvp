// Everything whose lifetime is the game's starts here and is torn down by the disposer boot() returns: the fonts and
// models, the two canvases, the clock, input, the store subscriptions that draw the screens and the scene, the
// events that become sound and light, and resize handling.
import { UPDATE_PRIORITY } from 'pixi.js';
import * as Actions from './actions';
import * as Audio from './audio';
import { now, onTick, startClock } from './clock';
import { get, nightOf } from './content';
import * as Game from './game';
import type { GameState } from './game';
import * as Input from './input';
import { fit, initPixi, pixi } from './stage';
import { game, ui } from './store';
import { loadModels } from './view/models';
import { createScene, type Scene } from './view/scene';
import { tickScreens } from './screens/shared';
// Screens stack in import order (each screenUi attaches to layers.ui as its module loads): later draws on top.
import { drawHud } from './screens/hud';
import { drawPad } from './screens/pad';
import { drawTalk } from './screens/talk';
import { drawCasebook } from './screens/casebook';
import { drawDials } from './screens/dials';
import { drawCard } from './screens/card';
import { drawTitle } from './screens/title';

export let scene: Scene | null = null;

/** Draw every screen from the stores (each skips the render when its tree is unchanged). */
export function drawScreens() {
  drawHud();
  drawPad();
  drawTalk();
  drawCasebook();
  drawDials();
  drawCard();
  drawTitle();
}

/** One synchronous frame of both canvases: what a settled story shows and hit-tests against. */
export function renderNow() {
  scene?.render();
  pixi.renderer.render(pixi.stage);
}

/** Footsteps: one every this many metres walked. */
const STRIDE_U = 0.75;
/** Bhima's footsteps fade to nothing at this distance. */
const HEAR_U = 12;

async function fonts() {
  try {
    await Promise.race([
      Promise.all(['16px "IM Fell English"', '16px "IM Fell English SC"', '16px "Noto Sans Oriya"'].map((f) => document.fonts.load(f))),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* offline: the serif fallbacks will do */ }
}

/** Sound and light for what just happened. */
function play(s: GameState, sc: Scene) {
  for (const e of s.events) {
    if (e.type === 'sound') Audio.play(e.id);
    if (e.type === 'line' && e.sound) Audio.play(e.sound);
    if (e.type === 'photo') { sc.flash(); Audio.play('shutter'); }
    if (e.type === 'chime') for (let i = 0; i < Math.min(12, e.strikes); i++) setTimeout(() => Audio.play('chime', 0.6), i * 1400);
    if (e.type === 'knock') Audio.play('knock');
    if (e.type === 'clue') Audio.play('page');
    if (e.type === 'item' && e.gained) Audio.play('pick-up');
    if (e.type === 'night-start' || e.type === 'returned') { const nt = nightOf(s.night!.n); Input.face(nt.turn); }
  }
  Audio.nightBed(s.phase === 'night');
}

export async function boot(el: HTMLElement): Promise<() => void> {
  await Promise.all([fonts(), loadModels()]);
  const w = el.clientWidth || innerWidth, h = el.clientHeight || innerHeight;
  const sc = (scene = createScene(el, w, h, Input.look));
  await initPixi(el, w, h);

  let stepped = 0;
  const bhimaStepped = new Map<string, number>();
  const offTick = onTick((dt) => {
    const walked = Input.step(dt);
    if (ui.getState().screen === 'play' && !ui.getState().card && !ui.getState().casebook && !ui.getState().dials) Actions.tick(dt);
    // Footsteps: his, and Bhima's, louder as he comes closer.
    stepped += walked;
    if (stepped > STRIDE_U) { stepped = 0; Audio.play('footstep'); }
    const r = game.getState().run;
    if (r.night) for (const w of r.night.watch) {
      const prev = bhimaStepped.get(w.id + ':pos') ?? 0, moved = Math.hypot(w.x, w.z) - prev;
      const acc = (bhimaStepped.get(w.id) ?? 0) + Math.abs(moved);
      bhimaStepped.set(w.id + ':pos', Math.hypot(w.x, w.z));
      if (acc > STRIDE_U) { bhimaStepped.set(w.id, 0); Audio.play('bhima-step', Math.max(0, 1 - Math.hypot(w.x - r.night.x, w.z - r.night.z) / HEAR_U)); }
      else bhimaStepped.set(w.id, acc);
    }
    // The toast and the noted line fade on their own (CSS); the target is whatever is under the eye.
    const target = r.phase === 'night' && !r.talk ? sc.pick() : null;
    if (target !== ui.getState().target) Actions.aim(target);
    sc.mark(target && Game.reachable(r, target) ? target : null);
    // Both always tick: the screens' tweens must run while the 3D is moving too.
    const moving = sc.tick(dt);
    return tickScreens(dt) || moving;
  });
  const stopClock = startClock(pixi.ticker, renderNow);
  const render3d = () => sc.render();
  pixi.ticker.add(render3d, undefined, UPDATE_PRIORITY.LOW);
  let lastEvents: unknown = null;
  const sync = () => {
    const { run } = game.getState();
    sc.sync(run);
    if (run.events !== lastEvents && run.events.length) { lastEvents = run.events; play(run, sc); }
  };
  const unsubs = [game.subscribe(drawScreens), ui.subscribe(drawScreens), game.subscribe(sync)];
  // A thumb on a button (or a screen that swallows taps) is the screen's, not the look's or the thumbstick's.
  const onUi = (cx: number, cy: number) => { const hit = pixi.renderer.events.rootBoundary.hitTest(cx, cy); return !!hit && hit !== pixi.stage; };
  const offInput = Input.listen(pixi.canvas, onUi);
  const wake = () => Audio.wake();
  addEventListener('pointerdown', wake); addEventListener('keydown', wake);

  const resize = () => {
    const cw = el.clientWidth || innerWidth, ch = el.clientHeight || innerHeight;
    fit(cw, ch);
    sc.resize(cw, ch);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();
  sync();
  drawScreens();
  void now; void get;

  return () => {
    ro.disconnect();
    unsubs.forEach((u) => u());
    offInput();
    removeEventListener('pointerdown', wake); removeEventListener('keydown', wake);
    pixi.ticker.remove(render3d);
    stopClock(); offTick();
    Audio.nightBed(false);
  };
}
