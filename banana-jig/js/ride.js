'use strict';
// The Peanut Express ride from Banana Junction to Big Top Isle. Can't be lost: it only changes the coin bonus.
const RIDE = {
  length: 640, px: 22, maxV: 60, locoX: 760,
  curves: [{ at: 150, len: 46, limit: 25 }, { at: 330, len: 52, limit: 30 }, { at: 505, len: 40, limit: 20 }]
};
function trackY(d) {
  let y = 548 - 24 * Math.sin(d * .012) - 12 * Math.sin(d * .031 + 1);
  for (const c of RIDE.curves) { const k = (d - c.at) / c.len; if (k > -.2 && k < 1.2) y += Math.sin(clamp(k, 0, 1) * Math.PI) * 26; }
  if (d > RIDE.length - 70) y = lerp(y, 548, clamp((d - (RIDE.length - 70)) / 40, 0, 1));
  return y;
}
const trackAng = d => Math.atan2(trackY(d + .5) - trackY(d - .5), RIDE.px);
function curveAt(d) { return RIDE.curves.find(c => d >= c.at && d <= c.at + c.len); }

G.scenes.ride = {
  enter() {
    Sky.init(); Train.init(); BigTop.init();
    Object.assign(this, { d: 0, v: 0, t: 0, comfort: 100, rot: 0, chuff: 0, puff: 0, bananas: [], got: 0, jostle: 0, state: 'go', arriveT: 0, holdP: false, holdB: false, ptrs: {}, flying: [], hint: 3, warnT: 0 });
    const r = seeded(21);
    for (let d = 40; d < RIDE.length - 50; d += 26 + r() * 20) {
      if (curveAt(d) || curveAt(d + 10)) continue;
      const n = 3 + (r() * 3 | 0), h0 = 30 + r() * 110;
      for (let k = 0; k < n; k++) this.bananas.push({ d: d + k * 2.4, h: h0 + Math.sin(k / (n - 1) * Math.PI) * 50, taken: false, ph: r() * 6 });
      d += n * 2.4;
    }
    this.total = this.bananas.length;
    AudioSys.play('ride'); AudioSys.sfx('whistle');
  },
  onBlur() { if (!G.overlay && this.state === 'go') openOverlay(PauseOverlay); },
  bananaPos(b) { return { x: RIDE.locoX + (b.d - this.d) * RIDE.px, y: trackY(b.d) - 170 - b.h + Math.sin(G.t * 3 + b.ph) * 6 }; },
  btnHit(p) {
    if (Math.hypot(p.x - 1180, p.y - 628) < 82) return 'P';
    if (Math.hypot(p.x - 1020, p.y - 648) < 66) return 'B';
    return null;
  },
  onDown(p) {
    const b = this.btnHit(p);
    if (b) { this.ptrs[p.id] = b; return; }
    for (const bn of this.bananas) {
      if (bn.taken) continue; const q = this.bananaPos(bn);
      if (Math.hypot(p.x - q.x, p.y - q.y) < 48) { this.take(bn, q); return; }
    }
  },
  onMove(p) { if (this.ptrs[p.id]) this.ptrs[p.id] = this.btnHit(p) || this.ptrs[p.id]; else for (const bn of this.bananas) { if (bn.taken) continue; const q = this.bananaPos(bn); if (Math.hypot(p.x - q.x, p.y - q.y) < 40) this.take(bn, q); } },
  onUp(p) { delete this.ptrs[p.id]; },
  take(bn, q) {
    bn.taken = true; this.got++; AudioSys.sfx('coin'); G.vibe(8);
    this.flying.push({ x: q.x, y: q.y, t: 0 }); FX.stars(q.x, q.y, 4, C.mustard);
  },
  update(dt) {
    this.t += dt;
    const S = Object.values(this.ptrs);
    const power = S.includes('P') || G.keys.ArrowRight || G.keys.KeyD, brake = S.includes('B') || G.keys.ArrowLeft || G.keys.KeyA || G.keys.Space;
    this.holdP = power; this.holdB = brake;
    if (G.pressed.Escape) openOverlay(PauseOverlay);
    if (this.state === 'go') {
      if (brake) this.v = Math.max(0, this.v - 26 * dt);
      else if (power) this.v = Math.min(RIDE.maxV, this.v + 10 * dt);
      else this.v = this.v > 12 ? this.v - 2.5 * dt : this.v;
      if (power || brake) this.hint = 0; else if (this.v < 1) this.hint = Math.max(this.hint, 1);
      this.d += this.v / 3.6 * dt;
      const cv = curveAt(this.d);
      this.jostle = cv && this.v > cv.limit ? clamp((this.v - cv.limit) / 18, .15, 1) : Math.max(0, this.jostle - dt * 2);
      if (cv && this.v > cv.limit) {
        this.comfort = Math.max(0, this.comfort - (this.v - cv.limit) * .38 * dt);
        this.warnT -= dt; if (this.warnT <= 0) { this.warnT = .5; AudioSys.sfx('warn'); G.addShake(.12); }
      }
      if (this.d >= RIDE.length - 2) this.arrive();
    } else {
      this.v = Math.max(0, this.v - 70 * dt); this.d = Math.min(RIDE.length + 4, this.d + this.v / 3.6 * dt); this.arriveT += dt;
      this.jostle = Math.max(0, this.jostle - dt * 2);
    }
    this.rot += this.v / 3.6 * RIDE.px * dt / 26;
    this.chuff -= dt; if (this.v > 1 && this.chuff <= 0) { this.chuff = clamp(1.1 - this.v / 60, .16, 1.1); AudioSys.sfx('chuff', .6 + this.v / 60); }
    this.puff -= dt;
    if (this.puff <= 0) { this.puff = this.v > 1 ? clamp(.7 - this.v / 120, .12, .7) : 1; const a = trackAng(this.d); FX.puff(RIDE.locoX + 70, trackY(this.d) - 170 + a * 70, 1 + (this.v > 30 ? 1 : 0), { dir: Math.PI + .5, spread: .3, sp0: 40 + this.v * 3, sp1: 80 + this.v * 4, r0: 10, r1: 20, life: 2.2 }); }
    for (const f of this.flying) f.t += dt * 1.8; this.flying = this.flying.filter(f => f.t < 1);
  },
  arrive() {
    this.state = 'arrive'; this.arriveT = 0;
    const rough = this.v > 16; this.rough = rough;
    if (rough) { this.comfort = Math.max(0, this.comfort - 10); AudioSys.sfx('squeal'); G.addShake(.4); } else this.comfort = Math.min(100, this.comfort + 5);
    this.bonus = Math.round(this.comfort * .75); G.save.coins += this.got + this.bonus; G.persist();
    setTimeout(() => AudioSys.sfx('whistle'), 600);
  },
  draw(c) {
    const d = this.d, P = RIDE.px, prog = clamp(d / RIDE.length, 0, 1);
    Sky.bg.draw(c, 0, 0);
    c.fillStyle = `rgba(200,110,60,${.18 * prog})`; c.fillRect(0, 0, W, H); // toward sunset
    const scroll = d * P;
    // far islands
    for (let i = 0; i < 7; i++) { const x = ((i * 520 - scroll * .08) % 3640 + 3640) % 3640 - 300; Sky.drawIsland(c, i % 3, x, 200 + (i % 3) * 50 + Math.sin(G.t * .6 + i) * 5, .38 + (i % 2) * .1, 'rgba(210,200,170,.5)'); }
    // balloons
    for (let i = 0; i < 2; i++) {
      const x = ((i * 900 + 400 - scroll * .12) % 1800 + 1800) % 1800 - 200, y = 120 + i * 70 + Math.sin(G.t * .7 + i * 2) * 10;
      ell(c, x, y, 34, 40, 0, i ? C.teal : C.red, 4); c.save(); c.beginPath(); c.ellipse(x, y, 34, 40, 0, 0, TAU); c.clip(); c.fillStyle = C.cream; c.fillRect(x - 6, y - 40, 12, 80); c.restore(); inkS(c, 4); c.beginPath(); c.ellipse(x, y, 34, 40, 0, 0, TAU); c.stroke();
      inkS(c, 2); c.beginPath(); c.moveTo(x - 20, y + 32); c.lineTo(x - 10, y + 60); c.moveTo(x + 20, y + 32); c.lineTo(x + 10, y + 60); c.stroke(); c.fillStyle = '#8a5a30'; c.fillRect(x - 12, y + 58, 24, 16); c.strokeRect(x - 12, y + 58, 24, 16);
    }
    // destination island
    const destX = RIDE.locoX + (RIDE.length - d) * P * .45 + 240;
    if (destX < 1700) Sky.drawIsland(c, 3, destX, 340 + Math.sin(G.t * .8) * 5, 1.05);
    // mid clouds
    for (let i = 0; i < 6; i++) { const x = ((i * 330 - scroll * .3) % 1980 + 1980) % 1980 - 300; Sky.drawCloud(c, i, x, 470 + (i % 3) * 24, .9 + (i % 2) * .3); }
    // birds
    for (let i = 0; i < 4; i++) { const x = ((i * 380 - scroll * .5 - G.t * 60) % 1600 + 1600) % 1600 - 160, y = 160 + (i * 53) % 120, f = Math.sin(G.t * 10 + i) * 8; inkS(c, 3); c.beginPath(); c.moveTo(x - 14, y - f); c.quadraticCurveTo(x - 6, y - 6, x, y); c.quadraticCurveTo(x + 6, y - 6, x + 14, y - f); c.stroke(); }
    this.drawTrack(c);
    // speed signs
    for (const cv of RIDE.curves) {
      const sx = RIDE.locoX + (cv.at - 34 - d) * P; if (sx < -60 || sx > 1340) continue;
      const sy = trackY(cv.at - 34);
      c.fillStyle = '#5a3a20'; c.fillRect(sx - 4, sy - 130, 8, 118); inkS(c, 3.5); c.strokeRect(sx - 4, sy - 130, 8, 118);
      circ(c, sx, sy - 150, 30, C.cream, 4); c.lineWidth = 7; c.strokeStyle = C.red; c.beginPath(); c.arc(sx, sy - 150, 24, 0, TAU); c.stroke();
      text(c, String(cv.limit), sx, sy - 148, 24);
      for (let k = 0; k < 3; k++) { const cx = RIDE.locoX + (cv.at + k * cv.len / 3 + 6 - d) * P; if (cx < -40 || cx > 1320) continue; const cy = trackY(cv.at + k * cv.len / 3 + 6) - 70; roundRect(c, cx - 20, cy - 16, 40, 32, 5); c.fillStyle = C.mustard; c.fill(); inkS(c, 3); c.stroke(); inkS(c, 5); c.beginPath(); c.moveTo(cx - 6, cy - 9); c.lineTo(cx + 6, cy); c.lineTo(cx - 6, cy + 9); c.stroke(); }
    }
    // destination platform
    const plX = RIDE.locoX + (RIDE.length + 6 - d) * P;
    if (plX < 1500) { drawPlatform(c, plX - 520, plX + 180, 520, 'BIG TOP ISLE', G.t); }
    // train
    const cars = [[0, 'loco'], [235 / P, 'coach'], [440 / P, 'cab']];
    for (let i = cars.length - 1; i >= 0; i--) {
      const [off, kind] = cars[i], cd = d - off, x = RIDE.locoX - off * P, y = trackY(cd) - 4, j = this.jostle;
      const a = trackAng(cd) + Math.sin(G.t * 18 + i) * .035 * j, yy = y + Math.abs(Math.sin(G.t * 20 + i)) * -4 * j;
      if (kind === 'loco') Train.drawLoco(c, x, yy, a, this.rot, G.t);
      else if (kind === 'coach') Train.drawCoach(c, x, yy, a, this.rot, G.t, j);
      else Train.drawCaboose(c, x, yy, a, this.rot);
    }
    // bananas
    for (const b of this.bananas) { if (b.taken) continue; const q = this.bananaPos(b); if (q.x < -40 || q.x > 1320) continue; drawBananaCoin(c, q.x, q.y, 1.5, Math.sin(G.t * 4 + b.ph) * .3); }
    // near clouds
    for (let i = 0; i < 5; i++) { const x = ((i * 420 - scroll * 1.35) % 2100 + 2100) % 2100 - 300; Sky.drawCloud(c, (i + 2) % 6, x, 760, 1.5); }
  },
  drawTrack(c) {
    const d = this.d, P = RIDE.px, x0 = -60, x1 = 1340;
    // trestle
    const step = 6, first = Math.floor((d + (x0 - RIDE.locoX) / P) / step) * step;
    for (let td = first; td < d + (x1 - RIDE.locoX) / P; td += step) {
      const x = RIDE.locoX + (td - d) * P, y = trackY(td);
      c.fillStyle = '#5a3a20'; c.fillRect(x - 6, y + 8, 12, 760 - y); inkS(c, 3.5); c.strokeRect(x - 6, y + 8, 12, 760 - y);
      const x2 = RIDE.locoX + (td + step - d) * P, y2 = trackY(td + step);
      inkS(c, 5); c.beginPath(); c.moveTo(x, y + 20); c.lineTo(x2, y2 + 110); c.moveTo(x2, y2 + 20); c.lineTo(x, y + 110); c.stroke();
      c.strokeStyle = '#7a5231'; c.lineWidth = 2.5; c.stroke();
    }
    // ties + rail
    const tie = 1.6, ft = Math.floor((d + (x0 - RIDE.locoX) / P) / tie) * tie;
    c.fillStyle = '#4a2e1c';
    for (let td = ft; td < d + (x1 - RIDE.locoX) / P; td += tie) { const x = RIDE.locoX + (td - d) * P; c.fillRect(x - 9, trackY(td) - 2, 18, 12); }
    c.beginPath(); for (let x = x0; x <= x1; x += 16) { const td = d + (x - RIDE.locoX) / P; x === x0 ? c.moveTo(x, trackY(td)) : c.lineTo(x, trackY(td)); }
    inkS(c, 7); c.stroke(); c.strokeStyle = '#8d8a80'; c.lineWidth = 2.5; c.stroke();
  },
  drawHUD(c) {
    const cv = curveAt(this.d), next = RIDE.curves.find(k => k.at > this.d && k.at - this.d < 60);
    // top-left: destination and coins
    roundRect(c, 16, 14, 262, 46, 23); c.fillStyle = C.cream; c.fill(); inkS(c, 4); c.stroke();
    starPath(c, 42, 37, 11, 5, 4); c.fillStyle = C.red; c.fill(); text(c, 'To Big Top Isle', 160, 39, 22);
    coinPill(c, 16, 70, G.save.coins + this.got);
    // flying bananas to the counter
    for (const f of this.flying) { const k = ease.inOut(f.t); drawBananaCoin(c, lerp(f.x, 42, k), lerp(f.y, 95, k), 1.5 - k * .6, k * 6); }
    // pause
    button(c, 'pause', 1206, 14, 56, 56, '', () => { if (!G.overlay) openOverlay(PauseOverlay); });
    c.fillStyle = C.ink; c.fillRect(1224, 30, 7, 24); c.fillRect(1237, 30, 7, 24);
    // comfort chip + route bar
    roundRect(c, 480, 566, 300, 34, 17); c.fillStyle = cv && this.jostle > .1 ? C.red : C.ink; c.fill();
    text(c, `${Math.round(this.comfort)}% passenger comfort`, 630, 584, 18, { color: C.cream, face: 'body' });
    card(c, 250, 610, 640, 96, C.cream, 5, 18);
    text(c, Math.round(this.v), 312, 648, 44); text(c, 'km/h', 312, 682, 18, { face: 'body' });
    text(c, 'Banana Junction', 380, 636, 16, { face: 'body', align: 'left' }); text(c, 'Big Top Isle', 870, 636, 16, { face: 'body', align: 'right' });
    inkS(c, 4); c.beginPath(); c.moveTo(380, 664); c.lineTo(870, 664); c.stroke();
    for (const k of RIDE.curves) { const x = lerp(380, 870, k.at / RIDE.length); c.fillStyle = C.red; c.fillRect(x, 658, (k.len / RIDE.length) * 490, 12); }
    const px = lerp(380, 870, clamp(this.d / RIDE.length, 0, 1)); circ(c, px, 664, 11, C.mustard, 4);
    const mode = this.holdB ? 'Braking' : this.holdP ? 'Full steam' : this.v > 12.5 ? 'Coasting' : this.v > 0 ? 'Steady' : 'Stopped';
    text(c, mode, 625, 690, 18, { face: 'body', color: C.sepia });
    // power & brake
    const bp = this.holdB, pp = this.holdP;
    c.save(); c.translate(0, bp ? 4 : 0); circ(c, 1020, 648 + (bp ? 0 : -2), 60, bp ? '#cdbb98' : C.cream, 5); text(c, 'Brake', 1020, 650, 26); c.restore();
    c.save(); c.translate(0, pp ? 4 : 0); circ(c, 1180, 628, 76, pp ? C.mustardD : C.mustard, 6); text(c, 'Power', 1180, 630, 32); c.restore();
    // hints & warnings
    if (this.state === 'go' && this.hint && this.v < 1) { const b = Math.sin(G.t * 6) * 6; text(c, 'Hold Power to leave the station!', 820, 470 + b, 30, { color: C.cream, outline: 7 }); }
    if (next && this.v > next.limit) { const b = Math.sin(G.t * 14) > 0; if (b) text(c, `Sharp bend! Slow to ${next.limit}`, 640, 150, 40, { color: C.cream, outline: 8 }); }
    if (cv && this.v > cv.limit) text(c, 'Too fast! Passengers are bouncing!', 640, 150, 34, { color: C.mustard, outline: 8 });
    if (this.state === 'go' && RIDE.length - this.d < 70 && this.v > 16) text(c, 'Station ahead: brake!', 640, 150, 40, { color: C.cream, outline: 8 });
    if (this.state === 'arrive' && this.arriveT > .8) {
      const k = ease.outBack(clamp((this.arriveT - .8) * 3, 0, 1));
      c.save(); c.translate(640, 300); c.scale(k, k);
      card(c, -300, -170, 600, 340, C.cream, 6, 18);
      text(c, 'ARRIVED!', 0, -118, 46, { color: C.redD });
      text(c, this.rough ? 'Rough stop! (−10 comfort)' : 'Smooth stop! (+5 comfort)', 0, -66, 24, { face: 'body' });
      text(c, `Bananas caught: ${this.got} / ${this.total}`, 0, -28, 26, { face: 'body' });
      text(c, `Comfort ${Math.round(this.comfort)}%  →  +${this.bonus} coins`, 0, 10, 26, { face: 'body' });
      c.restore();
      if (this.arriveT > 1.3) button(c, 'enter', 470, 376, 340, 76, 'Enter the Big Top', () => G.go('fight'), { primary: true, size: 30 });
    }
  }
};
