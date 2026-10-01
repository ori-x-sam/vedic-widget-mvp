// Story harness: mounts the REAL renderer (GameView + post stack) on a real rules World, then lets a
// play() function drive it deterministically: step N seconds with scripted input, render, assert.
import { boot, Boot } from "../src/shell/boot";
import { GameView } from "../src/view/gameview";
import { World } from "../src/rules/world";
import { InputMerger, RawInput, Button } from "../src/core/input";
import { STEP } from "../src/core/clock";

let booted: Boot | null = null;
const getBoot = () => (booted ??= boot());

export type Script = (w: World, t: number) => Partial<RawInput> & { press?: Button[] };

export interface MountOpts {
  boss?: string; level?: string; phase?: number; seed?: number; weapons?: string[]; super?: string; cards?: number; script?: Script; god?: boolean;
  /** An empty test arena (no boss attacks) for player-move stories. */
  arena?: boolean;
}

export class Harness {
  world!: World;
  view!: GameView;
  canvas: HTMLCanvasElement;
  log: string[] = [];
  private merger = new InputMerger();
  private script: Script | null = null;
  ready: Promise<void>;

  constructor(public el: HTMLElement, public opts: MountOpts) {
    this.canvas = document.createElement("canvas");
    this.canvas.style.cssText = "width:100%;height:100%;display:block";
    el.appendChild(this.canvas);
    this.ready = this.init();
  }

  /** Shader compile/link errors (three.js logs them) — every story fails on these. */
  shaderErrors: string[] = [];

  private async init() {
    const orig = console.error;
    console.error = (...a: unknown[]) => { const m = a.map(String).join(" "); if (/Shader Error|WebGLProgram|VALIDATE_STATUS/.test(m)) this.shaderErrors.push(m.slice(0, 300)); orig(...a); };
    const b = getBoot();
    const o = this.opts;
    this.view = new GameView(this.canvas, b.tokens, b.content, b.svgs);
    const stage = o.boss ? b.content.bosses[o.boss].stage : o.level ? b.content.levels[o.level].stage : "gajraj";
    await this.view.load([stage]);
    this.view.resize(this.el.clientWidth || 960, this.el.clientHeight || 540);
    await this.view.setStage(stage);
    const content = o.arena ? { ...b.content, bosses: { ...b.content.bosses, arena: { ...b.content.bosses.gajraj, id: "arena", hp: 99999, phases: [{ id: "idle", name: "", until: null, script: [{ name: "wait", args: [999], props: {}, children: [], line: 0 }], line: 0 }] } } } : b.content;
    this.world = new World(content, { weapons: o.weapons ?? ["coin", "mirchi"], super: o.super ?? "to-the-moon", charm: "" }, o.seed ?? 7);
    if (o.level) this.world.startLevel(o.level); else this.world.startBoss(o.arena ? "arena" : o.boss ?? "gajraj");
    for (let i = 0; i < (o.phase ?? 0); i++) { const bo = this.world.boss!, ph = this.world.phase!; bo.hp = bo.maxHp * (ph.until ?? 0) - 1; this.world.nextPhase(); }
    if (o.cards) this.world.player.cards = o.cards;
    this.script = o.script ?? null;
    this.merger.add(() => {
      if (!this.script) return null;
      const r = this.script(this.world, this.world.t);
      const held = { ...(r.held ?? {}) };
      for (const b2 of r.press ?? []) held[b2] = true;
      return { x: r.x ?? 0, y: r.y ?? 0, held };
    });
    this.drain();
    this.view.render(this.world, 0, STEP);
  }

  private drain() {
    for (const e of this.world.events) { this.view.onEvent(e); this.log.push(e.type + (e.s ? `:${e.s}` : "")); }
    this.world.events.length = 0;
  }

  /** Advance simulated time; renders every few steps so particles/decals/ghosts update like the game. */
  run(seconds: number, until?: (w: World) => boolean) {
    const n = Math.round(seconds / STEP);
    for (let i = 0; i < n; i++) {
      this.world.step(this.merger.frame());
      if (this.opts.god && this.world.player.hp < 3) this.world.player.hp = 3;
      this.drain();
      if (i % 4 === 0) this.view.render(this.world, 1, STEP * 4);
      if (until?.(this.world)) break;
    }
    this.view.render(this.world, 1, STEP);
    return this;
  }

  /** Run until a condition holds (or time runs out). Returns whether it held. */
  runUntil(cond: (w: World) => boolean, maxSeconds: number) {
    let ok = cond(this.world);
    if (ok) return true;
    this.run(maxSeconds, (w) => (ok = cond(w)));
    return ok;
  }
}

/** Build a story DOM node. play() reads it back with `harnessOf(canvasElement)`. */
export function stage(opts: MountOpts): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = "width:960px;height:540px;position:relative;background:#120a10";
  el.dataset.stage = "1";
  (el as unknown as { harness: Harness }).harness = new Harness(el, opts);
  return el;
}

export async function harnessOf(root: HTMLElement): Promise<Harness> {
  const el = (root.querySelector("[data-stage]") ?? root) as unknown as { harness: Harness };
  await el.harness.ready;
  el.harness.view.render(el.harness.world, 0, 1 / 60); // compile every material once (no sim step)
  if (el.harness.shaderErrors.length) throw new Error("shader error: " + el.harness.shaderErrors[0]);
  return el.harness;
}
