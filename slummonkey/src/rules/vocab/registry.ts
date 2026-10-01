// THE vocabulary. Every behaviour a boss, minion, level or stage can do is one word here.
// Rule: one word = one small function + one line of doc. Content (content/*.kdl) composes words;
// if something can't be said with these words, add a word here first. No boss-specific code anywhere.
import type { Ent, WordDef, WordFn, WordKind, WorldApi, WordCall } from "../types";
import { wait, until, num, str, pnum, pstr, pbool, resolveX, resolveY, anchor, angleTo, deg, easeInOut, facePlayer } from "./util";

export const WORDS: Record<string, WordDef> = {};
const word = (name: string, kind: WordKind, sig: string, doc: string, fn: WordFn) => {
  WORDS[name] = { name, kind, sig, doc, fn };
};

const GRAV = 2600;
const proj = (c: WordCall, i: number, d: string) => str(c, i, pstr(c, "proj", d));

// ───────────────────────────── FLOW ─────────────────────────────
word("loop", "flow", "[times:int] { words }", "Repeat the child words (forever if no count).", function* (w, me, c) {
  const n = num(c, 0, Infinity);
  for (let i = 0; i < n; i++) {
    const t0 = w.t;
    yield* w.run(me, c.children);
    if (w.t === t0) yield; // never spin a zero-time loop
  }
});
word("seq", "flow", "{ words }", "Run child words one after another.", function* (w, me, c) {
  yield* w.run(me, c.children);
});
word("par", "flow", "{ words }", "Run each child word at the same time; finish when all finish.", function* (w, me, c) {
  const fibers = c.children.map((ch) => w.fork(me, w.run(me, [ch]), w.phaseTag));
  while (fibers.some((f) => !f.done)) yield;
});
word("pick", "flow", "{ words w=weight }", "Run one child word chosen at random (prop w= weights it).", function* (w, me, c) {
  if (!c.children.length) return;
  const ws = c.children.map((ch) => (typeof ch.props.w === "number" ? (ch.props.w as number) : 1));
  let r = w.rand() * ws.reduce((a, b) => a + b, 0);
  let i = 0;
  while (i < ws.length - 1 && (r -= ws[i]) > 0) i++;
  const chosen = { ...c.children[i], props: { ...c.children[i].props } };
  delete chosen.props.w;
  yield* w.run(me, [chosen]);
});
word("wait", "flow", "secs:s", "Do nothing for a while.", function* (w, _me, c) {
  yield* wait(w, num(c, 0, 1));
});
word("every", "flow", "secs:s [first=s] { words }", "Start a background loop that runs the children every N seconds for the rest of the phase.", function* (w, me, c) {
  const s = num(c, 0, 2), first = pnum(c, "first", s);
  w.fork(me, (function* () {
    yield* wait(w, first);
    for (;;) { yield* w.run(me, c.children); yield* wait(w, s); }
  })(), w.phaseTag);
});
word("at-x", "flow", "x:px { words }", "Wait until the player reaches level x, then run the children (run-and-gun triggers).", function* (w, me, c) {
  const x = num(c, 0, 0);
  yield* until(() => w.player.x >= x);
  yield* w.run(me, c.children);
});
word("at-scroll", "flow", "x:px { words }", "Wait until the camera has scrolled to x, then run the children (shmup waves).", function* (w, me, c) {
  const x = num(c, 0, 0);
  yield* until(() => w.camX >= x);
  yield* w.run(me, c.children);
});
word("card", "flow", "text [sub=text] [dur=s]", "Show a title card banner (uses look/banners.css) and wait for it.", function* (w, me, c) {
  const d = pnum(c, "dur", 1.6);
  w.emit("card", me.x, me.y, `${str(c, 0, "")}|${pstr(c, "sub", "")}`, d);
  yield* wait(w, pbool(c, "block", true) ? d : 0);
});
word("theme", "flow", "id", "Switch the music theme (content/music.kdl).", function* (w, _me, c) {
  w.setTheme(str(c, 0, ""));
});
word("say", "flow", "who text [dur=s] [block=#false]", "Pop a speech bubble over the speaker (in-fight banter).", function* (w, me, c) {
  const d = pnum(c, "dur", 1.8);
  w.emit("say", me.x, me.y + me.h * me.scale, `${str(c, 0, "")}|${str(c, 1, "")}`, d, me.id);
  if (pbool(c, "block", false)) yield* wait(w, d);
});
word("sfx", "flow", "name", "Play a named sound effect at my position.", function* (w, me, c) {
  w.emit("sfx", me.x, me.y, str(c, 0, "pop"));
});
word("wait-clear", "flow", "[kind=minion] [max=s]", "Wait until every minion (or a given minion kind) is gone.", function* (w, _me, c) {
  const kind = pstr(c, "kind", "");
  yield* until(() => !w.ents().some((e) => e.kind === "minion" && e.alive && (!kind || e.def === kind)), pnum(c, "max", 120));
});
word("despawn", "flow", "", "Remove me from the stage quietly.", function* (_w, me) {
  me.alive = false;
  me.hp = 0;
  me.deadT = 99;
  yield;
});
word("win", "flow", "", "End the stage as a victory (level goals).", function* (w, me) {
  w.emit("win", me.x, me.y);
});

// ───────────────────────────── MOVEMENT ─────────────────────────────
word("move-to", "move", "x y [dur=s]", "Glide to a point (x/y may be player, left, right, center, random, far, near).", function* (w, me, c) {
  const x0 = me.x, y0 = me.y;
  const x1 = resolveX(w, c.args[0], me), y1 = resolveY(w, c.args[1], me);
  const d = pnum(c, "dur", num(c, 2, 1));
  if (x1 !== x0) me.facing = x1 < x0 ? -1 : 1;
  for (let t = 0; t < d; t += w.dt) {
    const k = easeInOut(Math.min(1, t / d));
    me.x = x0 + (x1 - x0) * k;
    me.y = y0 + (y1 - y0) * k;
    yield;
  }
  me.x = x1; me.y = y1;
});
word("patrol", "move", "x1 x2 speed [dur=s]", "Walk back and forth between two x positions.", function* (w, me, c) {
  const a = resolveX(w, c.args[0], me), b = resolveX(w, c.args[1], me), sp = num(c, 2, 200), d = pnum(c, "dur", 4);
  let dir = me.x < (a + b) / 2 ? 1 : -1;
  for (let t = 0; t < d; t += w.dt) {
    me.x += dir * sp * w.dt;
    me.facing = dir as 1 | -1;
    if (me.x > Math.max(a, b)) dir = -1;
    if (me.x < Math.min(a, b)) dir = 1;
    yield;
  }
});
word("hover", "move", "amp:px period:s [dur=s]", "Bob up and down in place.", function* (w, me, c) {
  const amp = num(c, 0, 20), per = num(c, 1, 1.5), d = pnum(c, "dur", num(c, 2, per * 2));
  const y0 = me.y;
  for (let t = 0; t < d; t += w.dt) { me.y = y0 + Math.sin((t / per) * Math.PI * 2) * amp; yield; }
  me.y = y0;
});
word("charge", "move", "speed:px/s [to=far]", "Dash across the stage toward the far wall (or a target x).", function* (w, me, c) {
  const sp = Math.abs(num(c, 0, 900));
  const tx = resolveX(w, c.props.to ?? "far", me);
  const dir = tx < me.x ? -1 : 1;
  me.facing = dir as 1 | -1;
  me.pose = "charge";
  w.mark(me, "charge");
  while ((tx - me.x) * dir > 0) {
    me.x += dir * sp * w.dt;
    me.squash = -0.08;
    if (w.rand() < 0.3) w.emit("particles", me.x - dir * me.w * 0.4, me.y + 6, "dust", 2);
    yield;
  }
  me.x = tx;
  me.squash = 0.2;
  me.pose = "idle";
  w.emit("shake", me.x, me.y, "", 6);
});
word("zip", "move", "speed:px/s [dur=s]", "Pinball around the stage, bouncing off walls, floor and ceiling.", function* (w, me, c) {
  const sp = num(c, 0, 900), d = pnum(c, "dur", num(c, 1, 4)), warn = pnum(c, "warn", 0.5);
  const a = deg(w.range(25, 55));
  const dir = w.player.x < me.x ? -1 : 1;
  let vx = Math.cos(a) * sp * dir, vy = Math.abs(Math.sin(a) * sp);
  if (warn > 0) {
    me.pose = "windup";
    w.emit("warn", me.x, me.y + 20, "beam", warn, Math.round((Math.atan2(vy, vx) * 180) / Math.PI));
    for (let t = 0; t < warn; t += w.dt) { me.squash = -0.3 * (t / warn); yield; }
  }
  const top = w.ceiling - me.h * me.scale;
  me.pose = "zip";
  w.mark(me, "zip");
  for (let t = 0; t < d; t += w.dt) {
    me.x += vx * w.dt; me.y += vy * w.dt;
    const hw = me.w * me.scale * 0.5;
    let bounced = false;
    if (me.x < w.left + hw) { me.x = w.left + hw; vx = Math.abs(vx); bounced = true; }
    if (me.x > w.right - hw) { me.x = w.right - hw; vx = -Math.abs(vx); bounced = true; }
    if (me.y < w.floor) { me.y = w.floor; vy = Math.abs(vy); bounced = true; }
    if (me.y > top) { me.y = top; vy = -Math.abs(vy); bounced = true; }
    me.facing = vx < 0 ? -1 : 1;
    me.rot += (vx > 0 ? -1 : 1) * 10 * w.dt;
    if (bounced) { me.squash = -0.35; w.emit("sfx", me.x, me.y, "boing"); w.emit("particles", me.x, me.y, "smoke", 3); }
    yield;
  }
  me.rot = 0;
  me.pose = "idle";
});
word("hop", "move", "height:px count:int [air=s]", "Jump toward the player a few times, landing with a thud.", function* (w, me, c) {
  const h = num(c, 0, 200), n = num(c, 1, 1), air = pnum(c, "air", 2 * Math.sqrt((2 * h) / GRAV));
  for (let i = 0; i < n; i++) {
    facePlayer(w, me);
    me.squash = -0.3;
    yield* wait(w, 0.12);
    const x0 = me.x, x1 = Math.max(w.left + me.w / 2, Math.min(w.right - me.w / 2, w.player.x));
    const vy0 = Math.sqrt(2 * GRAV * h);
    me.pose = "jump";
    for (let t = 0; t < air; t += w.dt) {
      const k = t / air;
      me.x = x0 + (x1 - x0) * k;
      me.y = w.floor + vy0 * t - 0.5 * GRAV * t * t;
      if (me.y < w.floor) me.y = w.floor;
      me.squash = 0.15;
      yield;
    }
    me.y = w.floor; me.squash = -0.35; me.pose = "idle";
    w.emit("shake", me.x, me.y, "", 8);
    w.emit("particles", me.x, me.y, "dust", 10);
    w.mark(me, "hop");
  }
});
word("orbit", "move", "radius:px speed:rad/s [dur=s]", "Circle around where I am now.", function* (w, me, c) {
  const r = num(c, 0, 80), sp = num(c, 1, 2), d = pnum(c, "dur", num(c, 2, 3));
  const cx = me.x, cy = me.y;
  for (let t = 0; t < d; t += w.dt) { me.x = cx + Math.cos(t * sp) * r - r; me.y = cy + Math.sin(t * sp) * r; yield; }
});
word("follow", "move", "speed:px/s [dur=s] [fly=#true]", "Chase the player's x (and y when flying).", function* (w, me, c) {
  const sp = num(c, 0, 200), d = pnum(c, "dur", num(c, 1, 3)), fly = pbool(c, "fly", me.gravity === 0 && me.y > w.floor + 1);
  for (let t = 0; t < d; t += w.dt) {
    const dx = w.player.x - me.x;
    me.x += Math.sign(dx) * Math.min(Math.abs(dx), sp * w.dt);
    if (fly) { const dy = w.player.y + 40 - me.y; me.y += Math.sign(dy) * Math.min(Math.abs(dy), sp * 0.6 * w.dt); }
    facePlayer(w, me);
    yield;
  }
});
word("teleport", "move", "x y", "Vanish in a puff and reappear somewhere else instantly.", function* (w, me, c) {
  w.emit("particles", me.x, me.y + me.h / 2, "smoke", 14);
  me.x = resolveX(w, c.args[0], me);
  me.y = resolveY(w, c.args[1], me);
  w.emit("particles", me.x, me.y + me.h / 2, "smoke", 14);
  w.emit("sfx", me.x, me.y, "poof");
  facePlayer(w, me);
  yield;
});
word("cartwheel", "move", "speed:px/s [dur=s]", "Roll along the floor spinning, bouncing off the walls.", function* (w, me, c) {
  const sp = num(c, 0, 600), d = pnum(c, "dur", num(c, 1, 3));
  let dir = w.player.x < me.x ? -1 : 1;
  me.pose = "cartwheel";
  w.mark(me, "cartwheel");
  for (let t = 0; t < d; t += w.dt) {
    me.x += dir * sp * w.dt;
    me.rot -= dir * (sp / (me.h * 0.5)) * w.dt;
    const hw = me.w * me.scale * 0.5;
    if (me.x < w.left + hw) { me.x = w.left + hw; dir = 1; w.emit("shake", me.x, me.y, "", 4); }
    if (me.x > w.right - hw) { me.x = w.right - hw; dir = -1; w.emit("shake", me.x, me.y, "", 4); }
    if (w.rand() < 0.2) w.emit("particles", me.x, me.y, "confetti", 1);
    yield;
  }
  me.rot = 0; me.pose = "idle";
});
word("climb", "move", "height:px speed:px/s", "Climb straight up (ropes, ladders, stacks).", function* (w, me, c) {
  const top = me.y + num(c, 0, 200), sp = num(c, 1, 120);
  me.pose = "climb";
  while (me.y < top) { me.y = Math.min(top, me.y + sp * w.dt); yield; }
  me.pose = "idle";
  w.mark(me, "climb");
});
word("drop", "move", "", "Fall to the floor under gravity and land with a bump.", function* (w, me) {
  let vy = 0;
  me.pose = "fall";
  while (me.y > w.floor) { vy -= GRAV * w.dt; me.y = Math.max(w.floor, me.y + vy * w.dt); yield; }
  me.squash = -0.4; me.pose = "idle";
  w.emit("particles", me.x, me.y, "dust", 8);
  w.emit("sfx", me.x, me.y, "thud");
});
word("face", "move", "", "Turn to face the player.", function* (w, me) { facePlayer(w, me); });
word("scroll", "move", "dx:px/s dy:px/s", "Set the camera auto-scroll speed (shmup, vertical climb); I travel with the camera.", function* (w, me, c) {
  w.setScroll(num(c, 0, 0), num(c, 1, 0));
  if (me.kind !== "director") me.vars.camLock = 1;
});
word("fly-path", "move", "shape [dur=s] [amp=px]", "Fly a shmup path: sine, dive, loop or straight (moves left across the camera).", function* (w, me, c) {
  const shape = str(c, 0, "sine"), d = pnum(c, "dur", 6), amp = pnum(c, "amp", 120), sp = pnum(c, "speed", 260);
  const y0 = me.y;
  for (let t = 0; t < d; t += w.dt) {
    me.x -= sp * w.dt;
    if (shape === "sine") me.y = y0 + Math.sin(t * 2.4) * amp;
    else if (shape === "dive") me.y = y0 - Math.min(1, t / 1.2) * (y0 - (w.player.y + 20));
    else if (shape === "loop") { me.y = y0 + Math.sin(t * 3) * amp; me.x += Math.cos(t * 3) * amp * 3 * w.dt; }
    me.facing = -1;
    yield;
  }
});

// ───────────────────────────── ATTACKS ─────────────────────────────
word("shoot", "attack", "proj speed [angle=deg] [from=front]", "Fire one projectile (at the player unless an angle is given).", function* (w, me, c) {
  const [x, y] = anchor(me, pstr(c, "from", "front"));
  const sp = num(c, 1, 500);
  const a = typeof c.props.angle === "number" ? deg(c.props.angle as number) : angleTo(x, y, w.player.x, w.player.y + w.player.h / 2);
  w.spawnProj(proj(c, 0, "pellet"), x, y, Math.cos(a) * sp, Math.sin(a) * sp, { owner: me.id });
  w.emit("sfx", x, y, "enemy-shot");
});
word("volley", "attack", "count spread:deg speed proj [from=]", "Fire a fan of projectiles aimed at the player.", function* (w, me, c) {
  const n = num(c, 0, 3), spr = deg(num(c, 1, 30)), sp = num(c, 2, 500);
  const [x, y] = anchor(me, pstr(c, "from", "front"));
  facePlayer(w, me);
  const base = angleTo(x, y, w.player.x, w.player.y + w.player.h / 2);
  for (let i = 0; i < n; i++) {
    const a = base + (n === 1 ? 0 : -spr / 2 + (spr * i) / (n - 1));
    w.spawnProj(proj(c, 3, "pellet"), x, y, Math.cos(a) * sp, Math.sin(a) * sp, { owner: me.id });
  }
  me.squash = 0.15;
  w.emit("sfx", x, y, "volley");
  w.mark(me, "volley");
});
word("spray", "attack", "dur:s arc:deg proj [rate=/s] [speed=] [burst=n] [pause=s]", "Sweep projectiles across an arc in bursts with jumpable gaps (trunks, hoses, card fans).", function* (w, me, c) {
  const d = num(c, 0, 1), arc = deg(num(c, 1, 90)), rate = pnum(c, "rate", 14), sp = pnum(c, "speed", 520);
  const burst = pnum(c, "burst", 3), pause = pnum(c, "pause", 0.3);
  let inBurst = 0, pauseT = 0;
  facePlayer(w, me);
  const [x0, y0] = anchor(me, pstr(c, "from", "trunk"));
  const base = angleTo(x0, y0, w.player.x, w.player.y + w.player.h / 2);
  let acc = 0;
  me.pose = "spray";
  for (let t = 0; t < d; t += w.dt) {
    if (pauseT > 0) { pauseT -= w.dt; yield; continue; }
    acc += rate * w.dt;
    while (acc >= 1) {
      acc--;
      if (++inBurst >= burst) { inBurst = 0; pauseT = pause; }
      const [x, y] = anchor(me, pstr(c, "from", "trunk"));
      const a = base - arc / 2 + arc * (t / d);
      w.spawnProj(proj(c, 2, "coin"), x, y, Math.cos(a) * sp, Math.sin(a) * sp, { owner: me.id });
    }
    yield;
  }
  me.pose = "idle";
  w.mark(me, "spray");
});
word("ring", "attack", "count speed proj [offset=deg]", "Burst projectiles out in a full circle.", function* (w, me, c) {
  const n = num(c, 0, 12), sp = num(c, 1, 400), off = deg(pnum(c, "offset", w.range(0, 30)));
  const [x, y] = anchor(me, pstr(c, "from", "mid"));
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * Math.PI * 2;
    w.spawnProj(proj(c, 2, "pellet"), x, y, Math.cos(a) * sp, Math.sin(a) * sp, { owner: me.id });
  }
  w.emit("sfx", x, y, "ring");
});
word("spiral", "attack", "arms dur:s [rate=/s] [speed=] [turn=deg/s] proj", "Spin out arms of projectiles like a pinwheel.", function* (w, me, c) {
  const arms = num(c, 0, 3), d = num(c, 1, 2), rate = pnum(c, "rate", 8), sp = pnum(c, "speed", 340), turn = deg(pnum(c, "turn", 120));
  let acc = 0, a0 = 0;
  for (let t = 0; t < d; t += w.dt) {
    a0 += turn * w.dt;
    acc += rate * w.dt;
    while (acc >= 1) {
      acc--;
      const [x, y] = anchor(me, pstr(c, "from", "mid"));
      for (let k = 0; k < arms; k++) {
        const a = a0 + (k / arms) * Math.PI * 2;
        w.spawnProj(proj(c, 2, "pellet"), x, y, Math.cos(a) * sp, Math.sin(a) * sp, { owner: me.id });
      }
    }
    yield;
  }
});
word("lob", "attack", "count proj [air=s] [spread=px] [gap=s]", "Throw arcing projectiles that land around the player.", function* (w, me, c) {
  const n = num(c, 0, 1), air = pnum(c, "air", 1.1), spread = pnum(c, "spread", 120), gap = pnum(c, "gap", 0.15);
  const g = pnum(c, "gravity", 1400);
  for (let i = 0; i < n; i++) {
    facePlayer(w, me);
    const [x, y] = anchor(me, pstr(c, "from", "top"));
    const tx = w.player.x + (n === 1 ? 0 : -spread / 2 + (spread * i) / (n - 1)) + w.range(-20, 20);
    const ty = w.floor + 20;
    const vx = (tx - x) / air, vy = (ty - y + 0.5 * g * air * air) / air;
    w.spawnProj(proj(c, 1, "bomb"), x, y, vx, vy, { owner: me.id, gravity: g });
    w.emit("sfx", x, y, "lob");
    me.squash = 0.2;
    if (gap > 0) yield* wait(w, gap);
  }
  w.mark(me, "lob");
});
word("rain", "attack", "count proj [width=px] [speed=] [gap=s] [warn=s]", "Drop projectiles from the ceiling across a strip around the player.", function* (w, me, c) {
  const n = num(c, 0, 6), width = pnum(c, "width", 600), sp = pnum(c, "speed", 420), gap = pnum(c, "gap", 0.18), warn = pnum(c, "warn", 0.5);
  const cx = Math.max(w.left + width / 2, Math.min(w.right - width / 2, w.player.x));
  const xs = Array.from({ length: n }, (_, i) => cx - width / 2 + (width * (i + 0.5)) / n + w.range(-20, 20));
  xs.sort(() => w.rand() - 0.5);
  for (const x of xs) {
    if (warn > 0) w.emit("warn", x, w.floor, "mark", warn);
  }
  if (warn > 0) yield* wait(w, warn);
  for (const x of xs) {
    w.spawnProj(proj(c, 1, "pellet"), x, w.ceiling + 40, 0, -sp, { owner: me.id });
    yield* wait(w, gap);
  }
  w.mark(me, "rain");
});
word("homing", "attack", "count proj [turn=deg/s] [speed=]", "Release projectiles that steer toward the player.", function* (w, me, c) {
  const n = num(c, 0, 2), turn = deg(pnum(c, "turn", 90)), sp = pnum(c, "speed", 300);
  for (let i = 0; i < n; i++) {
    const [x, y] = anchor(me, pstr(c, "from", "top"));
    const a = deg(90 + (i - (n - 1) / 2) * 30);
    w.spawnProj(proj(c, 1, "pigeon"), x, y, Math.cos(a) * sp, Math.sin(a) * sp, { owner: me.id, homing: turn, target: -1 });
    yield* wait(w, 0.12);
  }
  w.emit("sfx", me.x, me.y, "flap");
});
word("stomp", "attack", "windup:s count:int [proj=shockwave] [speed=]", "Raise up, slam the floor, and send shockwaves both ways along it.", function* (w, me, c) {
  const wind = num(c, 0, 0.6), n = num(c, 1, 1), sp = pnum(c, "speed", 520);
  for (let i = 0; i < n; i++) {
    me.pose = "stomp-up";
    w.emit("telegraph", me.x, me.y, "stomp", wind, me.id);
    for (let t = 0; t < wind; t += w.dt) { me.squash = 0.25 * (t / wind); yield; }
    me.pose = "stomp"; me.squash = -0.45;
    w.emit("shake", me.x, me.y, "", 14);
    w.emit("particles", me.x, w.floor, "dust", 16);
    w.emit("sfx", me.x, me.y, "stomp");
    const hw = me.w * me.scale * 0.5;
    w.spawnProj(pstr(c, "proj", "shockwave"), me.x - hw, w.floor, -sp, 0, { owner: me.id, ground: true });
    w.spawnProj(pstr(c, "proj", "shockwave"), me.x + hw, w.floor, sp, 0, { owner: me.id, ground: true });
    w.mark(me, "stomp");
    yield* wait(w, 0.35);
    me.pose = "idle";
  }
});
word("shockwave", "attack", "dir speed [proj=shockwave]", "Send one shockwave along the floor (dir -1 left, 1 right, 0 toward player).", function* (w, me, c) {
  let dir = num(c, 0, 0);
  if (dir === 0) dir = w.player.x < me.x ? -1 : 1;
  w.spawnProj(pstr(c, "proj", "shockwave"), me.x, w.floor, dir * num(c, 1, 500), 0, { owner: me.id, ground: true });
});
word("beam", "attack", "dur:s [warn=s] [angle=deg|player] [width=px] [proj=beam]", "Telegraph a thin line, then hold a long beam (lasers, water jets, rocket trails).", function* (w, me, c) {
  const d = num(c, 0, 1.2), warn = pnum(c, "warn", 0.7), width = pnum(c, "width", 40);
  const [x, y] = anchor(me, pstr(c, "from", "front"));
  const a = c.props.angle === "player" || c.props.angle == null ? angleTo(x, y, w.player.x, w.player.y + w.player.h / 2) : deg(c.props.angle as number);
  w.emit("warn", x, y, "beam", warn, Math.round((a * 180) / Math.PI));
  me.pose = "beam-charge";
  yield* wait(w, warn);
  me.pose = "beam";
  const p = w.spawnProj(pstr(c, "proj", "beam"), x, y, 0, 0, { owner: me.id, len: 2400, angle: a, r: width / 2, life: d, ox: x - me.x, oy: y - me.y });
  w.emit("shake", x, y, "", 10);
  w.emit("sfx", x, y, "beam");
  yield* wait(w, d);
  if (p) p.alive = false;
  me.pose = "idle";
  w.mark(me, "beam");
});
word("summon", "attack", "minion count [from=right|left|top|me|floor] [gap=s] [x=] [y=]", "Bring minions onto the stage (they run their own words from content).", function* (w, me, c) {
  const kind = str(c, 0, ""), n = num(c, 1, 1), from = pstr(c, "from", "me"), gap = pnum(c, "gap", 0.3);
  for (let i = 0; i < n; i++) {
    let x = me.x, y = me.y + me.h * me.scale * 0.6;
    if (from === "right") { x = w.right + 60; y = w.floor; }
    else if (from === "left") { x = w.left - 60; y = w.floor; }
    else if (from === "top") { x = w.range(w.left + 80, w.right - 80); y = w.ceiling + 40; }
    else if (from === "floor") { x = w.range(w.left + 80, w.right - 80); y = w.floor; }
    else if (from === "hat") { [x, y] = anchor(me, "hat"); }
    if (c.props.x != null) x = resolveX(w, c.props.x, me);
    if (c.props.y != null) y = resolveY(w, c.props.y, me);
    if (typeof c.props.dy === "number") y += (c.props.dy as number) * i;
    w.spawnMinion(kind, x, y, { tag: w.phaseTag });
    w.emit("particles", x, y, "sparkle", 5);
    if (gap > 0) yield* wait(w, gap);
  }
  w.mark(me, "summon");
});
word("juggle", "attack", "count proj dur:s [speed=]", "Juggle props over my head, then fling them at the player one by one.", function* (w, me, c) {
  const n = num(c, 0, 3), d = num(c, 2, 1.5), sp = pnum(c, "speed", 560);
  const ps = Array.from({ length: n }, () => w.spawnProj(proj(c, 1, "club"), me.x, me.y, 0, 0, { owner: me.id, life: d + 8 }));
  me.pose = "juggle";
  for (let t = 0; t < d; t += w.dt) {
    const [cx, cy] = anchor(me, "top");
    ps.forEach((p, i) => {
      if (!p) return;
      const a = t * 5 + (i / n) * Math.PI * 2;
      p.x = cx + Math.cos(a) * 60; p.y = cy + 50 + Math.abs(Math.sin(a)) * 90; p.vx = 0; p.vy = 0;
    });
    yield;
  }
  for (const p of ps) {
    if (!p || !p.alive) continue;
    const a = angleTo(p.x, p.y, w.player.x, w.player.y + w.player.h / 2);
    p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
    w.emit("sfx", p.x, p.y, "whoosh");
    yield* wait(w, 0.22);
  }
  me.pose = "idle";
  w.mark(me, "juggle");
});
word("graph-shot", "attack", "shape count proj [speed=] [len=px]", "Lay bullets along a chart curve (pump-dump, rug, moon) and send it sliding at the player.", function* (w, me, c) {
  const shape = str(c, 0, "pump-dump"), n = num(c, 1, 16), sp = pnum(c, "speed", 260), len = pnum(c, "len", 700);
  const [x0] = anchor(me, "front");
  const H = w.ceiling - w.floor;
  const f = (u: number) => {
    if (shape === "pump-dump") return u < 0.7 ? 0.15 + 0.75 * Math.pow(u / 0.7, 2) : 0.9 - ((u - 0.7) / 0.3) * 0.82;
    if (shape === "rug") return u < 0.8 ? 0.55 + Math.sin(u * 20) * 0.04 : 0.55 - ((u - 0.8) / 0.2) * 0.5;
    if (shape === "moon") return 0.1 + Math.pow(u, 3) * 0.85;
    return 0.5;
  };
  w.emit("warn", x0, w.floor, "graph", 0.6);
  yield* wait(w, 0.6);
  // gap in the curve the player can slip through
  const gapAt = Math.floor(w.range(0.25, 0.75) * n);
  const dir = w.player.x < x0 ? -1 : 1; // the chart slides toward the player
  const left = dir < 0 ? x0 - len : x0; // always drawn left-to-right like a real chart
  for (let i = 0; i < n; i++) {
    if (i === gapAt || i === gapAt + 1) continue;
    const u = i / (n - 1);
    const y = w.floor + 30 + f(u) * (H - 80);
    const up = i > 0 && f(u) >= f((i - 1) / (n - 1));
    w.spawnProj(up ? proj(c, 2, "candle-green") : pstr(c, "down", "candle-red"), left + u * len, y, dir * sp, 0, { owner: me.id });
  }
  w.emit("sfx", x0, w.floor, "chart");
  w.mark(me, "graph-shot");
});
word("candles", "attack", "count [warn=s] [red=0..1]", "Candlestick pillars erupt from the floor: red ones hurt, green ones are platforms.", function* (w, me, c) {
  const n = num(c, 0, 4), warn = pnum(c, "warn", 0.8), red = pnum(c, "red", 0.6);
  const span = w.right - w.left - 160;
  const xs = Array.from({ length: n }, (_, i) => w.left + 80 + (span * (i + 0.5)) / n + w.range(-30, 30));
  for (const x of xs) w.emit("warn", x, w.floor, "mark", warn);
  yield* wait(w, warn);
  for (const x of xs) {
    const isRed = w.rand() < red;
    const hgt = w.range(140, 300);
    if (isRed) w.spawnEnt("hazard", "candle-red", x, w.floor, { w: 50, h: hgt, hurts: true, ttl: 2.4, tag: w.phaseTag, puppet: "candle-red" });
    else w.addPlatform(x, w.floor + hgt, 110, { ttl: 3.5, puppet: "candle-green", tag: w.phaseTag, h: hgt });
    w.emit("particles", x, w.floor, "dust", 6);
  }
  w.emit("sfx", me.x, me.y, "candles");
  w.mark(me, "candles");
});

// ───────────────────────────── TELEGRAPHS ─────────────────────────────
word("drumroll", "telegraph", "dur:s", "Ta-da drumroll with a building shake: something big is coming.", function* (w, me, c) {
  const d = num(c, 0, 1);
  w.emit("drumroll", me.x, me.y, "", d);
  me.pose = "drumroll";
  for (let t = 0; t < d; t += w.dt) { me.squash = Math.sin(t * 40) * 0.05 * (t / d); yield; }
  me.squash = 0;
  w.mark(me, "drumroll");
});
word("windup", "telegraph", "dur:s [pose=name]", "Hold an anticipation pose (squash down) before an attack.", function* (w, me, c) {
  const d = num(c, 0, 0.5);
  me.pose = pstr(c, "pose", "windup");
  w.emit("telegraph", me.x, me.y, me.pose, d, me.id);
  for (let t = 0; t < d; t += w.dt) { me.squash = -0.2 * Math.min(1, t / d); yield; }
  me.squash = 0.15;
});
word("flash", "telegraph", "dur:s", "Flash bright white.", function* (w, me, c) {
  me.hitFlash = num(c, 0, 0.2);
  w.emit("flash", me.x, me.y, "", me.hitFlash, me.id);
});
word("warn-line", "telegraph", "axis:x|y pos [dur=s] [block=#true]", "Draw a danger stripe across the stage at a column or row.", function* (w, me, c) {
  const axis = str(c, 0, "x"), d = pnum(c, "dur", 0.8);
  const p = axis === "x" ? resolveX(w, c.args[1], me) : resolveY(w, c.args[1], me);
  w.emit("warn", axis === "x" ? p : w.camX, axis === "y" ? p : w.floor, "line-" + axis, d);
  if (pbool(c, "block", true)) yield* wait(w, d);
});
word("ground-mark", "telegraph", "x [dur=s] [block=#true]", "Paint a target circle on the floor where something will land.", function* (w, me, c) {
  const x = resolveX(w, c.args[0], me), d = pnum(c, "dur", num(c, 1, 0.6));
  w.emit("warn", x, w.floor, "mark", d);
  me.vars.markX = x;
  if (pbool(c, "block", true)) yield* wait(w, d);
});
word("spotlight", "telegraph", "[dur=s]", "Swing a stage spotlight onto me.", function* (w, me, c) {
  w.emit("spotlight", me.x, me.y, "", pnum(c, "dur", num(c, 0, 1)), me.id);
});
word("pose", "telegraph", "name", "Set my animation pose (see look/ and art/ for the frames).", function* (_w, me, c) {
  me.pose = str(c, 0, "idle");
  me.poseT = 0;
});
word("shake", "telegraph", "amount [dur=s]", "Shake the camera.", function* (w, me, c) {
  w.emit("shake", me.x, me.y, "", num(c, 0, 8));
});

// ───────────────────────────── STATE / ILLUSIONS ─────────────────────────────
word("vanish-under-sheet", "state", "dur:s [to=random|far]", "A silk sheet drops over me with a drumroll; I reappear somewhere else.", function* (w, me, c) {
  const d = num(c, 0, 2.5);
  w.emit("sheet", me.x, me.y, "drop", 0.5, me.id);
  w.emit("drumroll", me.x, me.y, "", Math.min(d, 1.4));
  yield* wait(w, 0.5);
  me.hidden = true; me.shootable = false; me.hurts = false;
  w.mark(me, "vanish");
  yield* wait(w, Math.max(0, d - 1));
  me.x = resolveX(w, c.props.to ?? "far", me);
  facePlayer(w, me);
  w.emit("sheet", me.x, me.y, "lift", 0.5, me.id);
  yield* wait(w, 0.5);
  me.hidden = false; me.shootable = true; me.hurts = true;
  w.emit("sfx", me.x, me.y, "ta-da");
  w.emit("particles", me.x, me.y + me.h / 2, "confetti", 20);
});
word("invisible", "state", "[alpha=0..1]", "Fade my body out (riders with keep-visible stay seen).", function* (w, me, c) {
  me.alpha = num(c, 0, 0);
  if (me.alpha < 0.1) w.mark(me, "invisible");
  yield* wait(w, pnum(c, "fade", 0));
});
word("appear", "state", "", "Become fully visible again.", function* (_w, me) { me.alpha = 1; me.hidden = false; });
word("invisible-trail", "state", "kind", "Leave footprints and dust as I move (the only way to track an invisible act).", function* (_w, me, c) {
  me.trail = str(c, 0, "powder");
});
word("shrink", "state", "scale", "Shrink (hitbox too).", function* (w, me, c) {
  const s = num(c, 0, 0.5);
  w.emit("particles", me.x, me.y + me.h * me.scale * 0.5, "smoke", 20);
  w.emit("sfx", me.x, me.y, "shrink");
  me.scale = s;
  w.mark(me, "shrink");
});
word("grow", "state", "scale", "Grow (hitbox too).", function* (w, me, c) {
  me.scale = num(c, 0, 1.5);
  w.emit("sfx", me.x, me.y, "grow");
});
word("split", "state", "{ part id hp= x= y= puppet= { words } }", "Come apart into pieces that each have their own HP and their own words.", function* (w, me, c) {
  me.hidden = true; me.shootable = false; me.hurts = false;
  const ids: number[] = [];
  for (const p of c.children.filter((k) => k.name === "part")) {
    const hp = typeof p.props.hp === "number" ? (p.props.hp as number) : 100;
    const x = resolveX(w, p.props.x ?? me.x - w.camX, me), y = resolveY(w, p.props.y ?? "floor", me);
    const part = w.spawnEnt("part", String(p.args[0] ?? "part"), x, y, {
      hp, maxHp: hp, puppet: String(p.props.puppet ?? p.args[0]), dmgTo: me.id, shootable: true, hurts: true,
      w: typeof p.props.w === "number" ? (p.props.w as number) : 120, h: typeof p.props.h === "number" ? (p.props.h as number) : 140,
      tag: w.phaseTag, facing: -1,
    });
    ids.push(part.id);
    w.fork(part, (function* () { for (;;) { const t0 = w.t; yield* w.run(part, p.children); if (w.t === t0) yield; } })(), w.phaseTag);
  }
  w.emit("particles", me.x, me.y + me.h / 2, "confetti", 30);
  w.emit("sfx", me.x, me.y, "split");
  w.mark(me, "split");
  yield* until(() => ids.every((id) => { const e = w.ent(id); return !e || e.hp <= 0; }));
  w.mark(me, "parts-down");
});
word("reassemble", "state", "[flip=#true]", "Pull my pieces back together (optionally upside down).", function* (w, me, c) {
  for (const e of w.ents()) if (e.kind === "part" && e.dmgTo === me.id) { e.alive = false; e.deadT = 99; }
  w.emit("particles", me.x, me.y + me.h / 2, "confetti", 30);
  me.hidden = false; me.shootable = true; me.hurts = true;
  me.flipY = pbool(c, "flip", false);
  w.emit("sfx", me.x, me.y, "reassemble");
  w.mark(me, "reassemble");
  yield* wait(w, 0.4);
});
word("mirror-copies", "state", "count { words-for-copies }", "Mirror panels spawn copies of me (they run the child words too); only the real me has a reflection.", function* (w, me, c) {
  const n = num(c, 0, 3);
  for (const e of w.ents()) if (e.kind === "decoy" && e.dmgTo === me.id) { e.alive = false; e.deadT = 99; }
  me.reflect = true;
  const slots = n + 1;
  const xs = Array.from({ length: slots }, (_, i) => w.left + 120 + ((w.right - w.left - 240) * i) / (slots - 1));
  const order = xs.map((x) => ({ x, r: w.rand() })).sort((a, b) => a.r - b.r).map((o) => o.x);
  me.x = order[0];
  for (let i = 1; i < slots; i++) {
    const d = w.spawnEnt("decoy", me.def, order[i], me.y, {
      puppet: me.puppet, w: me.w, h: me.h, scale: me.scale, dmgTo: me.id, shootable: true, hurts: true, hp: 1e9, maxHp: 1e9,
      tag: w.phaseTag, reflect: false, facing: -1, flipY: me.flipY,
    });
    if (c.children.length) w.fork(d, w.run(d, c.children), w.phaseTag);
  }
  w.emit("mirror", me.x, me.y, "spawn", n);
  w.emit("sfx", me.x, me.y, "mirror");
  w.mark(me, "mirror");
  yield* wait(w, 0.5);
});
word("swap-real", "state", "[dur=s]", "Shuffle me and my copies around (flash of mirrors).", function* (w, me, c) {
  const group = [me, ...w.ents().filter((e) => e.kind === "decoy" && e.dmgTo === me.id && e.alive)];
  const xs = group.map((e) => e.x).sort(() => w.rand() - 0.5);
  const from = group.map((e) => e.x);
  const d = pnum(c, "dur", 0.6);
  w.emit("mirror", me.x, me.y, "flash", d);
  // mid-swap everyone is a ghost in the glass: no contact damage, half visible
  for (const e of group) { e.hurts = false; e.alpha = 0.5; }
  for (let t = 0; t < d; t += w.dt) {
    const k = easeInOut(Math.min(1, t / d));
    group.forEach((e, i) => { e.x = from[i] + (xs[i] - from[i]) * k; e.y = me.y + Math.sin(k * Math.PI) * 60 * (i % 2 ? 1 : -0.4); });
    yield;
  }
  group.forEach((e, i) => { e.x = xs[i]; e.y = w.floor; e.alpha = 1; e.hurts = true; });
});
word("hide-under", "state", "count kind", "Hide under N pots/baskets spread across the floor.", function* (w, me, c) {
  const n = num(c, 0, 3), kind = str(c, 1, "matka");
  for (const e of w.ents()) if (e.kind === "pot" && e.dmgTo === me.id) { e.alive = false; e.deadT = 99; }
  me.hidden = true; me.shootable = false; me.hurts = false;
  const xs = Array.from({ length: n }, (_, i) => w.camX + (i - (n - 1) / 2) * 300);
  for (const x of xs) w.emit("warn", x, w.floor, "mark", 0.7);
  yield* wait(w, 0.7);
  for (let i = 0; i < n; i++) {
    const x = xs[i];
    // pots are props you can stand next to; only what comes out of them hurts
    const pot = w.spawnEnt("pot", kind, x, w.ceiling + 80, { puppet: kind, w: 150, h: 170, dmgTo: me.id, shootable: true, hurts: false, hp: 1e9, maxHp: 1e9, tag: w.phaseTag });
    pot.vars.slot = i;
    w.fork(pot, (function* () { let vy = 0; while (pot.y > w.floor) { vy -= GRAV * w.dt; pot.y = Math.max(w.floor, pot.y + vy * w.dt); yield; } pot.squash = -0.4; w.emit("shake", pot.x, pot.y, "", 6); })(), w.phaseTag);
  }
  w.mark(me, "hide");
  yield* wait(w, 0.7);
});
word("shuffle", "state", "swaps speed:swaps/s [ramp=x]", "Swap the pots around, faster each time.", function* (w, me, c) {
  const n = num(c, 0, 6);
  let sp = num(c, 1, 1.5);
  const ramp = pnum(c, "ramp", 1.15);
  const pots = w.ents().filter((e) => e.kind === "pot" && e.dmgTo === me.id && e.alive);
  if (pots.length < 2) return;
  w.mark(me, "shuffle");
  for (let i = 0; i < n; i++) {
    const a = pots[Math.floor(w.rand() * pots.length)];
    let b = a;
    while (b === a) b = pots[Math.floor(w.rand() * pots.length)];
    const ax = a.x, bx = b.x, d = 1 / sp;
    w.emit("sfx", (ax + bx) / 2, w.floor, "scrape");
    for (let t = 0; t < d; t += w.dt) {
      const k = easeInOut(Math.min(1, t / d));
      a.x = ax + (bx - ax) * k; b.x = bx + (ax - bx) * k;
      a.y = w.floor + Math.sin(k * Math.PI) * 40; b.y = w.floor;
      yield;
    }
    a.x = bx; b.x = ax; a.y = b.y = w.floor;
    sp *= ramp;
  }
});
word("reveal", "state", "[bombs=n] [bonus=kind]", "Lift the pots: some hold bombs, one holds a parryable bonus, and I pop out there.", function* (w, me, c) {
  const pots = w.ents().filter((e) => e.kind === "pot" && e.dmgTo === me.id && e.alive);
  if (!pots.length) return;
  const order = pots.slice().sort(() => w.rand() - 0.5);
  const nb = Math.min(pnum(c, "bombs", pots.length - 1), pots.length - 1);
  for (let i = 0; i < order.length; i++) {
    const pot = order[i];
    pot.pose = "lift"; pot.vy = 900;
    w.emit("sfx", pot.x, pot.y, "pot-lift");
    if (i < nb) {
      const a = angleTo(pot.x, pot.y, w.player.x, w.player.y);
      w.spawnProj(pstr(c, "proj", "bomb"), pot.x, pot.y + 60, Math.cos(a) * 260, 700, { owner: me.id, gravity: 1400 });
    } else {
      me.x = pot.x; me.y = w.floor; me.hidden = false; me.shootable = true;
      w.spawnEnt("pickup", pstr(c, "bonus", "laddoo"), pot.x, pot.y + 230, { parryable: true, w: 60, h: 60, ttl: 5, tag: w.phaseTag, puppet: pstr(c, "bonus", "laddoo") });
      w.mark(me, "reveal-bonus");
    }
    yield* wait(w, 0.18);
  }
  for (let t = 0; t < 0.6; t += w.dt) { for (const p of pots) p.y += p.vy * w.dt * (1 - t / 0.6); yield; }
  for (const p of pots) { p.alive = false; p.deadT = 99; }
});
word("stack", "state", "count [puppet=id]", "Stack up into one tall wobbly form (hits make it sway).", function* (w, me, c) {
  const n = num(c, 0, 3);
  me.puppet = pstr(c, "puppet", me.puppet + "-stack");
  me.h = me.h * Math.max(1, n * 0.75);
  me.hidden = false; me.shootable = true; me.hurts = true;
  me.vars.wobbly = 1;
  w.emit("particles", me.x, me.y + me.h / 2, "smoke", 20);
  w.mark(me, "stack");
});
word("topple", "state", "", "Fall apart in a heap (stacks, towers).", function* (w, me) {
  me.pose = "topple";
  w.emit("topple", me.x, me.y, me.puppet);
  w.emit("sfx", me.x, me.y, "crash");
  w.mark(me, "topple");
  yield* wait(w, 0.8);
});
word("puppet", "state", "id", "Swap my look to another puppet (transformations).", function* (w, me, c) {
  me.puppet = str(c, 0, me.puppet);
  if (typeof c.props.w === "number") me.w = c.props.w as number;
  if (typeof c.props.h === "number") me.h = c.props.h as number;
  w.emit("particles", me.x, me.y + me.h / 2, "smoke", 24);
});
word("target", "state", "id hp [x=] [y=] { words-on-destroy }", "Attach a shootable sub-part (rope, mirror); when it breaks, I run the children.", function* (w, me, c) {
  const hp = pnum(c, "hp", 40);
  const t = w.spawnEnt("target", str(c, 0, "rope"), me.x + pnum(c, "x", 0), me.y + pnum(c, "y", me.h), {
    hp, maxHp: hp, puppet: str(c, 0, "rope"), shootable: true, hurts: false, parent: me.id, offX: pnum(c, "x", 0), offY: pnum(c, "y", me.h),
    w: pnum(c, "w", 30), h: pnum(c, "h", 300), tag: w.phaseTag,
  });
  w.fork(me, (function* () {
    yield* until(() => t.hp <= 0 || !t.alive);
    w.emit("sfx", t.x, t.y, "snap");
    w.mark(me, "target-broken");
    yield* w.run(me, c.children);
  })(), w.phaseTag);
});
word("stun", "state", "dur:s [vuln=x]", "Get dizzy: stop moving/attacking and take extra damage for a while.", function* (w, me, c) {
  me.pose = "dizzy";
  me.vars.vuln = pnum(c, "vuln", 2);
  me.vars.stunned = 1;
  w.emit("particles", me.x, me.y + me.h, "stars", 6);
  yield* wait(w, num(c, 0, 2));
  me.vars.vuln = 1;
  me.vars.stunned = 0;
  me.pose = "idle";
});
word("rider", "state", "kind [keep-visible=#true] [y=px] { words }", "Put someone/something on top of me that follows me and runs its own words.", function* (w, me, c) {
  const kind = str(c, 0, "rider");
  for (const e of w.ents()) if (e.kind === "rider" && e.parent === me.id && e.def === kind) { e.alive = false; e.deadT = 99; }
  const r = w.spawnEnt("rider", kind, me.x, me.y + me.h * me.scale, {
    puppet: kind, parent: me.id, offX: pnum(c, "x", 0), offY: pnum(c, "y", me.h * 0.85), keepVisible: pbool(c, "keep-visible", false),
    w: pnum(c, "w", 70), h: pnum(c, "h", 80), hurts: false, shootable: false, tag: w.phaseTag,
  });
  if (c.children.length) w.fork(r, w.run(r, c.children), w.phaseTag);
  w.mark(me, "rider");
});

// ───────────────────────────── PARRY ─────────────────────────────
word("parryable", "parry", "[kind]", "Make me parryable: I turn --parry pink, and slapping me gives the player meter.", function* (w, me) {
  me.parryable = true;
  w.mark(me, "parryable");
});
word("parry-every", "parry", "n", "Every Nth projectile I fire is parryable (pink).", function* (_w, me, c) {
  me.vars.parryEvery = num(c, 0, 3);
  me.vars.parryCount = 0;
});
word("bonus", "parry", "kind [x=] [y=] [ttl=s]", "Float a parryable pink bonus in the air.", function* (w, me, c) {
  const x = resolveX(w, c.props.x ?? "center", me), y = resolveY(w, c.props.y ?? 260, me);
  w.spawnEnt("pickup", str(c, 0, "laddoo"), x, y, { parryable: true, w: 60, h: 60, ttl: pnum(c, "ttl", 6), puppet: str(c, 0, "laddoo"), tag: w.phaseTag });
});

// ───────────────────────────── STAGE ─────────────────────────────
word("platforms", "stage", "count y:px [x0=] [x1=] [w=px] [puppet=]", "Place a row of one-way platforms.", function* (w, _me, c) {
  const n = num(c, 0, 3), y = num(c, 1, 160), x0 = pnum(c, "x0", -420), x1 = pnum(c, "x1", 420), pw = pnum(c, "w", 160);
  for (let i = 0; i < n; i++) w.addPlatform(w.camX + (n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (n - 1)), w.floor + y, pw, { puppet: pstr(c, "puppet", "platform"), tag: pstr(c, "tag", "stage") });
});
word("rising-platforms", "stage", "gap:px [w=px] [puppet=]", "Keep spawning platforms above the camera as it climbs (Indian Rope Trick).", function* (w, me, c) {
  const gap = num(c, 0, 170), pw = pnum(c, "w", 170);
  let nextY = w.camY + 200, side = 1;
  w.fork(me, (function* () {
    for (;;) {
      while (nextY < w.camY + 520) {
        side = -side;
        w.addPlatform(w.camX + side * w.range(80, 330), nextY, pw, { puppet: pstr(c, "puppet", "rope-platform"), tag: w.phaseTag, ttl: 40 });
        nextY += gap;
      }
      yield;
    }
  })(), w.phaseTag);
  w.mark(me, "rising-platforms");
});
word("flood", "stage", "rate:px/s max:px", "Fill the stage with water from a pot that never empties (water hurts).", function* (w, me, c) {
  w.setWater(w.floor + num(c, 1, 200), num(c, 0, 30));
  w.emit("sfx", me.x, me.y, "gurgle");
  w.mark(me, "flood");
});
word("buoyant", "stage", "count [w=px]", "Float platforms that ride on the water surface.", function* (w, _me, c) {
  const n = num(c, 0, 3), pw = pnum(c, "w", 170);
  for (let i = 0; i < n; i++) {
    const p = w.addPlatform(w.left + 150 + ((w.right - w.left - 300) * i) / Math.max(1, n - 1), w.water + 10, pw, { puppet: "raft", tag: "stage" });
    p.vars.buoy = 1; p.vars.phase = i * 1.7;
  }
});
word("ride-platform", "stage", "kind speed:px/s [ride=#true]", "Spin a hazard across the floor whose top you can stand on; I ride it.", function* (w, me, c) {
  const kind = str(c, 0, "buzzsaw"), sp = num(c, 1, 260);
  const dir = me.x > w.camX ? -1 : 1;
  const x0 = dir > 0 ? w.left - 80 : w.right + 80;
  const saw = w.spawnEnt("hazard", kind, x0, w.floor, { puppet: kind, w: 200, h: 120, hurts: true, platform: true, tag: w.phaseTag });
  saw.vx = dir * sp;
  if (pbool(c, "ride", true)) { me.parent = saw.id; me.offX = 0; me.offY = saw.h; }
  w.emit("sfx", saw.x, saw.y, "buzzsaw");
  w.mark(me, "ride-platform");
  while ((dir > 0 ? saw.x < w.right + 120 : saw.x > w.left - 120)) { saw.x += saw.vx * w.dt; saw.rot -= dir * 6 * w.dt; yield; }
  me.parent = 0;
  me.x = dir > 0 ? w.right - me.w : w.left + me.w;
  me.y = w.floor;
  saw.alive = false; saw.deadT = 99;
});
word("clear-stage", "stage", "[tag=stage]", "Remove platforms, props and hazards from the stage.", function* (w, _me, c) {
  const tag = pstr(c, "tag", "");
  for (const e of w.ents()) if ((e.kind === "platform" || e.kind === "hazard" || e.kind === "prop") && (!tag || e.tag === tag)) { e.alive = false; e.deadT = 99; }
});
word("bg", "stage", "id", "Switch the painted background set (look/stages.css + art/stages).", function* (w, me, c) {
  w.emit("bg", me.x, me.y, str(c, 0, ""));
});
word("coins", "stage", "count [x=] [y=] [arc=px]", "Scatter fake-token coin pickups in an arc.", function* (w, me, c) {
  const n = num(c, 0, 5), x = resolveX(w, c.props.x ?? me.x - w.camX, me), y = resolveY(w, c.props.y ?? 120, me), arc = pnum(c, "arc", 60);
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0.5 : i / (n - 1);
    w.spawnEnt("pickup", "token", x + (u - 0.5) * n * 50, w.floor + y + Math.sin(u * Math.PI) * arc, { puppet: "token", w: 40, h: 40, tag: "coin" });
  }
});
word("goal", "stage", "x:px", "Put the finish banner at level x; reaching it wins the stage.", function* (w, me, c) {
  const x = num(c, 0, 1000);
  w.spawnEnt("prop", "goal", x, w.floor, { puppet: "goal", w: 120, h: 300, tag: "stage" });
  yield* until(() => w.player.x >= x);
  w.emit("win", x, w.floor);
});

/** Lookup helper used by the runner and the drift test. */
export const getWord = (name: string): WordDef | undefined => WORDS[name];
export const wordNames = () => Object.keys(WORDS);
