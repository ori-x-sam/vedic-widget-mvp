// The rules world: entities, projectiles, the player, phases and levels. Deterministic and headless.
// Never imports view/ or shell/. The view reads this state; the shell drains `events`.
import type { Content, BossDef, LevelDef, ProjDef } from "../core/content";
import type { KdlNode } from "../core/kdl";
import type { InputFrame } from "../core/input";
import { Rng } from "../core/rng";
import { Pool } from "../core/pool";
import { STEP } from "../core/clock";
import type { Ent, EntKind, Fiber, Proj, WorldApi, WorldEvent, WorldEventType } from "./types";
import { getWord } from "./vocab/registry";
import { Player, makePlayer, stepPlayer, hurtPlayer } from "./player";

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const ARENA_TOP = 560; // ceiling height above the floor line

const DEFAULT_PROJ: ProjDef = { id: "pellet", sprite: "pellet", r: 12, damage: 1, gravity: 0, spin: 0, life: 6, parryable: false, hostile: true, pierce: false, scale: 1 };

export interface Loadout { weapons: string[]; super: string; charm: string }

export interface DeathRecord { t: number; phase: string; by: string; x: number; y: number; spawnedAgo: number; telegraphed: boolean }

export class World implements WorldApi {
  t = 0;
  readonly dt = STEP;
  rng: Rng;
  all: Ent[] = [];
  ents(): readonly Ent[] { return this.all; }
  private entMap = new Map<number, Ent>();
  fibers: Fiber[] = [];
  projs: Pool<Proj>;
  events: WorldEvent[] = [];
  marks = new Map<string, number>(); // "kind:word" -> count
  markLog: { t: number; key: string; alpha: number }[] = [];
  errors: string[] = [];
  player: Player;
  camX = 0; camY = 0; scrollX = 0; scrollY = 0;
  water = -1e9; waterTarget = -1e9; waterRate = 0;
  floor = 0;
  mode: "boss" | "run" | "fly" = "boss";
  boss: Ent | null = null;
  bossDef: BossDef | null = null;
  level: LevelDef | null = null;
  phaseIdx = -1;
  phaseTag = "";
  phaseT = 0;
  theme = "";
  result: "" | "win" | "lose" = "";
  resultT = 0;
  coins = 0;
  levelLength = 0;
  private nextId = 1;
  private shotCounter = 0;
  lastWarnT = -99; // last telegraph time (balance bot fairness check)
  deaths: DeathRecord[] = [];
  damageDealt = 0;

  constructor(public content: Content, public loadout: Loadout = { weapons: ["coin", "mirchi"], super: "to-the-moon", charm: "" }, seed = 1) {
    this.rng = new Rng(seed);
    this.projs = new Pool<Proj>(() => ({} as Proj), (p) => Object.assign(p, {
      x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, rot: 0, spin: 0, t: 0, life: 6, r: 12, scale: 1, hostile: true, parryable: false, damage: 1,
      gravity: 0, pierce: false, homing: 0, spawnT: 0, target: 0, ground: false, alive: true, owner: 0, hitIds: [], len: 0, angle: 0, ox: 0, oy: 0, def: DEFAULT_PROJ, id: 0,
    }), 400);
    this.player = makePlayer(content.player, loadout);
  }

  // ── WorldApi bounds ──
  get left() { return this.camX - VIEW_W / 2; }
  get right() { return this.camX + VIEW_W / 2; }
  get ceiling() { return this.camY + ARENA_TOP; }
  rand() { return this.rng.next(); }
  range(a: number, b: number) { return this.rng.range(a, b); }
  ent(id: number) { return this.entMap.get(id); }

  // ── setup ──
  startBoss(id: string) {
    const def = this.content.bosses[id];
    if (!def) throw new Error(`unknown boss ${id}`);
    this.mode = "boss";
    this.bossDef = def;
    this.levelLength = VIEW_W;
    this.boss = this.spawnEnt("boss", def.id, def.x, this.floor + def.y, { hp: def.hp, maxHp: def.hp, w: def.w, h: def.h, puppet: def.puppet, facing: -1 });
    this.player.x = -420; this.player.y = this.floor;
    this.setTheme(def.theme);
    this.nextPhase();
  }

  startLevel(id: string) {
    const def = this.content.levels[id];
    if (!def) throw new Error(`unknown level ${id}`);
    this.level = def;
    this.mode = def.mode === "fly" ? "fly" : "run";
    this.levelLength = def.length;
    this.player.flying = def.mode === "fly";
    this.player.x = def.mode === "fly" ? -380 : -480;
    this.player.y = def.mode === "fly" ? 260 : this.floor;
    const dir = this.spawnEnt("director", def.id, 0, 0, { shootable: false, hurts: false, hidden: true, w: 1, h: 1 });
    this.phaseTag = "level";
    this.setTheme(def.theme);
    this.fork(dir, this.run(dir, def.script), "level");
  }

  // ── spawning ──
  spawnEnt(kind: EntKind, def: string, x: number, y: number, init: Partial<Ent> = {}): Ent {
    const e: Ent = {
      id: this.nextId++, kind, def, puppet: def, x, y, px: x, py: y, vx: 0, vy: 0, w: 80, h: 80, hp: 1, maxHp: 1, alive: true, deadT: 0,
      alpha: 1, scale: 1, rot: 0, flipY: false, facing: -1, squash: 0, pose: "idle", poseT: 0, shootable: kind !== "prop" && kind !== "director" && kind !== "platform" && kind !== "rider" && kind !== "pickup" && kind !== "hazard",
      hurts: kind === "boss" || kind === "minion" || kind === "part" || kind === "hazard", parryable: false, invuln: false, reflect: false,
      platform: kind === "platform", gravity: 0, grounded: false, keepVisible: false, hidden: false, parent: 0, offX: 0, offY: 0, dmgTo: 0,
      hitFlash: 0, wobble: 0, trail: "", trailT: 0, stepT: 0, tag: "", vars: {}, fibers: [], ttl: Infinity, removeWithPhase: true,
      ...init,
    };
    if (init.x === undefined) { e.px = x; e.py = y; }
    this.all.push(e);
    this.entMap.set(e.id, e);
    return e;
  }

  spawnMinion(def: string, x: number, y: number, init: Partial<Ent> = {}): Ent | null {
    const m = this.content.minions[def];
    if (!m) { this.err(`unknown minion '${def}'`); return null; }
    const e = this.spawnEnt("minion", def, x, y, { hp: m.hp, maxHp: m.hp, puppet: m.puppet, w: m.w, h: m.h, gravity: m.gravity, parryable: m.parryable, hurts: m.contact, ...init });
    e.facing = this.player.x < x ? -1 : 1;
    if (m.script.length) this.fork(e, this.run(e, m.script), init.tag ?? "");
    return e;
  }

  spawnProj(def: string, x: number, y: number, vx: number, vy: number, init: Partial<Proj> = {}): Proj | null {
    const d = this.content.projectiles[def];
    if (!d) this.err(`unknown projectile '${def}'`);
    const pd = d ?? DEFAULT_PROJ;
    if (this.projs.size > 900) return null;
    const p = this.projs.get();
    p.id = this.nextId++;
    p.def = pd; p.x = p.px = x; p.y = p.py = y; p.vx = vx; p.vy = vy;
    p.r = pd.r * pd.scale; p.scale = pd.scale; p.damage = pd.damage; p.gravity = pd.gravity; p.spin = pd.spin; p.life = pd.life;
    p.parryable = pd.parryable; p.hostile = pd.hostile; p.pierce = pd.pierce;
    p.hitIds.length = 0;
    Object.assign(p, init);
    if (p.hostile && p.owner) {
      const o = this.entMap.get(p.owner);
      if (o?.vars.parryEvery) {
        o.vars.parryCount = (o.vars.parryCount ?? 0) + 1;
        if (o.vars.parryCount % o.vars.parryEvery === 0) p.parryable = true;
      }
    }
    p.spawnT = this.t;
    return p;
  }

  addPlatform(x: number, y: number, w: number, init: Partial<Ent> = {}): Ent {
    return this.spawnEnt("platform", init.puppet ?? "platform", x, y, { w, h: 24, platform: true, hurts: false, shootable: false, tag: "stage", ...init });
  }

  emit(type: WorldEventType, x: number, y: number, s?: string, n?: number, id?: number) {
    this.events.push({ type, x, y, s, n, id });
    if (type === "win" && !this.result) { this.result = "win"; this.resultT = 0; }
    if (type === "warn" || type === "drumroll" || type === "sheet" || type === "telegraph") this.lastWarnT = this.t;
  }

  mark(me: Ent, key: string) {
    const k = `${me.def}:${key}`;
    this.marks.set(k, (this.marks.get(k) ?? 0) + 1);
    this.markLog.push({ t: this.t, key: k, alpha: me.alpha });
    if (this.markLog.length > 2000) this.markLog.splice(0, 1000);
  }

  setScroll(dx: number, dy: number) { this.scrollX = dx; this.scrollY = dy; }
  setWater(target: number, rate: number) { if (this.water < this.floor - 50) this.water = this.floor - 40; this.waterTarget = target; this.waterRate = rate; }
  setTheme(id: string) { if (id && id !== this.theme) { this.theme = id; this.emit("theme", 0, 0, id); } }

  err(msg: string) { if (!this.errors.includes(msg)) this.errors.push(msg); }

  // ── scripting ──
  *run(me: Ent, nodes: KdlNode[]): Generator<void, void, void> {
    for (const n of nodes) {
      if (!me.alive && me.kind !== "director") return;
      const w = getWord(n.name);
      if (!w) { this.err(`${n.file ?? ""}:${n.line}: unknown word '${n.name}'`); continue; }
      // stunned actors don't move or attack until the stun wears off
      while (me.vars.stunned > 0 && (w.kind === "attack" || w.kind === "move")) yield;
      yield* w.fn(this, me, { args: n.args, props: n.props, children: n.children, line: n.line, file: n.file });
    }
  }

  fork(me: Ent, gen: Generator<void, void, void>, tag = ""): Fiber {
    const f: Fiber = { gen, done: false, owner: me.id, tag };
    // run until first yield immediately so instant words take effect this step
    this.advanceFiber(f);
    this.fibers.push(f);
    return f;
  }

  private advanceFiber(f: Fiber) {
    if (f.done) return;
    try {
      const r = f.gen.next();
      if (r.done) f.done = true;
    } catch (e) {
      f.done = true;
      this.err(`script error: ${(e as Error).message}`);
    }
  }

  killFibers(pred: (f: Fiber) => boolean) {
    for (const f of this.fibers) if (pred(f)) { f.done = true; try { f.gen.return(); } catch { /* ignore */ } }
  }

  // ── phases ──
  nextPhase() {
    const def = this.bossDef!;
    const boss = this.boss!;
    const oldTag = this.phaseTag;
    this.killFibers((f) => f.tag === oldTag || f.owner === boss.id);
    for (const e of this.all) if (e !== boss && e.tag === oldTag && oldTag) { e.alive = false; e.deadT = 99; }
    for (const p of this.projs.live) if (p.hostile) p.alive = false;
    this.phaseIdx++;
    const ph = def.phases[this.phaseIdx];
    if (!ph) return;
    this.phaseTag = `${def.id}/${ph.id}`;
    this.phaseT = 0;
    // reset boss to its neutral self; the phase's words set it up again
    Object.assign(boss, { alpha: 1, scale: 1, hidden: false, shootable: true, hurts: true, flipY: false, parryable: false, reflect: false, parent: 0, trail: "", rot: 0, puppet: def.puppet, w: def.w, h: def.h, pose: "idle" });
    boss.vars = {};
    this.scrollX = this.scrollY = 0;
    this.water = this.waterTarget = -1e9;
    if (this.camX !== 0 || this.camY !== 0) {
      // a phase that moved the camera (vertical climb) cuts back to the stage
      this.camX = this.camY = 0;
      for (const e of this.all) if (e.kind === "platform" && e.tag !== "stage") { e.alive = false; e.deadT = 99; }
      Object.assign(this.player, { x: -420, y: this.floor, px: -420, py: this.floor, vx: 0, vy: 0 });
      boss.x = boss.px = this.bossDef!.x; boss.y = boss.py = this.floor + this.bossDef!.y;
    }
    if (this.phaseIdx > 0) this.emit("phase", boss.x, boss.y, ph.name || ph.id, this.phaseIdx);
    this.fork(boss, this.loopScript(boss, ph.script), this.phaseTag);
  }

  private *loopScript(me: Ent, script: KdlNode[]): Generator<void, void, void> {
    for (;;) {
      const t0 = this.t;
      yield* this.run(me, script);
      if (this.t === t0) yield;
    }
  }

  get phase() { return this.bossDef?.phases[this.phaseIdx]; }

  // ── damage ──
  damage(e: Ent, amount: number) {
    if (!e.alive || e.invuln || e.hp <= 0 && e.kind !== "decoy") return;
    amount *= e.vars.vuln ?? 1;
    e.hitFlash = 0.08;
    if (e.vars.wobbly) e.wobble = Math.min(1.5, e.wobble + 0.25);
    if (e.kind === "decoy") {
      e.vars.cracks = (e.vars.cracks ?? 0) + 1;
      this.emit("hit", e.x, e.y + e.h / 2, "glass");
      if (e.vars.cracks >= 14) { e.alive = false; e.deadT = 0; this.emit("particles", e.x, e.y + e.h / 2, "glass", 20); this.emit("sfx", e.x, e.y, "glass"); }
      return;
    }
    const pool = e.dmgTo ? this.entMap.get(e.dmgTo) : null;
    if (e.kind === "part" || e.kind === "target" || e.kind === "minion" || !pool) {
      e.hp -= amount;
      if (e.hp <= 0) this.knockOut(e);
    }
    if (pool) { pool.hp -= amount; pool.hitFlash = 0.08; }
    const pl = this.player;
    if (pl.superT <= 0 && e.kind !== "target") pl.cards = Math.min(pl.maxCards, pl.cards + amount / pl.def["meter-per-card"]);
    const b = pool ?? e;
    if (b === this.boss) { this.emit("boss-hit", e.x, e.y + e.h / 2, "", amount); this.damageDealt += amount; }
    else this.emit("hit", e.x, e.y + e.h / 2, e.def, amount);
  }

  knockOut(e: Ent) {
    e.hp = 0;
    e.shootable = false; e.hurts = false; e.parryable = false;
    this.killFibers((f) => f.owner === e.id);
    if (e.kind === "minion") {
      e.alive = false; e.deadT = 0;
      this.emit("particles", e.x, e.y + e.h / 2, "pop", 12);
      this.emit("sfx", e.x, e.y, "pop");
      if (this.rng.chance(0.35)) this.spawnEnt("pickup", "token", e.x, e.y + 40, { puppet: "token", w: 40, h: 40, tag: "coin", vy: 400, gravity: 1800 });
    } else if (e.kind === "part") {
      e.pose = "ko";
      this.emit("particles", e.x, e.y + e.h / 2, "confetti", 24);
      this.emit("sfx", e.x, e.y, "ko");
    } else if (e.kind === "target") {
      e.alive = false;
      this.emit("particles", e.x, e.y + e.h, "smoke", 8);
    }
  }

  // ── step ──
  step(input: InputFrame) {
    const dt = this.dt;
    this.t += dt;
    this.phaseT += dt;
    // camera
    this.camX += this.scrollX * dt;
    this.camY += this.scrollY * dt;
    for (const e of this.all) {
      e.px = e.x; e.py = e.y;
      if (e.vars.camLock) { e.x += this.scrollX * dt; e.y += this.scrollY * dt; }
    }
    for (const p of this.projs.live) { p.px = p.x; p.py = p.y; }

    if (this.result) {
      this.resultT += dt;
      stepPlayer(this, input, true);
      this.stepEnts(dt);
      return;
    }

    stepPlayer(this, input, false);

    // scripts
    const fs = this.fibers;
    for (let i = 0; i < fs.length; i++) {
      const f = fs[i];
      if (f.done) continue;
      const o = this.entMap.get(f.owner);
      if (o && !o.alive && o.kind !== "director") { f.done = true; continue; }
      if (o && o.hp <= 0 && (o.kind === "part" || o.kind === "minion")) { f.done = true; continue; }
      this.advanceFiber(f);
    }
    if (this.fibers.length > 64 && this.t % 1 < dt) this.fibers = this.fibers.filter((f) => !f.done);

    this.stepEnts(dt);
    this.stepProjs(dt);
    this.contactDamage();
    this.stepWater(dt);
    this.updateCamera();
    this.checkPhase();
  }

  private stepEnts(dt: number) {
    const live: Ent[] = [];
    for (const e of this.all) {
      if (e.hitFlash > 0) e.hitFlash -= dt;
      e.poseT += dt;
      e.squash *= 0.86;
      e.wobble *= 0.97;
      if (e.vars.parryCd > 0) e.vars.parryCd -= dt;
      if (e.ttl !== Infinity) { e.ttl -= dt; if (e.ttl <= 0) e.alive = false; }
      // attachments
      if (e.parent) {
        const p = this.entMap.get(e.parent);
        if (!p || !p.alive) { if (e.kind === "rider" || e.kind === "target") e.alive = false; }
        else if (e.kind === "target") {
          e.x = p.x + e.offX; e.y = this.floor; e.h = Math.max(40, p.y - this.floor + p.h * 0.5);
        } else {
          e.x = p.x + e.offX * p.facing * p.scale;
          e.y = p.y + e.offY * p.scale * (p.flipY ? -1 : 1);
          e.facing = p.facing;
          if (e.kind === "rider" && !e.keepVisible) e.alpha = p.alpha;
          if (e.kind === "rider") e.hidden = p.hidden;
        }
      }
      // hazards with velocity (ride-platform moves itself), simple physics for minions/pickups
      if (e.gravity > 0 && !e.parent) {
        e.vy -= e.gravity * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        const ground = this.groundUnder(e.x, e.py, e.y);
        if (e.y <= ground) { e.y = ground; e.vy = 0; e.vx *= 0.8; e.grounded = true; } else e.grounded = false;
      }
      if (e.vars.buoy) e.y = this.water + 12 + Math.sin(this.t * 2 + (e.vars.phase ?? 0)) * 6;
      // footprint trail (invisible acts)
      if (e.trail && e.alive && !e.hidden) {
        e.trailT += Math.abs(e.x - e.px);
        if (e.trailT > 70 && e.y <= this.floor + 4) {
          e.trailT = 0;
          e.stepT = (e.stepT + 1) % 2;
          this.emit("decal", e.x + (e.stepT ? 18 : -18) * e.scale, this.floor, e.trail, e.scale, e.id);
          this.emit("particles", e.x, this.floor + 4, "dust", 3);
          this.emit("sfx", e.x, e.y, "step");
          if (e.alpha < 0.1) this.mark(e, "footprint-invisible");
        }
      }
      // dead/KO'd parts fade
      if (e.kind === "part" && e.hp <= 0) { e.deadT += dt; }
      if (!e.alive) e.deadT += dt;
      // off-camera minions despawn
      if (e.kind === "minion" && (e.x < this.left - 400 || e.x > this.right + 500 || e.y < this.camY - 400)) e.alive = false;
      if (e.kind === "pickup" && e.def === "token") {
        const pl = this.player;
        if (Math.abs(pl.x - e.x) < 50 && pl.y < e.y + 40 && pl.y + pl.h > e.y - 10) { e.alive = false; this.coins++; this.emit("pickup", e.x, e.y, "token"); }
      }
      if (e.alive || e.deadT < 0.6) live.push(e);
      else this.entMap.delete(e.id);
    }
    this.all = live;
  }

  /** Highest walkable surface at x between y0 (prev) and y1 (now), for falling bodies. */
  groundUnder(x: number, yPrev: number, yNow: number, halfW = 20): number {
    let g = this.mode === "fly" ? -1e9 : this.floor;
    for (const e of this.all) {
      if (!e.platform || !e.alive) continue;
      const top = e.kind === "platform" ? e.y : e.y + e.h * e.scale;
      const hw = e.w * e.scale * 0.5;
      if (x + halfW < e.x - hw || x - halfW > e.x + hw) continue;
      if (yPrev >= top - 2 && yNow <= top + 1 && top > g) g = top;
    }
    return g;
  }

  /** Platform currently under a standing body (for riding moving platforms). */
  platformAt(x: number, y: number, halfW = 20): Ent | null {
    for (const e of this.all) {
      if (!e.platform || !e.alive) continue;
      const top = e.kind === "platform" ? e.y : e.y + e.h * e.scale;
      const hw = e.w * e.scale * 0.5;
      if (x + halfW >= e.x - hw && x - halfW <= e.x + hw && Math.abs(y - top) < 3) return e;
    }
    return null;
  }

  private stepProjs(dt: number) {
    const pl = this.player;
    const pcx = pl.x, pcy = pl.y + pl.h * 0.5;
    for (const p of this.projs.live) {
      if (!p.alive) continue;
      p.t += dt;
      if (p.t > p.life) { p.alive = false; continue; }
      if (p.len > 0) {
        const o = this.entMap.get(p.owner);
        if (o && !p.hostile) { /* player beam anchored in player.ts */ }
        else if (o) { p.x = o.x + p.ox; p.y = o.y + p.oy; }
      } else {
        if (p.homing) {
          let tx = pcx, ty = pcy;
          if (!p.hostile) {
            const t = this.nearestTarget(p.x, p.y);
            if (t) { tx = t.x; ty = t.y + t.h * t.scale * 0.5; } else { tx = p.x + p.vx; ty = p.y + p.vy; }
          }
          const want = Math.atan2(ty - p.y, tx - p.x);
          const cur = Math.atan2(p.vy, p.vx);
          let d = want - cur;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          const turn = Math.max(-p.homing * dt, Math.min(p.homing * dt, d));
          const sp = Math.hypot(p.vx, p.vy);
          p.vx = Math.cos(cur + turn) * sp; p.vy = Math.sin(cur + turn) * sp;
        }
        p.vy -= p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.spin * dt;
        if (p.ground) p.y = this.floor + p.r;
        if (p.y < this.floor - 4 && !p.ground && this.mode !== "fly" && this.camY === 0) {
          // shots hit the stage boards instead of flying into the audience (and under the thumbs)
          if (p.hostile && p.gravity > 0) { this.emit("particles", p.x, this.floor, "smoke", 6); this.emit("sfx", p.x, p.y, "boom"); }
          else this.emit("particles", p.x, this.floor, "dust", 2);
          p.alive = false; continue;
        }
        if (p.x < this.left - 300 || p.x > this.right + 300 || p.y < this.camY - 300 || p.y > this.ceiling + 500) { p.alive = false; continue; }
      }
      if (p.hostile) {
        // vs player
        if (!pl.dead && this.projHitsBox(p, pl.x, pl.y, pl.hitW, pl.hitH)) {
          if (pl.parryT > 0 && p.parryable) { this.parried(p.x, p.y); p.alive = false; continue; }
          if (hurtPlayer(this, p.def.id, p.spawnT)) { if (!p.pierce && p.len === 0) p.alive = false; }
        }
      } else {
        // vs enemies
        for (const e of this.all) {
          if (!e.alive || !e.shootable || e.hidden || e.hp <= 0 && e.kind !== "decoy") continue;
          if (p.hitIds.includes(e.id)) continue;
          if (!this.projHitsBox(p, e.x, e.y, e.w * e.scale * 0.9, e.h * e.scale * 0.95)) continue;
          const dmg = p.len > 0 ? p.damage * dt : p.damage;
          this.damage(e, dmg);
          if (p.len > 0) continue;
          this.emit("particles", p.x, p.y, e.kind === "decoy" ? "glass" : "spark", 3);
          if (p.pierce) { p.hitIds.push(e.id); continue; }
          p.alive = false;
          break;
        }
      }
    }
    this.projs.sweep((p) => !p.alive);
  }

  nearestTarget(x: number, y: number): Ent | null {
    let best: Ent | null = null, bd = Infinity;
    for (const e of this.all) {
      if (!e.alive || !e.shootable || e.hidden || e.hp <= 0 || e.kind === "decoy") continue;
      const d = Math.hypot(e.x - x, e.y + e.h * 0.5 - y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  /** Circle (or beam segment) vs axis-aligned box [x±w/2, y..y+h]. */
  projHitsBox(p: Proj, bx: number, by: number, bw: number, bh: number, flipY = false): boolean {
    const y0 = flipY ? by - bh : by, y1 = flipY ? by : by + bh;
    if (p.len > 0) {
      // sample along the beam
      const cx = Math.cos(p.angle), cy = Math.sin(p.angle);
      for (let s = 0; s < p.len; s += 30) {
        const sx = p.x + cx * s, sy = p.y + cy * s;
        if (sx + p.r > bx - bw / 2 && sx - p.r < bx + bw / 2 && sy + p.r > y0 && sy - p.r < y1) return true;
      }
      return false;
    }
    const nx = Math.max(bx - bw / 2, Math.min(p.x, bx + bw / 2));
    const ny = Math.max(y0, Math.min(p.y, y1));
    return (p.x - nx) ** 2 + (p.y - ny) ** 2 < p.r * p.r;
  }

  parried(x: number, y: number) {
    const pl = this.player;
    pl.vy = this.content.player["parry-bounce"] ?? 950;
    pl.cards = Math.min(pl.maxCards, pl.cards + 1);
    pl.parryT = 0;
    pl.parryCd = 0;
    pl.jumps = 1; // a parry refunds the double jump
    pl.blinkUsedAir = false;
    pl.stats.parries++;
    this.emit("parry", x, y, "", 1);
    this.emit("particles", x, y, "parry", 16);
    this.emit("haptic", x, y, "parry", 30);
  }

  private contactDamage() {
    const pl = this.player;
    if (pl.dead) return;
    for (const e of this.all) {
      if (!e.alive || e.hidden || e.hp <= 0 && e.kind !== "decoy" && e.kind !== "pot" && e.kind !== "hazard" && e.kind !== "pickup" && e.kind !== "rider") continue;
      const w = e.w * e.scale * 0.8, h = e.h * e.scale * 0.85;
      const y0 = e.y; // flipY flips the art in place; the box stays put
      const overlap = Math.abs(pl.x - e.x) < (w + pl.hitW) / 2 && pl.y < y0 + h && pl.y + pl.hitH > y0;
      if (!overlap) continue;
      if (e.parryable && pl.parryT > 0 && !(e.vars.parryCd > 0)) {
        this.parried(e.x, e.y + e.h * e.scale * 0.5);
        if (e.kind === "pickup") e.alive = false;
        else { e.vars.parryCd = 1.2; e.hitFlash = 0.15; }
        continue;
      }
      if (e.hurts && !(e.platform && pl.y >= (e.kind === "platform" ? e.y : e.y + e.h * e.scale) - 4)) hurtPlayer(this, e.def);
    }
  }

  private stepWater(dt: number) {
    if (this.water < this.waterTarget) this.water = Math.min(this.waterTarget, this.water + this.waterRate * dt);
    if (this.water > this.floor - 30 && !this.player.dead && this.player.y < this.water - 20) {
      if (hurtPlayer(this, "water")) this.player.vy = 1250;
    }
  }

  private updateCamera() {
    if (this.mode === "run") {
      const target = Math.max(0, Math.min(this.levelLength, this.player.x + 160));
      if (target > this.camX) this.camX += (target - this.camX) * 0.1; // never scroll back
    }
  }

  private checkPhase() {
    const b = this.boss;
    if (this.mode !== "boss" || !b || !this.bossDef) return;
    if (b.hp <= 0) {
      if (!this.result) {
        this.result = "win";
        this.killFibers(() => true);
        for (const p of this.projs.live) if (p.hostile) p.alive = false;
        b.pose = "ko"; b.alpha = 1; b.hidden = false; b.scale = Math.max(b.scale, 0.3);
        for (const e of this.all) if (e !== b && e.kind !== "platform") { e.alive = false; e.deadT = 99; }
        this.emit("knockout", b.x, b.y + b.h / 2, this.content.strings["knockout"] ?? "KHEL KHATAM!");
      }
      return;
    }
    const ph = this.phase;
    if (ph && ph.until != null && b.hp / b.maxHp <= ph.until && this.phaseIdx < this.bossDef.phases.length - 1) this.nextPhase();
  }

  /** Signature-move marks for a given content id, e.g. world.marked("gajraj", "stomp"). */
  marked(def: string, key: string) { return this.marks.get(`${def}:${key}`) ?? 0; }
}
