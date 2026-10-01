// A heuristic player. Reads the rules World (never the view) and produces RawInput like a thumb would.
// Used by tools/balance-bot.ts (headless) and by ?bot=1 in the browser (screenshots, stories).
// It has a human-ish reaction time and makes mistakes on purpose (skill 0..1).
import type { RawInput } from "../core/input";
import type { World } from "../rules/world";
import type { Proj, Ent } from "../rules/types";
import { Rng } from "../core/rng";

export interface BotOpts { skill: number; reaction: number; seed: number; parry: boolean; useSuper: boolean }

export class Bot {
  private rng: Rng;
  private plan: RawInput = { x: 0, y: 0, held: {} };
  private planT = 0;
  private holdJump = 0;
  private jumpCooldown = 0;
  private lastPressed = new Set<string>();
  o: BotOpts;

  constructor(o: Partial<BotOpts> = {}) {
    this.o = { skill: 0.7, reaction: 0.2, seed: 1, parry: true, useSuper: true, ...o };
    this.rng = new Rng(this.o.seed);
  }

  /** Predict whether a projectile overlaps the player's box within `horizon` seconds; returns time or Infinity. */
  private threatTime(w: World, q: Proj, px: number, py: number, horizon: number): number {
    const pw = w.player.hitW / 2 + 14, ph = w.player.hitH;
    if (q.len > 0) {
      // beams: test current segment
      return w.projHitsBox(q, px, py, pw * 2, ph) ? 0 : Infinity;
    }
    let x = q.x, y = q.y, vx = q.vx, vy = q.vy;
    for (let t = 0; t <= horizon; t += 1 / 30) {
      if (Math.abs(x - px) < pw + q.r && y + q.r > py - 6 && y - q.r < py + ph) return t;
      vy -= q.gravity / 30; x += vx / 30; y += vy / 30;
      if (q.ground) y = w.floor;
    }
    return Infinity;
  }

  private bodyThreat(w: World, e: Ent, px: number, horizon: number): number {
    if (!e.hurts || e.hidden || !e.alive) return Infinity;
    const vx = (e.x - e.px) * 60;
    for (let t = 0; t <= horizon; t += 1 / 30) {
      const ex = e.x + vx * t;
      if (Math.abs(ex - px) < (e.w * e.scale) / 2 + 30 && w.player.y < e.y + e.h * e.scale && w.player.y + w.player.hitH > e.y) return t;
    }
    return Infinity;
  }

  step(w: World): RawInput {
    const p = w.player;
    const dt = w.dt;
    this.planT -= dt;
    this.jumpCooldown -= dt;
    if (p.dead || w.result) return { x: 0, y: 0, held: {} };
    // re-plan at human reaction intervals
    if (this.planT <= 0) {
      this.planT = this.o.reaction * (0.7 + this.rng.next() * 0.6);
      this.plan = this.decide(w);
    }
    const out: RawInput = { x: this.plan.x, y: this.plan.y, held: { ...this.plan.held } };
    // one-shot buttons: press once per plan
    for (const b of ["parry", "blink", "ex"] as const) {
      if (out.held[b]) { if (this.lastPressed.has(b)) out.held[b] = false; else this.lastPressed.add(b); }
      else this.lastPressed.delete(b);
    }
    if (this.holdJump > 0) { this.holdJump -= dt; out.held.jump = true; }
    return out;
  }

  private decide(w: World): RawInput {
    const p = w.player;
    const skill = this.o.skill;
    const held: RawInput["held"] = { shoot: true };
    let x = 0, y = 0;
    const target = this.pickTarget(w);
    const horizon = 0.35 + skill * 0.45;
    // perceive threats (skill decides how many it notices)
    let tMin = Infinity, threat: Proj | Ent | null = null;
    for (const q of w.projs.live) {
      if (!q.hostile || !q.alive) continue;
      if (this.rng.next() > 0.55 + skill * 0.45) continue; // missed it
      const t = this.threatTime(w, q, p.x, p.y, horizon);
      if (t < tMin) { tMin = t; threat = q; }
    }
    for (const e of w.all) {
      const t = this.bodyThreat(w, e, p.x, horizon);
      if (t < tMin) { tMin = t; threat = e; }
    }
    if (w.water > w.floor - 30 && p.y < w.water + 60) { tMin = Math.min(tMin, 0.1); }
    // parry pink things when close
    if (this.o.parry) {
      for (const q of w.projs.live) if (q.parryable && Math.hypot(q.x - p.x, q.y - (p.y + 50)) < 110) {
        if (p.grounded && this.jumpCooldown <= 0) { held.jump = true; this.jumpCooldown = 0.3; }
        else held.parry = true;
        return { x, y, held };
      }
      for (const e of w.all) if (e.parryable && e.alive && !e.hidden && !(e.vars.parryCd > 0) && Math.abs(e.x - p.x) < 160 && Math.abs(e.y + e.h * e.scale * 0.5 - (p.y + 50)) < 200) {
        if (p.grounded && this.jumpCooldown <= 0) { held.jump = true; this.holdJump = 0.15; this.jumpCooldown = 0.25; x = Math.sign(e.x - p.x); }
        else held.parry = true;
        return { x, y, held };
      }
    }
    if (threat && tMin < Infinity) {
      const tx = "def" in threat && "vx" in threat ? (threat as Proj).x : (threat as Ent).x;
      const away = tx > p.x ? -1 : 1;
      const lowThreat = "ground" in threat ? (threat as Proj).ground || (threat as Proj).y < p.y + 60 : true;
      if (tMin < 0.18 && p.blinkCd <= 0 && (p.grounded || !p.blinkUsedAir) && this.rng.next() < skill) {
        held.blink = true; x = (Math.abs(p.x + away * 240) < 600 ? away : -away);
      } else if (lowThreat && p.grounded && this.jumpCooldown <= 0) {
        held.jump = true; this.holdJump = 0.25; this.jumpCooldown = 0.35; x = away;
      } else if (!p.grounded && p.jumps < 2 && p.vy < 200 && this.jumpCooldown <= 0) {
        held.jump = true; this.holdJump = 0.6; this.jumpCooldown = 0.3; // double jump + glide
      } else {
        x = away;
        if (!lowThreat && p.grounded) { y = -1; x = 0; } // duck under
      }
    } else if (w.mode === "run") {
      // run-and-gun: keep pushing right, shooting whatever is ahead; hop onto platforms now and then
      x = 1;
      if (target && target.x > p.x && target.x - p.x < 260 && target.kind === "minion" && target.y < p.y + 40) { x = 0; y = -1; } // duck-shoot small walkers
      if (p.grounded && this.rng.next() < 0.04 && this.jumpCooldown <= 0) { held.jump = true; this.holdJump = 0.2; this.jumpCooldown = 0.5; }
    } else if ((w.water > w.floor - 30 || w.camY > 0) && !p.flying) {
      // the floor is deadly (flood) or gone (climb): go stand on the nearest platform above the danger
      let best: Ent | null = null, bd = Infinity;
      for (const e of w.all) {
        if (!e.platform || !e.alive) continue;
        const top = e.kind === "platform" ? e.y : e.y + e.h * e.scale;
        if (top < Math.max(w.water + 4, w.camY + 40) || top > p.y + 330) continue;
        const d = Math.abs(e.x - p.x) + Math.max(0, top - p.y) * 0.5 + (w.camY > 0 ? -Math.max(0, top - p.y) : 0);
        if (d < bd) { bd = d; best = e; }
      }
      if (best) {
        const top = best.kind === "platform" ? best.y : best.y + best.h * best.scale;
        const dx = best.x - p.x;
        x = Math.abs(dx) > 30 ? Math.sign(dx) : 0;
        if (top > p.y + 20 && this.jumpCooldown <= 0 && (p.grounded || (p.jumps < 2 && p.vy < 100))) { held.jump = true; this.holdJump = 0.5; this.jumpCooldown = 0.35; }
        else if (!p.grounded && p.jumps >= 2 && top < p.y) this.holdJump = 0.3; // tail-glide onto it
      }
      if (target && x === 0) { held.lock = true; x = Math.sign(target.x - p.x) * 0.6; const ty = target.y + target.h * target.scale * 0.5 - (p.y + 66); if (ty > 150) { y = 1; } }
    } else if (target) {
      // keep a comfortable distance and face the target
      const want = 330 + (1 - skill) * 80;
      const dx = target.x - p.x;
      if (Math.abs(dx) > want + 60) x = Math.sign(dx);
      else if (Math.abs(dx) < want - 140) x = -Math.sign(dx);
      if (Math.abs(p.x + x * 60) > 590) x = 0;
      if (x === 0) { held.lock = true; x = Math.sign(dx) * 0.6; }
      const ty = target.y + target.h * target.scale * 0.5 - (p.y + 66);
      if (ty > 200 && Math.abs(dx) < 260) { y = 1; x = 0; held.lock = true; }
      else if (ty > 120) { y = 1; held.lock = true; x = Math.sign(dx); }
    }
    if (p.cards >= p.maxCards && this.o.useSuper && target && Math.abs(target.y - p.y) < 200) { held.ex = true; x = Math.sign(target.x - p.x) * 0.6; held.lock = true; }
    else if (p.cards >= 2 && this.rng.next() < 0.1 * skill && target) { held.ex = true; held.lock = true; x = Math.sign(target.x - p.x) * 0.6; }
    return { x, y, held };
  }

  private pickTarget(w: World): Ent | null {
    let best: Ent | null = null, bd = Infinity;
    for (const e of w.all) {
      if (!e.alive || !e.shootable || e.hidden || e.hp <= 0) continue;
      if (e.kind === "decoy") continue; // a sharp player looks for the reflection
      let d = Math.abs(e.x - w.player.x) + (e.kind === "boss" || e.kind === "part" || e.kind === "pot" ? 0 : 150);
      if (e.kind === "target") d -= 200;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
}
