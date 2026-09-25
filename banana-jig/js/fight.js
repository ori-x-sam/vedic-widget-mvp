'use strict';
// Level 1: "Peel Out at the Big Top". Bongo vs Madame Tusk, three phases.
const TUNE = {
  run: 430, jump: 1030, grav: 2900, cutGrav: 3900, dash: 1080, dashT: .19, coyote: .09, buffer: .11, inv: 1.6,
  fire: .105, bullet: 1550, meterPerHit: 2.6, exDmg: 14, superDmg: 72,
  hp: 640, p2: 384, p3: 160
};
const BTN = {
  jump: { x: 1170, y: 620, r: 68, label: 'JUMP' },
  shoot: { x: 1024, y: 664, r: 50, label: 'FIRE' },
  dash: { x: 1046, y: 530, r: 46, label: 'DASH' },
  ex: { x: 1182, y: 466, r: 46, label: 'EX' },
  lock: { x: 896, y: 672, r: 36, label: 'LOCK' }
};
const hitCircleRect = (cx, cy, r, x0, y0, x1, y1) => { const nx = clamp(cx, x0, x1), ny = clamp(cy, y0, y1); return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r; };

G.scenes.fight = {
  enter() {
    BigTop.init();
    const maxHp = 3 + (G.save.charmOn ? 1 : 0);
    this.pl = { x: 230, y: GY, vx: 0, vy: 0, face: 1, ground: true, hp: maxHp, maxHp, inv: 0, dashT: 0, airDash: true, coyote: 0, buffer: 0, fireCd: 0, meter: 0, duck: false, parryT: 0, canParry: true, hurtT: 0, exLock: 0, slowT: 0, dead: false, deadT: 0, animT: 0, aim: { x: 1, y: 0 }, superT: 0, wasGround: true, jumpHeld: false };
    this.b = { hp: TUNE.hp, phase: 1, state: 'intro', st: 0, t: 0, bx: 980, x: 980, feetY: GY - 190, face: 1, pose: 'bow', flash: 0, idleT: 1, atk: 0, pcount: 0, sealT: 5, spinDir: 0, swing: 0, barY: -200, scale: 1, inv: true };
    Object.assign(this, { shots: [], eshots: [], puddles: [], waves: [], seals: [], monkeys: [], lights: [], t: 0, fightT: 0, cheer: 0, zoomT: 0, stats: { parries: 0, cards: 0 }, joy: null, bptr: {}, edge: {}, autoFire: true, dying: false, ko: 0, deathCard: 0, shadow: null, hitSfxT: 0, rain: [] });
    G.intensity = 0; AudioSys.play('fight');
  },
  exit() { G.intensity = 0; },
  onBlur() { if (!G.overlay && !this.pl.dead && this.b.state !== 'ko') openOverlay(PauseOverlay); },
  // ---------- input ----------
  btnAt(p) { let best = null, bd = 1e9; for (const k in BTN) { const b = BTN[k], d = Math.hypot(p.x - b.x, p.y - b.y); if (d < b.r * 1.3 && d < bd) { bd = d; best = k; } } return best; },
  press(k) { this.edge[k] = true; if (k === 'shoot') { this.autoFire = !this.autoFire; AudioSys.sfx('click'); } G.vibe(10); },
  onDown(p) {
    G.touch = true;
    const k = this.btnAt(p);
    if (k) { this.bptr[p.id] = k; this.press(k); return; }
    if (p.x < 640 && !this.joy) this.joy = { id: p.id, ox: p.x, oy: p.y, x: p.x, y: p.y };
  },
  onMove(p) {
    if (this.joy && this.joy.id === p.id) { this.joy.x = p.x; this.joy.y = p.y; const dx = p.x - this.joy.ox, dy = p.y - this.joy.oy, d = Math.hypot(dx, dy); if (d > 90) { this.joy.ox = p.x - dx / d * 90; this.joy.oy = p.y - dy / d * 90; } return; }
    if (this.bptr[p.id]) { const k = this.btnAt(p); if (k && k !== this.bptr[p.id] && k !== 'shoot') { this.bptr[p.id] = k; this.press(k); } }
  },
  onUp(p) { if (this.joy && this.joy.id === p.id) this.joy = null; delete this.bptr[p.id]; },
  held(k) { for (const id in this.bptr) if (this.bptr[id] === k) return true; return false; },
  readInput() {
    const K = G.keys, KP = G.pressed;
    let ax = (K.ArrowRight || K.KeyD ? 1 : 0) - (K.ArrowLeft || K.KeyA ? 1 : 0), ay = (K.ArrowDown || K.KeyS ? 1 : 0) - (K.ArrowUp || K.KeyW ? 1 : 0);
    if (this.joy) { const dx = (this.joy.x - this.joy.ox) / 60, dy = (this.joy.y - this.joy.oy) / 60; if (Math.hypot(dx, dy) > .28) { ax = clamp(ax + dx, -1, 1); ay = clamp(ay + dy, -1, 1); } }
    const e = this.edge; this.edge = {};
    return {
      ax, ay,
      jumpP: e.jump || KP.KeyZ || KP.Space || KP.KeyK, jumpH: this.held('jump') || K.KeyZ || K.Space || K.KeyK,
      dashP: e.dash || KP.KeyC || KP.KeyL || KP.ShiftRight, exP: e.ex || KP.KeyV || KP.KeyI,
      lock: this.held('lock') || K.ShiftLeft || K.KeyQ,
      fire: (G.touch && this.autoFire) || K.KeyX || K.KeyJ
    };
  },
  // ---------- boss geometry ----------
  bossFace() { return this.pl.x < this.b.x ? 1 : -1; },
  bossCircles() {
    const b = this.b, s = b.scale;
    if (b.phase === 1) return [{ x: b.bx, y: GY - 330, r: 92 }, { x: b.bx - 22 * b.face, y: GY - 424, r: 66 }, { x: b.bx, y: GY - 95, r: 92 }];
    return [{ x: b.x, y: b.feetY - 136 * s, r: 86 * s }, { x: b.x - 22 * b.face * s, y: b.feetY - 234 * s, r: 64 * s }];
  },
  contactCircles() {
    const b = this.b; if (b.state === 'ko' || b.state === 'intro') return [];
    if (b.phase === 1) return this.bossCircles();
    if (b.state === 'spin') return [];
    return this.bossCircles();
  },
  trunkTip(lx, ly) { const b = this.b; return { x: b.x + lx * b.face * b.scale, y: b.feetY + ly * b.scale }; },
  // ---------- update ----------
  update(dt) {
    this.t += dt;
    const inp = this.readInput();
    if (G.pressed.Escape || G.pressed.KeyP) { openOverlay(PauseOverlay); return; }
    if (G.debug && G.pressed.KeyN) this.damageBoss(this.b.phase === 1 ? this.b.hp - TUNE.p2 + 1 : this.b.phase === 2 ? this.b.hp - TUNE.p3 + 1 : this.b.hp, true);
    if (this.b.state !== 'intro' && this.b.state !== 'ko' && !this.pl.dead) this.fightT += dt;
    this.cheer = Math.max(0, this.cheer - dt); this.zoomT = Math.max(0, this.zoomT - dt); this.hitSfxT -= dt;
    this.updatePlayer(dt, inp);
    this.updateBoss(dt);
    this.updateShots(dt);
    if (this.pl.dead) { this.pl.deadT += dt; this.pl.y -= 70 * dt; if (this.pl.deadT > 1.2 && !this.deathCard) { this.deathCard = .001; } }
    if (this.deathCard) this.deathCard += dt;
  },
  updatePlayer(dt, inp) {
    const p = this.pl, b = this.b;
    p.animT += dt; p.inv = Math.max(0, p.inv - dt); p.fireCd -= dt; p.slowT = Math.max(0, p.slowT - dt);
    if (p.dead) return;
    const locked = b.state === 'intro' && b.st < 1.3;
    if (locked || b.state === 'ko') { p.vx = 0; inp = { ax: 0, ay: 0 }; if (b.state === 'ko') { p.pose = 'win'; this.applyGravity(p, dt, false); return; } }
    if (p.superT > 0) { p.superT -= dt; p.pose = 'win'; p.vx = 0; this.applyGravity(p, dt, false); return; }
    if (p.hurtT > 0) { p.hurtT -= dt; p.pose = 'hurt'; p.x += p.vx * dt; p.vx *= 1 - 4 * dt; this.applyGravity(p, dt, false); this.bounds(p); return; }
    // buffers
    if (inp.jumpP) p.buffer = TUNE.buffer; else p.buffer -= dt;
    if (p.ground) { p.coyote = TUNE.coyote; p.airDash = true; p.canParry = true; } else p.coyote -= dt;
    const sx = Math.abs(inp.ax) > .35 ? Math.sign(inp.ax) : 0, sy = inp.ay < -.45 ? -1 : inp.ay > .55 ? 1 : 0;
    // dash
    if (inp.dashP && p.dashT <= 0 && (p.ground || p.airDash) && p.exLock <= 0) {
      p.dashT = TUNE.dashT; if (!p.ground) p.airDash = false; if (sx) p.face = sx; p.vy = 0; AudioSys.sfx('dash');
      FX.puff(p.x - p.face * 20, p.y - 40, 4, { dir: p.face < 0 ? 0 : Math.PI, spread: .4, r0: 6, r1: 12 });
    }
    if (p.dashT > 0) {
      p.dashT -= dt; p.vx = p.face * TUNE.dash; p.x += p.vx * dt; p.pose = 'dash';
      if (G.frame % 2 === 0) FX.add({ type: 'smear', x: p.x - p.face * 30, y: p.y - 55, vx: 0, vy: 0, r: 26, life: .2 });
      this.bounds(p); if (p.dashT <= 0 && !p.ground) p.vy = 0; return;
    }
    // jump
    if (p.buffer > 0 && p.coyote > 0 && p.exLock <= 0) {
      p.vy = -TUNE.jump; p.ground = false; p.coyote = 0; p.buffer = 0; p.jumpHeld = true; p.canParry = true; p.jumpT = 0;
      AudioSys.sfx('jump'); FX.puff(p.x, GY - 4, 3, { dir: -Math.PI / 2, spread: 1.4, sp0: 20, sp1: 80, r0: 5, r1: 10 });
    } else if (inp.jumpP && !p.ground && p.canParry && p.parryT <= 0) { p.parryT = .24; p.buffer = 0; }
    if (!inp.jumpH) p.jumpHeld = false;
    // horizontal
    p.duck = p.ground && !inp.lock && sy === 1;
    const spd = TUNE.run * (p.slowT > 0 ? .5 : 1);
    if (p.exLock > 0) { p.exLock -= dt; p.vx = 0; }
    else if (inp.lock || p.duck) p.vx = 0;
    else p.vx = sx * spd;
    if (sx && p.exLock <= 0) p.face = sx;
    p.x += p.vx * dt;
    this.applyGravity(p, dt, p.jumpHeld);
    this.bounds(p);
    // aim
    let ax = 0, ay = 0;
    if (inp.lock) { ax = sx; ay = sy; if (!ax && !ay) ax = p.face; if (ay === 1 && !ax && p.ground) ax = p.face; }
    else if (p.duck) { ax = p.face; }
    else { ax = sx || (sy ? 0 : p.face); ay = sy; if (sy === 1 && p.ground) { ay = 0; ax = p.face; } }
    const l = Math.hypot(ax, ay) || 1; p.aim = { x: ax / l, y: ay / l };
    if (ax) p.face = Math.sign(ax);
    // pose
    p.parryT = Math.max(0, p.parryT - dt);
    if (p.parryT > 0) { p.pose = 'parry'; this.checkParry(); if (p.parryT <= 0) p.canParry = false; }
    else if (!p.ground) p.pose = p.vy < 0 ? 'jump' : 'fall';
    else if (p.duck) p.pose = 'duck';
    else if (p.vx) p.pose = 'run';
    else p.pose = 'idle';
    // shoot / EX / super
    const canAct = b.state !== 'intro' || b.st > 1.3;
    if (canAct && inp.exP && p.exLock <= 0) {
      if (p.meter >= 500) this.doSuper();
      else if (p.meter >= 100) this.doEX();
    }
    if (canAct && inp.fire && p.fireCd <= 0 && p.exLock <= 0 && p.parryT <= 0) {
      p.fireCd = TUNE.fire;
      const hy = p.duck ? p.y - 34 : p.y - 66;
      const ox = p.x + p.aim.x * 40, oy = hy + p.aim.y * 36, spr = rand(-.035, .035), a = Math.atan2(p.aim.y, p.aim.x) + spr;
      this.shots.push({ x: ox, y: oy, vx: Math.cos(a) * TUNE.bullet, vy: Math.sin(a) * TUNE.bullet, a });
      if (G.frame % 2 === 0) FX.add({ type: 'smoke', x: ox, y: oy, vx: 0, vy: 0, r: 6, life: .12, col: C.cream });
      AudioSys.sfx('shoot', .8);
    }
    p.gun = canAct && inp.fire && p.parryT <= 0 && p.pose !== 'dash';
  },
  applyGravity(p, dt, holding) {
    const g = TUNE.grav + (!holding && p.vy < 0 ? TUNE.cutGrav : 0);
    p.vy += g * dt; p.y += p.vy * dt;
    if (p.y >= GY) {
      if (!p.ground && p.vy > 300) { AudioSys.sfx('land'); FX.puff(p.x, GY - 2, 3, { dir: -Math.PI / 2, spread: 1.6, sp0: 20, sp1: 90, r0: 5, r1: 9 }); p.landT = .1; }
      p.y = GY; p.vy = 0; p.ground = true;
    } else p.ground = false;
  },
  bounds(p) { p.x = clamp(p.x, 36, 1244); },
  playerBox() { const p = this.pl, top = p.duck ? 58 : 98; return [p.x - 20, p.y - top, p.x + 20, p.y - 4]; },
  hurtPlayer(srcX) {
    const p = this.pl; if (p.inv > 0 || p.dashT > 0 || p.superT > 0 || p.dead || this.b.state === 'ko') return false;
    p.hp--; p.inv = TUNE.inv; p.hurtT = .32; p.vy = -560; p.vx = (p.x < srcX ? -1 : 1) * 320; p.parryT = 0;
    G.freeze(.07); G.addShake(.45); G.vibe(70); AudioSys.sfx('hurt'); FX.ink(p.x, p.y - 60, 12); FX.stars(p.x, p.y - 70, 5, C.cream);
    if (p.hp <= 0) this.die();
    return true;
  },
  die() {
    const p = this.pl; p.dead = true; p.deadT = 0; p.hurtT = 0; AudioSys.stopMusic(); AudioSys.sfx('death'); G.freeze(.25);
  },
  checkParry() {
    const p = this.pl, cx = p.x, cy = p.y - 50;
    for (const s of this.eshots) {
      if (!s.pink || s.dead) continue;
      if (Math.hypot(s.x - cx, s.y - cy) < (s.r || 16) + 46) {
        s.dead = true; p.parryT = 0; p.canParry = true; p.airDash = true; p.vy = -880;
        p.meter = Math.min(500, p.meter + 100); this.stats.parries++; this.cheer = 1.2;
        G.freeze(.15); G.addShake(.2); G.vibe(30); AudioSys.sfx('parry'); AudioSys.sfx('card');
        FX.stars(s.x, s.y, 8, C.pink); FX.add({ type: 'ring', x: s.x, y: s.y, vx: 0, vy: 0, r: 20, grow: 70, life: .3, col: C.pink });
        return;
      }
    }
  },
  doEX() {
    const p = this.pl; p.meter -= 100; this.stats.cards++; p.exLock = .22; AudioSys.sfx('ex'); AudioSys.sfx('card'); G.addShake(.15);
    const dir = p.aim.x || p.face;
    this.shots.push({ boom: true, x: p.x + dir * 40, y: (p.duck ? p.y - 36 : p.y - 70), vx: dir * 1150, vy: p.aim.y * 600, t: 0, hitA: false, hitB: false, rot: 0 });
    FX.puff(p.x + dir * 40, p.y - 66, 5, { dir: dir > 0 ? 0 : Math.PI, spread: .6 });
  },
  doSuper() {
    const p = this.pl; p.meter = 0; this.stats.cards += 5; p.superT = 1.2; p.inv = Math.max(p.inv, 2.6); this.zoomT = .6; this.cheer = 2.5;
    G.freeze(.25); G.addShake(.6); AudioSys.sfx('super');
    for (let i = 0; i < 9; i++) this.monkeys.push({ x: -80 - i * 110 - rand(0, 40), y: GY - rand(0, 30), sp: rand(820, 960), hit: false, fur: pick([C.brown, '#8a5a36', '#5a3a26', '#9a6a40']), vest: pick([C.red, C.teal, C.mustard]), ph: rand(0, 1) });
  },
  damageBoss(n, force) {
    const b = this.b; if ((b.inv && !force) || b.state === 'ko') return;
    b.hp = Math.max(0, b.hp - n); b.flash = .06;
    this.pl.meter = Math.min(500, this.pl.meter + (force ? 0 : n * TUNE.meterPerHit * (n > 3 ? .3 : 1)));
    if (b.phase === 1 && b.hp <= TUNE.p2) this.toPhase2();
    else if (b.phase === 2 && b.hp <= TUNE.p3) this.toPhase3();
    else if (b.hp <= 0) this.knockout();
  },
  setState(s, pose) { this.b.state = s; this.b.st = 0; if (pose) this.b.pose = pose; },
  toPhase2() {
    const b = this.b; b.phase = 2; b.x = b.bx; b.inv = true; this.setState('pop', 'pop'); b.vy = -600; b.feetY = GY - 190;
    this.eshots.length = 0; this.puddles.length = 0; G.intensity = 1; this.cheer = 2;
    G.freeze(.18); G.addShake(.8); AudioSys.sfx('pop'); AudioSys.sfx('honk'); FX.confetti(b.bx, GY - 95, 40); FX.puff(b.bx, GY - 95, 12, { r0: 14, r1: 28, sp1: 300 });
  },
  toPhase3() {
    const b = this.b; b.phase = 3; b.inv = true; this.setState('toP3', 'angry'); this.eshots.length = 0; this.waves.length = 0;
    for (const s of this.seals) s.leaving = true;
    G.intensity = 2; this.cheer = 2; G.addShake(.5); AudioSys.sfx('honk'); b.barY = -120; b.startX = b.x;
  },
  knockout() {
    const b = this.b; this.setState('ko', 'pop'); b.inv = true; this.ko = .001; this.koT = 0;
    this.eshots.length = 0; this.waves.length = 0; this.puddles.length = 0; for (const s of this.seals) s.leaving = true;
    G.freeze(.45); G.addShake(1); G.vibe(120); AudioSys.stopMusic(); AudioSys.sfx('knockout'); AudioSys.sfx('cheer'); this.cheer = 5;
    b.koX = b.x; b.koY = b.feetY; FX.stars(b.x, b.feetY - 200, 14, C.mustard);
  },
  updateBoss(dt) {
    const b = this.b, p = this.pl; b.t += dt; b.st += dt; b.flash = Math.max(0, b.flash - dt);
    if (b.state !== 'spin' && b.state !== 'ko') b.face = this.bossFace();
    if (b.phase === 1) this.bossP1(dt);
    else if (b.phase === 2) this.bossP2(dt);
    else this.bossP3(dt);
    // contact damage
    if (!p.dead) {
      const box = this.playerBox();
      for (const c of this.contactCircles()) if (hitCircleRect(c.x, c.y, c.r * .92, ...box)) { this.hurtPlayer(c.x); break; }
      if (b.state === 'spin') { const x0 = b.x - 92, x1 = b.x + 92; if (box[2] > x0 && box[0] < x1 && box[1] < GY - 80 && box[3] > GY - 300) this.hurtPlayer(b.x); }
    }
    this.updateSeals(dt);
  },
  nextIdle(a, b) { this.b.idleT = rand(a, b); this.setState('idle'); },
  bossP1(dt) {
    const b = this.b, p = this.pl;
    b.bx = 965 + 150 * Math.sin(b.t * .55); b.x = b.bx; b.feetY = GY - 190; b.ballRot = -b.bx / 92;
    switch (b.state) {
      case 'intro':
        b.pose = b.st < 1.1 ? 'bow' : 'idle';
        if (b.st > .3 && b.st - dt <= .3) AudioSys.sfx('ready');
        if (b.st > 1.3 && b.st - dt <= 1.3) { AudioSys.sfx('go'); this.cheer = 1; }
        if (b.st > 2) { b.inv = false; this.nextIdle(.4, .6); }
        break;
      case 'idle': b.pose = 'idle'; if (b.st > b.idleT) { const seq = ['water', 'peanut', 'peanut', 'water', 'peanut', 'water']; const a = seq[b.atk++ % seq.length]; this.setState(a === 'water' ? 'wind' : 'cheeks', a === 'water' ? 'wind' : 'cheeks'); AudioSys.sfx(a === 'water' ? 'honk' : 'warn'); } break;
      case 'wind': if (b.st > .62) this.setState('spray', 'spray'); break;
      case 'spray': {
        const n = Math.floor(b.st / .11); if (n < 3 && !b['s' + n]) {
          b['s' + n] = true; const tip = this.trunkTip(-190, -262), T = 1.05, g = 1500, tx = clamp(p.x + (n - 1) * 120, 60, 1220);
          this.eshots.push({ type: 'blob', x: tip.x, y: tip.y, vx: (tx - tip.x) / T, vy: (GY - tip.y - .5 * g * T * T) / T, g, r: 16 }); AudioSys.sfx('splash');
        }
        if (b.st > .8) { b.s0 = b.s1 = b.s2 = false; this.nextIdle(.8, 1.2); }
        break;
      }
      case 'cheeks': if (b.st > .5) { this.setState('toss', 'toss'); b.vol = 0; } break;
      case 'toss':
        if ((b.vol === 0 && b.st > 0) || (b.vol === 1 && b.st > .5 && b.hp < 520)) {
          b.vol++; const tip = this.trunkTip(-178, -196), a0 = Math.atan2(p.y - 60 - tip.y, p.x - tip.x);
          for (const da of [-.2, 0, .2]) { b.pcount++; const pink = b.pcount % 3 === 0, a = a0 + da; this.eshots.push({ type: 'peanut', x: tip.x, y: tip.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 16, pink, rot: 0 }); }
          AudioSys.sfx('throw'); FX.puff(tip.x, tip.y, 3, { r0: 6, r1: 10 });
        }
        if (b.st > 1.1) this.nextIdle(.8, 1.3);
        break;
    }
  },
  bossP2(dt) {
    const b = this.b, p = this.pl, low = b.hp < 280;
    switch (b.state) {
      case 'pop':
        b.vy += 2400 * dt; b.feetY += b.vy * dt; b.pose = 'pop';
        if (b.feetY >= GY) { b.feetY = GY; if (b.vy > 300) { b.vy = -b.vy * .35; G.addShake(.4); AudioSys.sfx('stomp'); FX.puff(b.x, GY, 8, { dir: -Math.PI / 2, spread: 1.5, r0: 10, r1: 20 }); } else b.vy = 0; }
        if (b.st > 1.1) { this.setState('angry', 'angry'); AudioSys.sfx('honk'); }
        break;
      case 'angry':
        if (G.frame % 6 === 0) FX.puff(b.x + rand(-40, 40), b.feetY - 300, 1, { dir: -Math.PI / 2, spread: .4, col: C.white, r0: 8, r1: 14 });
        if (b.st > 1.2) { b.inv = false; this.nextIdle(.3, .5); }
        break;
      case 'idle': {
        b.pose = 'idle';
        const home = 1010; b.x += clamp(home - b.x, -180 * dt, 180 * dt);
        if (b.st > b.idleT) { const seq = ['stomp', 'spin', 'stomp', 'stomp', 'spin']; const a = seq[b.atk++ % seq.length]; if (a === 'stomp') { this.setState('stompUp', 'stompUp'); AudioSys.sfx('warn'); } else { this.setState('spinUp', 'spin'); AudioSys.sfx('honk'); } b.stomps = 0; }
        break;
      }
      case 'stompUp': if (b.st > (b.stomps ? .45 : .7)) { this.setState('stompDown', 'stompDown'); this.stomp(); } break;
      case 'stompDown':
        if (b.st > .5) { b.stomps++; if (low && b.stomps < 2) { this.setState('stompUp', 'stompUp'); AudioSys.sfx('warn'); } else this.nextIdle(.7, 1.1); }
        break;
      case 'spinUp': b.pose = 'spin'; if (b.st > .8) { this.setState('spin', 'spin'); b.spinDir = p.x < b.x ? -1 : 1; b.spinTarget = b.spinDir < 0 ? 170 : 1110; b.passes = 0; } break;
      case 'spin': {
        b.pose = 'spin'; const sp = low ? 940 : 820;
        b.x += b.spinDir * sp * dt; if (G.frame % 3 === 0) FX.puff(b.x, GY - 6, 1, { dir: -Math.PI / 2, spread: 1, r0: 6, r1: 12 });
        if ((b.spinDir < 0 && b.x <= b.spinTarget) || (b.spinDir > 0 && b.x >= b.spinTarget)) {
          b.x = b.spinTarget; b.passes++;
          if (b.x > 600 && b.passes >= 1) { this.nextIdle(.8, 1.1); }
          else { b.spinDir *= -1; b.spinTarget = b.spinDir < 0 ? 170 : 1010; this.setState('spinPause', 'spin'); }
        }
        break;
      }
      case 'spinPause': if (b.st > .45) { b.state = 'spin'; b.st = 0; } break;
    }
    // seals in phase 2
    if (b.state !== 'pop' && b.state !== 'angry') { b.sealT -= dt; if (b.sealT <= 0 && !this.seals.length) { b.sealT = rand(7, 9); this.seals.push({ x: -80, hp: 5, st: 0, tosses: 0, t: 0, flash: 0, face: 1, pose: 'slide' }); } }
  },
  stomp() {
    const b = this.b; G.addShake(.45); AudioSys.sfx('stomp'); G.vibe(25);
    const dir = this.pl.x < b.x ? -1 : 1;
    this.waves.push({ x: b.x + dir * 90, vx: dir * 760, h: 50 });
    FX.puff(b.x + dir * 60, GY - 4, 8, { dir: -Math.PI / 2, spread: 1.4, r0: 10, r1: 22 });
  },
  bossP3(dt) {
    const b = this.b, p = this.pl, L = 260, s = .8; b.scale = s;
    const pivotX = 640, pivotY = -70;
    const placeOnBar = () => { const a = .9 * Math.sin(b.swing * 1.15); b.barX = pivotX + Math.sin(a) * L; b.barY = pivotY + Math.cos(a) * L; b.ang = a; };
    switch (b.state) {
      case 'toP3':
        b.pose = b.st < 1 ? 'angry' : 'wind'; b.barY = lerp(-120, pivotY + L, clamp(b.st / .9, 0, 1)); b.barX = pivotX;
        if (b.st > 1.2) { this.setState('jumpBar', 'pop'); b.jx = b.x; b.jy = b.feetY; b.swing = 0; AudioSys.sfx('jump'); }
        break;
      case 'jumpBar': {
        placeOnBar(); const k = clamp(b.st / .7, 0, 1), tx = b.barX, ty = b.barY + 352 * s;
        b.x = lerp(b.jx, tx, ease.inOut(k)); b.feetY = lerp(b.jy, ty, k) - Math.sin(k * Math.PI) * 160;
        if (k >= 1) { b.inv = false; this.lights = [{ ph: 0 }, { ph: Math.PI }]; this.nextIdle(.8, 1); }
        break;
      }
      case 'idle': case 'tears': case 'rain': {
        b.swing += dt; placeOnBar(); b.x = b.barX; b.feetY = b.barY + 352 * s; b.pose = 'hang';
        if (b.state === 'idle' && b.st > b.idleT) {
          const seq = ['tears', 'swoop', 'tears', 'tears', 'swoop']; const a = seq[b.atk++ % seq.length];
          if (a === 'tears') { this.setState('tears', 'hang'); AudioSys.sfx('warn'); }
          else { this.setState('aim', 'hang'); this.shadow = { x: clamp(p.x, 120, 1160), t: 0 }; AudioSys.sfx('honk'); }
        }
        if (b.state === 'tears' && b.st > .45) { this.startRain(); this.setState('rain', 'hang'); }
        if (b.state === 'rain' && b.st > 1.5) this.nextIdle(.6, .9);
        break;
      }
      case 'aim': {
        b.pose = 'hang'; this.shadow.t = b.st;
        if (b.st > .9) { this.setState('dive', 'swoop'); b.fromX = b.x; b.fromY = b.feetY; AudioSys.sfx('throw'); }
        break;
      }
      case 'dive': { const k = ease.inCubic(clamp(b.st / .26, 0, 1)); b.x = lerp(b.fromX, this.shadow.x, k); b.feetY = lerp(b.fromY, GY - 20, k); if (k >= 1) { this.setState('ground', 'swoop'); G.addShake(.5); AudioSys.sfx('stomp'); FX.puff(b.x, GY - 6, 10, { dir: -Math.PI / 2, spread: 1.5, r0: 10, r1: 22 }); } break; }
      case 'ground': if (b.st > .45) { this.setState('rise', 'hang'); b.fromX = b.x; b.fromY = b.feetY; this.shadow = null; } break;
      case 'rise': {
        const k = ease.inOut(clamp(b.st / .6, 0, 1)); placeOnBar();
        b.x = lerp(b.fromX, b.barX, k); b.feetY = lerp(b.fromY, b.barY + 352 * s, k);
        if (k >= 1) this.nextIdle(.6, 1);
        break;
      }
      case 'ko': this.updateKO(dt); return;
    }
    // spotlights
    for (const l of this.lights) {
      l.x = 640 + 470 * Math.sin(b.t * .42 + l.ph);
      if (!p.dead && Math.abs(p.x - l.x) < 70) { if (p.slowT <= 0) { AudioSys.sfx('slow'); } p.slowT = .7; }
    }
  },
  startRain() {
    const gap = rand(200, 1080);
    for (let x = 50; x < 1260; x += 84) {
      if (Math.abs(x - gap) < 130) continue;
      this.eshots.push({ type: 'tear', x: x + rand(-10, 10), y: -30 - rand(0, 220), vx: 0, vy: 460 + rand(0, 80), r: 13, pink: Math.random() < .14, g: 0 });
    }
    this.gapX = gap; this.gapT = 1.4;
  },
  updateKO(dt) {
    const b = this.b; this.koT += dt; const k = this.koT;
    if (k < 2.4) { // deflating balloon loop around the tent
      const a = k * 4.2; b.x = 640 + Math.cos(a) * 420 * (1 - k / 3); b.feetY = 360 + Math.sin(a * 1.3) * 180; b.scale = lerp(.8, .45, k / 2.4); b.pose = 'pop';
      if (G.frame % 2 === 0) FX.puff(b.x, b.feetY - 120 * b.scale, 1, { col: C.white, r0: 6, r1: 12, sp0: 10, sp1: 40 });
    } else { b.pose = 'ko'; b.scale = .6; b.x = lerp(b.x, 900, .1); b.feetY = Math.min(GY, b.feetY + 900 * dt); if (b.feetY >= GY && !b.flopped) { b.flopped = true; G.addShake(.5); AudioSys.sfx('stomp'); } }
    if (k > 4.4 && !this.leavingKO) {
      this.leavingKO = true;
      G.go('results', { time: this.fightT, hp: this.pl.hp, maxHp: this.pl.maxHp, parries: this.stats.parries, cards: this.stats.cards });
    }
  },
  updateSeals(dt) {
    const p = this.pl;
    for (const s of this.seals) {
      s.t += dt; s.st += dt; s.flash = Math.max(0, s.flash - dt);
      if (s.leaving) { s.x -= 300 * dt; s.pose = 'slide'; continue; }
      if (s.x < 90) { s.x += 260 * dt; s.pose = 'slide'; continue; }
      s.pose = s.st % 1.4 > 1.1 ? 'toss' : 'idle';
      if (s.st > 1.4) {
        s.st = 0; s.tosses++;
        const tx = p.x, T = .95, g = 1500, x0 = s.x + 26, y0 = GY - 100;
        this.eshots.push({ type: 'ball', x: x0, y: y0, vx: (tx - x0) / T, vy: (GY - 20 - y0 - .5 * g * T * T) / T, g, r: 15, pink: s.tosses === 2, rot: 0, bounces: 0 });
        AudioSys.sfx('bounce');
        if (s.tosses >= 3) s.leaving = true;
      }
      if (!p.dead && hitCircleRect(s.x + 5, GY - 50, 38, ...this.playerBox())) this.hurtPlayer(s.x);
    }
    this.seals = this.seals.filter(s => s.x > -120 && s.hp > 0);
  },
  updateShots(dt) {
    const b = this.b, p = this.pl, circles = this.bossCircles();
    // player bullets
    for (const s of this.shots) {
      if (s.boom) {
        s.t += dt; s.rot += 22 * dt;
        if (s.t > .38) { const dx = p.x - s.x, dy = (p.y - 60) - s.y, d = Math.hypot(dx, dy) || 1; s.vx = lerp(s.vx, dx / d * 1250, 6 * dt); s.vy = lerp(s.vy, dy / d * 1250, 6 * dt); s.back = true; if (d < 50 || s.t > 2.2) s.dead = true; }
        else { s.vx *= 1 - 1.5 * dt; }
        s.x += s.vx * dt; s.y += s.vy * dt;
        for (const c of circles) if (Math.hypot(s.x - c.x, s.y - c.y) < c.r + 24) { const key = s.back ? 'hitB' : 'hitA'; if (!s[key] && !b.inv) { s[key] = true; this.damageBoss(TUNE.exDmg); AudioSys.sfx('boomhit'); FX.stars(s.x, s.y, 6); G.freeze(.04); } }
        for (const sl of this.seals) if (Math.abs(s.x - sl.x) < 50 && Math.abs(s.y - (GY - 60)) < 60) this.hitSeal(sl, 3);
        continue;
      }
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.x < -40 || s.x > 1320 || s.y < -40 || s.y > GY + 10) { s.dead = true; if (s.y > GY) FX.puff(s.x, GY, 1, { r0: 4, r1: 7 }); continue; }
      if (!b.inv || b.state === 'intro') for (const c of circles) if ((s.x - c.x) ** 2 + (s.y - c.y) ** 2 < (c.r + 6) ** 2) {
        s.dead = true; if (!b.inv) this.damageBoss(1);
        if (this.hitSfxT <= 0) { AudioSys.sfx('hit'); this.hitSfxT = .06; }
        FX.add({ type: 'star', x: s.x, y: s.y, vx: rand(-60, 60), vy: rand(-60, 60), r: 9, life: .15, col: C.cream, rot: rand(0, TAU) }); break;
      }
      if (!s.dead) for (const sl of this.seals) if (!sl.leaving && Math.abs(s.x - (sl.x + 10)) < 40 && s.y > GY - 110 && s.y < GY) { s.dead = true; this.hitSeal(sl, 1); break; }
    }
    this.shots = this.shots.filter(s => !s.dead);
    // enemy shots
    const box = this.playerBox();
    for (const e of this.eshots) {
      if (e.dead) continue;
      e.vy += (e.g || 0) * dt; e.x += e.vx * dt; e.y += e.vy * dt; if (e.rot != null) e.rot += (e.type === 'ball' ? 8 : 6) * dt;
      if (e.type === 'blob' && e.y >= GY - 6) { e.dead = true; this.puddles.push({ x: e.x, w: 96, t: 0, life: 1.8 }); AudioSys.sfx('splash'); FX.puff(e.x, GY - 6, 5, { col: C.water, dir: -Math.PI / 2, spread: 1.2, r0: 5, r1: 10 }); continue; }
      if (e.type === 'tear' && e.y >= GY - 6) { e.dead = true; FX.puff(e.x, GY - 6, 3, { col: C.water, dir: -Math.PI / 2, spread: 1.2, r0: 4, r1: 8 }); continue; }
      if (e.type === 'ball' && e.y >= GY - e.r) { if (e.bounces < 1) { e.bounces++; e.y = GY - e.r; e.vy = -e.vy * .6; } }
      if (e.x < -80 || e.x > 1360 || e.y > GY + 80) { e.dead = true; continue; }
      if (!p.dead && hitCircleRect(e.x, e.y, e.r * .85, ...box) && this.hurtPlayer(e.x)) e.dead = true;
    }
    this.eshots = this.eshots.filter(e => !e.dead);
    for (const pd of this.puddles) { pd.t += dt; if (!p.dead && p.ground && Math.abs(p.x - pd.x) < pd.w / 2 + 6 && pd.t < pd.life - .2) this.hurtPlayer(pd.x); }
    this.puddles = this.puddles.filter(pd => pd.t < pd.life);
    for (const w of this.waves) { w.x += w.vx * dt; if (!p.dead && Math.abs(p.x - w.x) < 44 && p.y > GY - w.h) this.hurtPlayer(w.x); if (G.frame % 2 === 0) FX.puff(w.x, GY - 8, 1, { dir: -Math.PI / 2, spread: .8, r0: 7, r1: 13, life: .7 }); }
    this.waves = this.waves.filter(w => w.x > -80 && w.x < 1360);
    // super stampede
    for (const m of this.monkeys) {
      m.x += m.sp * dt;
      if (!m.hit && m.x > b.x - 60) { m.hit = true; this.damageBoss(TUNE.superDmg / 9, true); b.flash = .08; G.addShake(.25); AudioSys.sfx('boomhit'); FX.stars(b.x, b.feetY - 150 * b.scale, 5); }
      for (const sl of this.seals) if (Math.abs(m.x - sl.x) < 40) this.hitSeal(sl, 5);
    }
    this.monkeys = this.monkeys.filter(m => m.x < 1400);
  },
  hitSeal(sl, n) {
    if (sl.leaving || sl.hp <= 0) return; sl.hp -= n; sl.flash = .06; this.pl.meter = Math.min(500, this.pl.meter + n * TUNE.meterPerHit);
    if (sl.hp <= 0) { FX.puff(sl.x, GY - 60, 10, { r0: 10, r1: 20, sp1: 260 }); FX.stars(sl.x, GY - 60, 6); AudioSys.sfx('pop'); this.cheer = 1; }
  },
  // ---------- drawing ----------
  draw(c) {
    const b = this.b, p = this.pl;
    if (this.zoomT > 0) { const k = Math.sin(this.zoomT / .6 * Math.PI) * .06; c.translate(640, 400); c.scale(1 + k, 1 + k); c.translate(-640, -400); }
    BigTop.draw(c, p.x, this.cheer);
    // spotlights (phase 3)
    if (b.phase === 3 && this.lights.length && b.state !== 'ko') {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const l of this.lights) {
        const g = c.createLinearGradient(0, 0, 0, GY); g.addColorStop(0, 'rgba(255,238,190,.05)'); g.addColorStop(1, 'rgba(255,238,190,.32)');
        c.fillStyle = g; c.beginPath(); c.moveTo(l.x - 18 + (l.x - 640) * .3, 0); c.lineTo(l.x + 18 + (l.x - 640) * .3, 0); c.lineTo(l.x + 74, GY); c.lineTo(l.x - 74, GY); c.closePath(); c.fill();
      }
      c.restore();
      for (const l of this.lights) { c.fillStyle = 'rgba(255,240,200,.45)'; c.beginPath(); c.ellipse(l.x, GY, 76, 14, 0, 0, TAU); c.fill(); }
    }
    // puddles & shadow
    for (const pd of this.puddles) { const k = pd.t / pd.life, a = k > .8 ? (1 - k) * 5 : 1; c.save(); c.globalAlpha = a; ell(c, pd.x, GY - 2, pd.w / 2 * (k < .1 ? k * 10 : 1), 11, 0, C.water, 3.5); c.fillStyle = 'rgba(255,255,240,.6)'; c.beginPath(); c.ellipse(pd.x - 14, GY - 5, 14, 3, 0, 0, TAU); c.fill(); c.restore(); }
    if (this.shadow) { const k = clamp(this.shadow.t / .9, 0, 1); c.fillStyle = `rgba(20,10,4,${.25 + .35 * k})`; c.beginPath(); c.ellipse(this.shadow.x, GY - 2, 50 + 70 * k, 12 + 6 * k, 0, 0, TAU); c.fill(); if (Math.sin(G.t * 30) > 0) text(c, '!', this.shadow.x, GY - 60, 40, { color: C.mustard, outline: 6 }); }
    // trapeze
    if (b.phase === 3 && b.state !== 'ko') {
      const bx = b.barX ?? 640, by = b.barY ?? -100; inkS(c, 4); c.beginPath(); c.moveTo(640 - 60, -70); c.lineTo(bx - 60 * Math.cos(b.ang || 0), by); c.moveTo(640 + 60, -70); c.lineTo(bx + 60 * Math.cos(b.ang || 0), by); c.stroke();
      c.save(); c.translate(bx, by); c.rotate(b.ang || 0); roundRect(c, -66, -6, 132, 12, 6); c.fillStyle = C.mustard; c.fill(); inkS(c, 4); c.stroke(); c.restore();
    }
    // boss
    const tint = b.flash > 0 ? 'rgba(255,250,235,.62)' : null;
    if (b.phase === 1) {
      drawBall(c, b.bx, GY - 95, 95, b.ballRot || 0);
      Art.drawTusk(c, b.bx, GY - 186, { pose: b.pose, t: b.t, face: b.face, tint });
      if (b.state === 'wind' || b.state === 'cheeks') this.exclaim(c, b.bx - 20 * b.face, GY - 530);
    } else {
      if (b.state === 'dive' || b.state === 'ground' || b.state === 'rise') { inkS(c, 4); c.beginPath(); c.moveTo(b.barX ?? b.x, b.barY ?? 0); c.lineTo(b.x, b.feetY - 352 * b.scale); c.stroke(); }
      Art.drawTusk(c, b.x, b.feetY, { pose: b.pose, t: b.t, face: b.face, scale: b.scale, tint, cry: b.phase === 3 });
      if (b.state === 'stompUp' || b.state === 'spinUp' || b.state === 'tears') this.exclaim(c, b.x, b.feetY - 360 * b.scale);
      if (b.state === 'ko' && b.flopped) for (let k = 0; k < 4; k++) { const a = G.t * 4 + k / 4 * TAU; starPath(c, b.x + Math.cos(a) * 60, b.feetY - 230 + Math.sin(a) * 16, 11, 5, 5); c.fillStyle = C.mustard; c.fill(); inkS(c, 2.5); c.stroke(); }
    }
    // seals
    for (const s of this.seals) Art.drawSeal(c, s.x, GY, { pose: s.pose, t: s.t, face: 1, tint: s.flash > 0 ? 'rgba(255,250,235,.6)' : null });
    // shockwaves
    for (const w of this.waves) { c.save(); c.translate(w.x, GY); c.scale(Math.sign(w.vx), 1); c.beginPath(); c.moveTo(-40, 0); c.quadraticCurveTo(-10, -w.h * 1.2, 30, -w.h * .3); c.quadraticCurveTo(10, -w.h * .6, 40, 0); c.closePath(); c.fillStyle = C.paper; c.fill(); inkS(c, 4); c.stroke(); c.restore(); }
    // stampede
    for (const m of this.monkeys) Art.drawBongoDirect(c, m.x, m.y, { pose: 'run', t: G.t + m.ph, face: 1, fur: m.fur, vest: m.vest, scale: .9 });
    // player
    if (!p.dead || p.deadT < 3) {
      const blink = p.inv > 0 && !p.hurtT && Math.floor(G.t * 20) % 2 === 0;
      if (p.dead) { c.save(); c.globalAlpha = .7; Art.drawBongo(c, p.x, p.y, { pose: 'ghost', t: p.animT, face: p.face, tint: 'rgba(250,245,230,.55)' }); c.restore(); inkS(c, 2); c.beginPath(); c.ellipse(p.x + 4, p.y - 160, 20, 6, 0, 0, TAU); c.stroke(); }
      else if (!blink) {
        let sx = 1, sy = 1; if (p.landT > 0) { p.landT -= G.rdt; sx = 1.18; sy = .84; } else if (!p.ground && p.pose === 'jump') { sx = .88; sy = 1.12; }
        Art.drawBongo(c, p.x, p.y, { pose: p.pose, t: p.animT, face: p.face, gun: p.gun && ['idle', 'run', 'jump', 'fall', 'duck'].includes(p.pose), aim: p.aim, sx, sy, tint: p.parryT > 0 ? 'rgba(255,79,154,.35)' : p.superT > 0 ? 'rgba(255,220,120,.4)' : null });
        if (p.slowT > 0) { c.fillStyle = C.water; for (let k = 0; k < 2; k++) { const yy = p.y - 130 + ((G.t * 60 + k * 20) % 40); c.beginPath(); c.arc(p.x + 24 - k * 48, yy, 4, 0, TAU); c.fill(); } }
      }
    }
    // bullets
    for (const s of this.shots) s.boom ? drawBananaRang(c, s.x, s.y, s.rot, 1.2) : drawPellet(c, s.x, s.y, s.a);
    for (const e of this.eshots) {
      if (e.type === 'blob') drawBlob(c, e.x, e.y, e.r, e.vx, e.vy);
      else if (e.type === 'peanut') drawPeanut(c, e.x, e.y, e.rot, e.pink);
      else if (e.type === 'tear') drawTear(c, e.x, e.y, e.pink);
      else if (e.type === 'ball') drawStripeBall(c, e.x, e.y, e.r, e.rot, e.pink);
    }
    BigTop.drawFront(c);
    if (G.debug) this.drawDebug(c);
  },
  exclaim(c, x, y) { const k = 1 + Math.sin(G.t * 24) * .12; c.save(); c.translate(x, y); c.scale(k, k); circ(c, 0, 0, 24, C.cream, 4); text(c, '!', 0, 3, 34, { color: C.red }); c.restore(); },
  drawDebug(c) {
    c.save(); c.strokeStyle = '#0f0'; c.lineWidth = 2;
    for (const k of this.bossCircles()) { c.beginPath(); c.arc(k.x, k.y, k.r, 0, TAU); c.stroke(); }
    c.strokeStyle = '#f00'; for (const k of this.contactCircles()) { c.beginPath(); c.arc(k.x, k.y, k.r * .92, 0, TAU); c.stroke(); }
    const bx = this.playerBox(); c.strokeRect(bx[0], bx[1], bx[2] - bx[0], bx[3] - bx[1]);
    if (this.b.state === 'spin') c.strokeRect(this.b.x - 92, GY - 300, 184, 220);
    c.fillStyle = '#000a'; c.fillRect(8, 90, 330, 30);
    c.font = '16px monospace'; c.fillStyle = '#0f0'; c.textAlign = 'left'; c.fillText(`fps ${G.fps | 0}  phase ${this.b.phase} ${this.b.state}  hp ${this.b.hp | 0}  (N = skip)`, 14, 110); c.restore();
  },
  drawHUD(c) {
    const p = this.pl, b = this.b;
    // HP card
    const low = p.hp <= 1 && !p.dead && Math.sin(G.t * 12) > 0;
    card(c, 20, 640, 96, 56, low ? C.red : C.cream, 4, 8);
    text(c, `HP.${Math.max(0, p.hp)}`, 68, 670, 28, { color: low ? C.cream : C.ink });
    // super cards
    for (let i = 0; i < 5; i++) {
      const fill = clamp((p.meter - i * 100) / 100, 0, 1), x = 132 + i * 38, y = 648, full = fill >= 1;
      c.save(); c.translate(x + 15, y + 22); if (full) c.scale(1 + Math.sin(G.t * 8 + i) * .04, 1);
      roundRect(c, -15, -22, 30, 44, 4); c.fillStyle = full ? C.cream : '#6b5238'; c.fill();
      if (!full && fill > 0) { c.save(); roundRect(c, -15, -22, 30, 44, 4); c.clip(); c.fillStyle = C.mustard; c.fillRect(-15, 22 - 44 * fill, 30, 44 * fill); c.restore(); }
      inkS(c, 3); roundRect(c, -15, -22, 30, 44, 4); c.stroke();
      if (full) { starPath(c, 0, 0, 10, 4.5, 5); c.fillStyle = C.red; c.fill(); inkS(c, 2); c.stroke(); }
      c.restore();
    }
    if (!p.dead && b.state !== 'ko') pauseButton(c);
    // touch controls
    if (G.touch && !p.dead && b.state !== 'ko') {
      if (this.joy) { c.save(); c.globalAlpha = .35; circ(c, this.joy.ox, this.joy.oy, 64, C.cream, 4); c.globalAlpha = .7; const dx = this.joy.x - this.joy.ox, dy = this.joy.y - this.joy.oy, d = Math.min(64, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); circ(c, this.joy.ox + Math.cos(a) * d, this.joy.oy + Math.sin(a) * d, 30, C.cream, 4); c.restore(); }
      else if (b.state === 'intro') { c.save(); c.globalAlpha = .25; circ(c, 150, 470, 64, C.cream, 4); c.restore(); text(c, 'drag to move', 150, 472, 18, { face: 'body', color: C.cream }); }
      for (const k in BTN) {
        const B = BTN[k], down = this.held(k), lit = (k === 'shoot' && this.autoFire) || (k === 'ex' && p.meter >= 100);
        c.save(); c.globalAlpha = down ? .9 : .62; c.translate(B.x, B.y + (down ? 3 : 0));
        circ(c, 0, 0, B.r, lit ? (k === 'ex' && p.meter >= 500 ? C.red : C.mustard) : C.cream, 4.5);
        text(c, k === 'ex' && p.meter >= 500 ? 'SUPER' : B.label, 0, 2, B.r > 50 ? 24 : B.r > 40 ? 18 : 15, { color: C.ink });
        c.restore();
      }
    }
    // intro cards
    if (b.state === 'intro') {
      const st = b.st;
      if (st > .3 && st < 1.3) { const k = ease.outBack(clamp((st - .3) * 4, 0, 1)); c.save(); c.translate(640, 300); c.scale(k, k); c.rotate(-.05); text(c, 'READY?', 0, 0, 110, { color: C.cream, outline: 14 }); c.restore(); }
      if (st > 1.3 && st < 2.1) { const k = ease.outElastic(clamp((st - 1.3) * 2.5, 0, 1)); c.save(); c.translate(640, 300); c.scale(k * 1.2, k * 1.2); text(c, 'GO!', 0, 0, 150, { color: C.mustard, outline: 16 }); c.restore(); }
    }
    if (b.state === 'ko' && this.koT < 2.2) { const k = ease.outBack(clamp(this.koT * 3, 0, 1)); c.save(); c.translate(640, 290); c.rotate(-.06); c.scale(k, k); text(c, 'KNOCKOUT!', 0, 0, 130, { color: C.cream, outline: 16 }); c.restore(); }
    if (this.deathCard) this.drawDeath(c);
  },
  drawDeath(c) {
    const k = ease.outBack(clamp(this.deathCard * 2.5, 0, 1)), prog = clamp(1 - this.b.hp / TUNE.hp, 0, 1);
    dim(c, .4 * Math.min(1, this.deathCard * 3));
    c.save(); c.translate(640, 330); c.rotate(-.03); c.scale(k, k);
    // torn paper card
    c.beginPath(); c.moveTo(-340, -170); for (let x = -340; x <= 340; x += 34) c.lineTo(x, -170 + ((x / 34) % 2 ? 8 : -6)); c.lineTo(340, 170); for (let x = 340; x >= -340; x -= 34) c.lineTo(x, 170 + ((x / 34) % 2 ? -7 : 6)); c.closePath();
    c.fillStyle = C.cream; c.fill(); inkS(c, 6); c.stroke();
    text(c, 'YOU DIED!', 0, -110, 76, { color: C.redD });
    text(c, '"Bongo will be back on his feet in no time!"', 0, -52, 24, { face: 'body' });
    const x0 = -270, x1 = 270; inkS(c, 5); c.beginPath(); c.moveTo(x0, 20); c.lineTo(x1, 20); c.stroke();
    for (const f of [0, 1 - TUNE.p2 / TUNE.hp, 1 - TUNE.p3 / TUNE.hp]) circ(c, lerp(x0, x1, f), 20, 9, C.paper, 3.5);
    starPath(c, x1, 20, 22, 10, 5); c.fillStyle = C.mustard; c.fill(); inkS(c, 3); c.stroke();
    drawBongoHead(c, lerp(x0, x1, prog), -8, .7);
    text(c, `${Math.round(prog * 100)}% of the way to a knockout`, 0, 66, 22, { face: 'body', color: C.sepia });
    c.restore();
    if (this.deathCard > .5) {
      button(c, 'd-retry', 356, 460, 270, 76, 'Retry', () => G.go('fight', null, true), { primary: true });
      button(c, 'd-quit', 654, 460, 270, 76, 'Station', () => G.go('station'));
    }
  }
};
