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
    if (threat && tMin < Infinity && !p.flying && this.rng.next() < 0.35 + skill * 0.65) {
      // lookahead planner: simulate each candidate thumb action and keep the safest
      const best = this.plan2(w, horizon + 0.25);
      if (best) { x = best.x; y = best.y; if (best.jump) { held.jump = true; this.holdJump = best.hold; this.jumpCooldown = 0.3; } if (best.blink) held.blink = true; return { x, y, held: { ...held, lock: false } }; }
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

  /** Score candidate actions by simulating the player and every threat a short time ahead. */
  private plan2(w: World, T: number): { x: number; y: number; jump: boolean; hold: number; blink: boolean } | null {
    const p = w.player, d = p.def;
    const cands: { x: number; y: number; jump: boolean; hold: number; blink: boolean }[] = [];
    for (const x of [-1, 0, 1]) {
      cands.push({ x, y: 0, jump: false, hold: 0, blink: false });
      if (p.grounded || p.jumps < 2) { cands.push({ x, y: 0, jump: true, hold: 0.12, blink: false }); cands.push({ x, y: 0, jump: true, hold: 0.6, blink: false }); }
      if (p.blinkCd <= 0 && (p.grounded || !p.blinkUsedAir) && x !== 0) cands.push({ x, y: 0, jump: false, hold: 0, blink: true });
    }
    if (p.grounded) cands.push({ x: 0, y: -1, jump: false, hold: 0, blink: false });
    const step = 1 / 30;
    const threats = w.projs.live.filter((q) => q.hostile && q.alive);
    const bodies = w.all.filter((e) => e.hurts && e.alive && !e.hidden && e.hp > 0 || (e.hurts && e.kind === "hazard" && e.alive));
    let best = null as null | (typeof cands)[number], bestScore = -Infinity;
    for (const c of cands) {
      let px = p.x, py = p.y, vy = p.vy, jumps = p.jumps, grounded = p.grounded, hit = 0, minClear = 999;
      if (c.blink) { px += c.x * d["blink-dist"]; }
      const iT = c.blink ? d["blink-iframes"] : 0;
      if (c.jump) { vy = grounded ? d.jump : d["double-jump"]; jumps = grounded ? 1 : 2; grounded = false; }
      const h = c.y < 0 ? p.hitH * 0.55 : p.hitH;
      for (let t = 0; t < T; t += step) {
        px = Math.max(w.left + 30, Math.min(w.right - 30, px + c.x * d.speed * step * (c.y < 0 ? 0 : 1)));
        if (!grounded) {
          vy -= d.gravity * step;
          if (jumps === 2 && t < c.hold && vy < 0) vy = Math.max(vy, -d["glide-fall"]);
          if (c.jump && t >= c.hold && jumps === 1 && vy > 0) vy *= 0.85;
          py += vy * step;
          const g = w.groundUnder(px, py - vy * step, py);
          if (py <= g) { py = g; grounded = true; vy = 0; }
        }
        if (t < iT) continue;
        for (const q of threats) {
          const qx = q.len > 0 ? q.x : q.x + q.vx * t, qy = q.len > 0 ? q.y : (q.ground ? w.floor + q.r : q.y + q.vy * t - 0.5 * q.gravity * t * t);
          if (q.len > 0) { if (w.projHitsBox(q, px, py, p.hitW, h)) { hit += 1 / (1 + t * 3); } continue; }
          const nx = Math.max(px - p.hitW / 2, Math.min(qx, px + p.hitW / 2)), ny = Math.max(py, Math.min(qy, py + h));
          const dist = Math.hypot(qx - nx, qy - ny) - q.r;
          if (dist < 0) hit += 1 / (1 + t * 3);
          else minClear = Math.min(minClear, dist);
        }
        for (const e of bodies) {
          const ex = e.x + (e.x - e.px) * 60 * t, ey = e.y + (e.y - e.py) * 60 * t;
          const ew = e.w * e.scale * 0.8, eh = e.h * e.scale * 0.85;
          if (e.platform && py >= ey + eh - 6) continue;
          if (Math.abs(px - ex) < (ew + p.hitW) / 2 && py < ey + eh && py + h > ey) hit += 1 / (1 + t * 3);
        }
        if (w.water > w.floor - 30 && py < w.water - 20) hit += 0.5;
        if (py < w.camY - 200) hit += 1;
      }
      const target = this.pickTarget(w);
      const keep = target ? -Math.abs(Math.abs(target.x - px) - 320) / 600 : 0;
      const score = -hit * 10 + Math.min(minClear, 120) / 120 + keep - (c.blink ? 0.3 : 0) - (c.jump ? 0.1 : 0);
      if (score > bestScore) { bestScore = score; best = c; }
    }
    return best;
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
