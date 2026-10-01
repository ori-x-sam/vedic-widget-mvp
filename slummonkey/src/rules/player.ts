// SlumMonkey's rules: run, 8-way aim, aim-lock, double jump, tail-glide, parry, blink, weapons, EX, supers.
// Every number comes from content/player.kdl (with safe defaults here).
import type { InputFrame } from "../core/input";
import type { World, Loadout } from "./world";

export interface Player {
  x: number; y: number; px: number; py: number; vx: number; vy: number;
  w: number; h: number; hitW: number; hitH: number;
  facing: 1 | -1; grounded: boolean; coyote: number; jumps: number; gliding: boolean; ducking: boolean; locked: boolean;
  aimX: number; aimY: number;
  hp: number; maxHp: number; cards: number; maxCards: number;
  iframes: number; blinkT: number; blinkCd: number; blinkUsedAir: boolean;
  parryT: number; parryCd: number;
  shootCd: number; shotAlt: number; weaponIdx: number; weapons: string[]; super: string;
  superT: number; superKind: string; invulnT: number; exT: number;
  dead: boolean; flying: boolean; pose: string; poseT: number; hurtT: number;
  stats: { shots: number; parries: number; hurts: number; blinks: number; glides: number; exs: number; supers: number };
  def: Record<string, number>;
}

const D: Record<string, number> = {
  speed: 430, gravity: 2900, jump: 1080, "double-jump": 940, "jump-cut": 0.5, "glide-fall": 150, "max-fall": 1500,
  "blink-dist": 230, "blink-cd": 0.55, "blink-iframes": 0.28, hp: 3, cards: 5, iframes: 1.6, "parry-window": 0.22,
  "parry-cd": 0.3, "parry-bounce": 950, "meter-per-card": 110, "fly-speed": 500, coyote: 0.08, "ex-cost": 1, "hit-w": 46, "hit-h": 92,
};

export function makePlayer(def: Record<string, number>, loadout: Loadout): Player {
  const d = { ...D, ...def };
  return {
    x: -420, y: 0, px: -420, py: 0, vx: 0, vy: 0, w: 70, h: 110, hitW: d["hit-w"], hitH: d["hit-h"],
    facing: 1, grounded: true, coyote: 0, jumps: 0, gliding: false, ducking: false, locked: false, aimX: 1, aimY: 0,
    hp: d.hp, maxHp: d.hp, cards: 0, maxCards: d.cards, iframes: 0, blinkT: 0, blinkCd: 0, blinkUsedAir: false,
    parryT: 0, parryCd: 0, shootCd: 0, shotAlt: 0, weaponIdx: 0, weapons: loadout.weapons.slice(), super: loadout.super,
    superT: 0, superKind: "", invulnT: 0, exT: 0, dead: false, flying: false, pose: "idle", poseT: 0, hurtT: 0,
    stats: { shots: 0, parries: 0, hurts: 0, blinks: 0, glides: 0, exs: 0, supers: 0 }, def: d,
  };
}

export const isInvulnerable = (p: Player) => p.iframes > 0 || p.blinkT > 0 || p.invulnT > 0 || p.superT > 0 || p.dead;

/** Damage the player. Returns true if it landed. */
export function hurtPlayer(w: World, by: string, spawnT = -Infinity): boolean {
  const p = w.player;
  if (isInvulnerable(p) || w.result) return false;
  p.hp--;
  p.stats.hurts++;
  p.iframes = p.def.iframes;
  p.hurtT = 0.35;
  p.vy = Math.max(p.vy, 520);
  p.gliding = false;
  w.emit("player-hurt", p.x, p.y + p.h / 2, by, p.hp);
  w.emit("haptic", p.x, p.y, "hit", 80);
  w.emit("shake", p.x, p.y, "", 10);
  w.emit("tracking", p.x, p.y, "", 0.35);
  if (p.hp <= 0) {
    p.dead = true;
    p.pose = "dead";
    w.result = "lose";
    w.deaths.push({
      t: w.t, phase: w.phase?.id ?? w.level?.id ?? "", by, x: p.x, y: p.y,
      spawnedAgo: w.t - spawnT, telegraphed: w.t - w.lastWarnT < 2.5,
    });
    w.emit("player-dead", p.x, p.y, by);
  }
  return true;
}

export function stepPlayer(w: World, inp: InputFrame, frozen: boolean) {
  const p = w.player;
  const d = p.def;
  const dt = w.dt;
  p.px = p.x; p.py = p.y;
  p.poseT += dt;
  for (const k of ["iframes", "blinkT", "blinkCd", "parryT", "parryCd", "shootCd", "invulnT", "exT", "hurtT"] as const) p[k] = Math.max(0, p[k] - dt);

  if (p.dead || frozen) {
    if (!p.flying) { p.vy -= d.gravity * dt; p.y = Math.max(w.groundUnder(p.x, p.py, p.y + p.vy * dt), p.y + p.vy * dt); }
    return;
  }

  // ── super in progress ──
  if (p.superT > 0) {
    p.superT = Math.max(0, p.superT - dt);
    if (p.superKind === "beam") {
      p.vx = p.vy = 0;
      for (const q of w.projs.live) if (!q.hostile && q.len > 0) { q.x = p.x + p.facing * 50; q.y = p.y + 70; }
      p.pose = "super-beam";
      return;
    }
  }

  // ── aim & move ──
  p.locked = inp.held.lock;
  const mx = inp.mx, my = inp.my;
  if (mx !== 0) p.facing = mx > 0 ? 1 : -1;
  p.ducking = !p.flying && p.grounded && my < 0 && !p.locked;
  if (p.flying) {
    p.aimX = 1; p.aimY = 0; p.facing = 1;
  } else if (p.locked) {
    if (mx || my) { p.aimX = mx; p.aimY = my; } else { p.aimX = p.facing; p.aimY = 0; }
  } else if (p.ducking) {
    p.aimX = p.facing; p.aimY = 0;
  } else {
    p.aimX = my !== 0 && mx === 0 ? 0 : p.facing;
    p.aimY = my > 0 ? 1 : !p.grounded && my < 0 ? -1 : 0;
  }
  const al = Math.hypot(p.aimX, p.aimY) || 1;
  p.aimX /= al; p.aimY /= al;

  if (p.flying) {
    const sp = d["fly-speed"];
    p.vx = mx * sp; p.vy = my * sp;
    p.x += p.vx * dt + w.scrollX * dt; p.y += p.vy * dt;
    p.x = Math.max(w.left + 50, Math.min(w.right - 80, p.x));
    p.y = Math.max(w.camY + 30, Math.min(w.ceiling - 60, p.y));
  } else {
    const run = p.locked || p.ducking ? 0 : mx * d.speed;
    p.vx = run;
    // ride moving platforms
    const plat = p.grounded ? w.platformAt(p.x, p.y) : null;
    if (plat) p.x += plat.x - plat.px;
    p.x += p.vx * dt;
    p.x = Math.max(w.left + 30, Math.min(w.right - 30, p.x));
    if (w.mode === "run") p.x = Math.min(p.x, w.levelLength + 600);

    // jump / double jump / glide
    if (p.grounded) { p.coyote = d.coyote; p.jumps = 0; p.blinkUsedAir = false; }
    else p.coyote = Math.max(0, p.coyote - dt);
    if (inp.pressed.jump) {
      if (p.grounded || p.coyote > 0) {
        if (p.ducking && w.platformAt(p.x, p.y)) { p.y -= 4; p.grounded = false; } // drop through
        else { p.vy = d.jump; p.jumps = 1; p.grounded = false; p.coyote = 0; w.emit("jump", p.x, p.y, "1"); }
      } else if (p.jumps < 2) {
        p.vy = d["double-jump"]; p.jumps = 2; w.emit("jump", p.x, p.y, "2");
        w.emit("particles", p.x, p.y, "smoke", 5);
      }
    }
    if (inp.released.jump && p.jumps === 1 && p.vy > 0) p.vy *= d["jump-cut"];
    const wasGliding = p.gliding;
    p.gliding = p.jumps === 2 && inp.held.jump && p.vy <= 0 && !p.grounded;
    if (p.gliding && !wasGliding) { p.stats.glides++; w.emit("glide", p.x, p.y, "start"); }
    if (!p.gliding && wasGliding) w.emit("glide", p.x, p.y, "stop");

    p.vy -= d.gravity * dt;
    if (p.gliding) p.vy = Math.max(p.vy, -d["glide-fall"]);
    p.vy = Math.max(p.vy, -d["max-fall"]);
    const ny = p.y + p.vy * dt;
    const ground = p.vy <= 0 ? w.groundUnder(p.x, p.y, ny, 18) : -1e9;
    if (ny <= ground) {
      if (!p.grounded) { w.emit("land", p.x, ground, "", Math.min(1, -p.vy / 1500)); }
      p.y = ground; p.vy = 0; p.grounded = true; p.gliding = false;
    } else { p.y = ny; p.grounded = false; }
    if (p.y > w.ceiling + 300) p.y = w.ceiling + 300;

    // fell out of a climbing camera
    if (p.y < w.camY - 220) {
      hurtPlayer(w, "fall");
      p.y = w.camY + 120; p.vy = 1300; p.jumps = 1;
    }
  }

  // ── parry ──
  if (inp.pressed.parry && p.parryCd <= 0) {
    p.parryT = d["parry-window"]; p.parryCd = d["parry-cd"] + d["parry-window"];
    p.pose = "parry"; p.poseT = 0;
    w.emit("sfx", p.x, p.y, "parry-swing");
  }

  // ── blink ──
  if (inp.pressed.blink && p.blinkCd <= 0 && (p.grounded || p.flying || !p.blinkUsedAir)) {
    let bx = mx, by = p.flying ? my : Math.max(0, my);
    if (!bx && !by) bx = p.facing;
    const l = Math.hypot(bx, by);
    const dist = d["blink-dist"];
    const fx = p.x, fy = p.y;
    p.x = Math.max(w.left + 30, Math.min(w.right - 30, p.x + (bx / l) * dist));
    p.y = Math.max(p.flying ? w.camY + 30 : w.groundUnder(p.x, p.y, p.y), p.y + (by / l) * dist * 0.7);
    if (!p.grounded && !p.flying) { p.blinkUsedAir = true; p.vy = Math.max(p.vy, 0); }
    p.blinkT = d["blink-iframes"]; p.blinkCd = d["blink-cd"];
    p.stats.blinks++;
    p.px = p.x; p.py = p.y; // no interpolation smear across a teleport
    w.emit("blink", fx, fy, `${p.x},${p.y}`, p.facing);
    w.emit("haptic", p.x, p.y, "blink", 15);
  }

  // ── weapons ──
  if (inp.pressed.swap && p.weapons.length > 1) { p.weaponIdx = (p.weaponIdx + 1) % p.weapons.length; w.emit("sfx", p.x, p.y, "swap"); }
  if (inp.pressed.ex) tryExOrSuper(w);
  if (inp.held.shoot && p.shootCd <= 0 && p.exT <= 0) fire(w);

  // ── pose ──
  if (p.parryT > 0) p.pose = "parry";
  else if (p.hurtT > 0) p.pose = "hurt";
  else if (p.flying) p.pose = "fly";
  else if (p.gliding) p.pose = "glide";
  else if (!p.grounded) p.pose = p.jumps === 2 ? "spin" : "jump";
  else if (p.ducking) p.pose = "duck";
  else if (Math.abs(p.vx) > 1) p.pose = "run";
  else p.pose = inp.held.shoot ? "aim" : "idle";
  p.hitH = p.ducking ? d["hit-h"] * 0.55 : d["hit-h"];
}

export function muzzle(p: Player): [number, number] {
  const baseY = p.ducking ? 34 : p.flying ? 40 : 66;
  return [p.x + p.aimX * 52 + (p.aimX === 0 ? p.facing * 10 : 0), p.y + baseY + p.aimY * 44];
}

function fire(w: World) {
  const p = w.player;
  const wp = w.content.weapons[p.weapons[p.weaponIdx]];
  if (!wp) return;
  p.shootCd = 1 / wp.rate;
  p.stats.shots++;
  const [ox, oy] = muzzle(p);
  const a = Math.atan2(p.aimY, p.aimX);
  const life = wp.range / wp.speed;
  p.shotAlt = (p.shotAlt + 1) % 3;
  const jitter = (p.shotAlt - 1) * 6;
  switch (wp.kind) {
    case "straight":
      w.spawnProj(wp.projectile, ox - Math.sin(a) * jitter, oy + Math.cos(a) * jitter, Math.cos(a) * wp.speed, Math.sin(a) * wp.speed, { hostile: false, damage: wp.damage, life, rot: a });
      break;
    case "spread":
      for (let i = 0; i < wp.count; i++) {
        const aa = a + ((i - (wp.count - 1) / 2) * wp.spread * Math.PI) / 180 / Math.max(1, wp.count - 1) * 2;
        w.spawnProj(wp.projectile, ox, oy, Math.cos(aa) * wp.speed, Math.sin(aa) * wp.speed, { hostile: false, damage: wp.damage, life, rot: aa });
      }
      break;
    case "homing":
      w.spawnProj(wp.projectile, ox, oy, Math.cos(a + (p.shotAlt - 1) * 0.3) * wp.speed, Math.sin(a + (p.shotAlt - 1) * 0.3) * wp.speed, { hostile: false, damage: wp.damage, life, homing: 7 });
      break;
    case "arc":
      w.spawnProj(wp.projectile, ox, oy, Math.cos(a) * wp.speed * 0.8, Math.sin(a) * wp.speed + 520, { hostile: false, damage: wp.damage, life, gravity: 1700 });
      break;
  }
  w.emit("shoot", ox, oy, wp.id);
}

function tryExOrSuper(w: World) {
  const p = w.player;
  if (p.cards >= p.maxCards) return doSuper(w);
  if (p.cards < p.def["ex-cost"]) { w.emit("sfx", p.x, p.y, "denied"); return; }
  const wp = w.content.weapons[p.weapons[p.weaponIdx]];
  if (!wp) return;
  p.cards -= p.def["ex-cost"];
  p.stats.exs++;
  p.exT = 0.3;
  p.iframes = Math.max(p.iframes, 0.25);
  const [ox, oy] = muzzle(p);
  const a = Math.atan2(p.aimY, p.aimX);
  const n = wp.kind === "homing" ? 4 : wp.kind === "spread" ? 7 : 1;
  for (let i = 0; i < n; i++) {
    const aa = wp.kind === "spread" ? a + (i - 3) * 0.22 : a + (i - (n - 1) / 2) * 0.35;
    const sp = wp.kind === "arc" ? 700 : 900;
    w.spawnProj(wp.ex, ox, oy, Math.cos(aa) * sp, Math.sin(aa) * sp + (wp.kind === "arc" ? 600 : 0), {
      hostile: false, homing: wp.kind === "homing" ? 6 : 0, gravity: wp.kind === "arc" ? 1600 : 0, rot: aa,
    });
  }
  p.vx -= p.facing * 200;
  w.emit("ex", ox, oy, wp.id);
  w.emit("shake", ox, oy, "", 6);
}

function doSuper(w: World) {
  const p = w.player;
  const s = w.content.supers[p.super];
  if (!s) return;
  p.cards = 0;
  p.stats.supers++;
  p.superKind = s.kind;
  w.emit("super", p.x, p.y, s.id, s.dur);
  w.emit("haptic", p.x, p.y, "super", 120);
  if (s.kind === "beam") {
    p.superT = s.dur;
    w.spawnProj("moon-beam", p.x + p.facing * 50, p.y + 70, 0, 0, { hostile: false, len: 1800, angle: p.facing > 0 ? 0 : Math.PI, r: 60, damage: s.damage, life: s.dur, pierce: true });
  } else if (s.kind === "invuln") {
    p.invulnT = s.dur;
  } else if (s.kind === "airdrop") {
    p.superT = 0.4;
    for (let i = 0; i < 12; i++) {
      const tx = w.left + 80 + ((w.right - w.left - 160) * (i + 0.5)) / 12;
      w.spawnProj("airdrop-crate", tx + w.range(-30, 30), w.ceiling + 80 + i * 70, 0, -300, { hostile: false, damage: s.damage, gravity: 1400, life: 4 });
    }
  }
}
