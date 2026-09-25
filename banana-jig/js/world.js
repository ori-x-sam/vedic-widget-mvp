'use strict';
// Backgrounds & props: the Big Top, the sky above the Canopy Line, floating islands, the Peanut Express.
function seeded(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const staticLayer = (w, h, ox, oy, fn) => { const s = makeSprite(w, h, ox, oy); return { draw: (c, x, y, tint) => s.draw(c, x, y, 'static', fn, tint) }; };
function watercolor(c, w, h, n, col, seed) {
  const r = seeded(seed); c.save();
  for (let i = 0; i < n; i++) { c.globalAlpha = .03 + r() * .05; c.fillStyle = col; c.beginPath(); c.arc(r() * w, r() * h, 20 + r() * 90, 0, TAU); c.fill(); }
  c.restore();
}

// ---------------- BIG TOP ----------------
const BigTop = {
  init() {
    if (this.back) return;
    this.back = staticLayer(1400, 720, 60, 0, c => {
      const g = c.createLinearGradient(0, 0, 0, 720); g.addColorStop(0, '#6d3a26'); g.addColorStop(.45, '#c89a67'); g.addColorStop(1, '#8e6440');
      c.fillStyle = g; c.fillRect(-60, 0, 1400, 720);
      const ax = 640, ay = -320, N = 34;
      for (let i = 0; i < N; i++) {
        const a0 = Math.PI * .08 + i / N * Math.PI * .84, a1 = Math.PI * .08 + (i + 1) / N * Math.PI * .84;
        c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + Math.cos(a0) * 1500, ay + Math.sin(a0) * 1500); c.lineTo(ax + Math.cos(a1) * 1500, ay + Math.sin(a1) * 1500); c.closePath();
        c.fillStyle = i % 2 ? 'rgba(178,64,46,.62)' : 'rgba(240,222,186,.42)'; c.fill();
      }
      watercolor(c, 1400, 720, 70, '#2a1206', 7);
      const top = c.createLinearGradient(0, 0, 0, 300); top.addColorStop(0, 'rgba(30,12,4,.75)'); top.addColorStop(1, 'rgba(30,12,4,0)'); c.fillStyle = top; c.fillRect(-60, 0, 1400, 300);
      // spotlights (static glow)
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const [sx, tx] of [[140, 430], [1140, 860]]) { const lg = c.createLinearGradient(sx, 0, tx, 600); lg.addColorStop(0, 'rgba(255,230,170,.22)'); lg.addColorStop(1, 'rgba(255,230,170,0)'); c.fillStyle = lg; c.beginPath(); c.moveTo(sx - 20, 0); c.lineTo(sx + 20, 0); c.lineTo(tx + 160, 620); c.lineTo(tx - 160, 620); c.closePath(); c.fill(); }
      c.restore();
      // poles & rigging
      inkS(c, 3); c.globalAlpha = .6; for (const px of [150, 1130]) { c.beginPath(); c.moveTo(px, 60); c.lineTo(640, -10); c.stroke(); c.beginPath(); c.moveTo(px, 60); c.lineTo(px < 640 ? -60 : 1340, 250); c.stroke(); } c.globalAlpha = 1;
      for (const px of [150, 1130]) {
        c.fillStyle = C.mustardD; c.fillRect(px - 13, 20, 26, 700); inkS(c, 5); c.strokeRect(px - 13, 20, 26, 700);
        for (let y = 80; y < 700; y += 120) { c.fillStyle = C.red; c.fillRect(px - 15, y, 30, 16); c.strokeRect(px - 15, y, 30, 16); }
        circ(c, px, 20, 16, C.mustard, 5);
      }
      // banner
      c.save(); c.translate(640, 78);
      c.beginPath(); c.moveTo(-260, -26); c.quadraticCurveTo(0, 10, 260, -26); c.lineTo(250, 30); c.quadraticCurveTo(0, 66, -250, 30); c.closePath(); c.fillStyle = C.red; c.fill(); inkS(c, 5); c.stroke();
      for (const d of [-1, 1]) { c.beginPath(); c.moveTo(d * 250, -20); c.lineTo(d * 320, -10); c.lineTo(d * 290, 12); c.lineTo(d * 318, 38); c.lineTo(d * 246, 30); c.closePath(); c.fillStyle = C.redD; c.fill(); c.stroke(); }
      text(c, '★ TOPSY-TURVY CIRCUS ★', 0, 16, 34, { color: C.cream, outline: 6 });
      c.restore();
    });
    this.stands = staticLayer(1400, 260, 60, 0, c => {
      for (let r = 0; r < 4; r++) { const y = 40 + r * 52; c.fillStyle = r % 2 ? '#5a3a24' : '#4a2e1c'; c.fillRect(-60, y, 1400, 52); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-60, y, 1400, 8); }
      inkS(c, 3); for (let x = -40; x < 1340; x += 90) { c.beginPath(); c.moveTo(x, 40); c.lineTo(x + 20, 250); c.stroke(); }
      const g = c.createLinearGradient(0, 0, 0, 260); g.addColorStop(0, 'rgba(20,8,2,.5)'); g.addColorStop(1, 'rgba(20,8,2,0)'); c.fillStyle = g; c.fillRect(-60, 0, 1400, 260);
    });
    this.floor = staticLayer(1400, 180, 60, 0, c => {
      const g = c.createLinearGradient(0, 0, 0, 180); g.addColorStop(0, '#c9a36a'); g.addColorStop(1, '#a57a47'); c.fillStyle = g; c.fillRect(-60, 20, 1400, 160);
      const r = seeded(3); c.fillStyle = 'rgba(80,40,10,.25)'; for (let i = 0; i < 500; i++) c.fillRect(-60 + r() * 1400, 26 + r() * 150, 2 + r() * 3, 1.5);
      // ring curb (back edge)
      c.beginPath(); c.ellipse(640, 150, 820, 130, 0, Math.PI, TAU); c.lineWidth = 34; c.strokeStyle = C.ink; c.stroke(); c.lineWidth = 24; c.strokeStyle = C.red; c.stroke();
      c.setLineDash([40, 40]); c.strokeStyle = C.cream; c.lineWidth = 24; c.stroke(); c.setLineDash([]);
      c.fillStyle = 'rgba(40,16,4,.18)'; c.fillRect(-60, 20, 1400, 12);
    });
    const R = seeded(11), cols = ['#5b4a3a', '#6c5a48', '#4b5a55', '#7a5f45', '#665060'];
    this.crowd = [];
    for (let row = 0; row < 3; row++) for (let i = 0; i < 17; i++) this.crowd.push({ x: -20 + i * 82 + R() * 40 + (row % 2) * 40, row, type: R() * 4 | 0, col: cols[R() * cols.length | 0], ph: R(), s: .85 + R() * .3 });
    this.lanterns = [240, 520, 800, 1060].map((x, i) => ({ x, ph: i * 1.7 }));
  },
  draw(c, px, cheer) {
    const par = (px - 640) / 640;
    this.back.draw(c, -par * 14, 0);
    this.stands.draw(c, -par * 22, 330);
    // crowd
    const beat = G.beat;
    for (const a of this.crowd) {
      const x = a.x - par * 22 * (1 + a.row * .1), y = 360 + a.row * 52 + 10;
      const ex = cheer > 0 ? 1 : 0, bob = -Math.abs(Math.sin((beat + a.ph) * Math.PI)) * (3 + ex * 12);
      c.save(); c.translate(x, y + bob); c.scale(a.s, a.s);
      c.fillStyle = a.col; c.strokeStyle = C.ink; c.lineWidth = 3;
      c.beginPath(); c.ellipse(0, 26, 24, 22, 0, Math.PI, TAU); c.fill(); c.stroke();
      if (ex) { hose(c, -16, 14, -26, -24 + Math.sin(G.t * 20 + a.ph * 9) * 5, 4, 6); hose(c, 16, 14, 26, -24 + Math.cos(G.t * 20 + a.ph * 9) * 5, -4, 6); }
      if (a.type === 0) { circ(c, -13, -14, 7, a.col, 3); circ(c, 13, -14, 7, a.col, 3); }
      else if (a.type === 1) { ell(c, -8, -30, 5, 16, -.15, a.col, 3); ell(c, 8, -30, 5, 16, .15, a.col, 3); }
      else if (a.type === 2) { c.beginPath(); c.moveTo(-14, -8); c.lineTo(-10, -26); c.lineTo(-2, -14); c.moveTo(14, -8); c.lineTo(10, -26); c.lineTo(2, -14); c.fill(); c.stroke(); }
      circ(c, 0, -2, 16, a.col, 3);
      c.fillStyle = 'rgba(243,227,195,.85)'; c.beginPath(); c.arc(-5, -4, 2.6, 0, TAU); c.arc(5, -4, 2.6, 0, TAU); c.fill();
      c.restore();
    }
    this.floor.draw(c, -par * 6, 552);
  },
  drawFront(c) {
    // bunting & lanterns (swaying)
    for (let s = 0; s < 2; s++) {
      const y0 = 150 + s * 22, sway = Math.sin(G.t * 1.3 + s) * 6;
      c.beginPath(); c.moveTo(-10, y0 - 40); c.quadraticCurveTo(640, y0 + 70 + sway, 1290, y0 - 40); inkS(c, 3); c.stroke();
      for (let i = 1; i < 22; i++) {
        const t = i / 22, x = lerp(-10, 1290, t), y = (1 - t) * (1 - t) * (y0 - 40) + 2 * (1 - t) * t * (y0 + 70 + sway) + t * t * (y0 - 40);
        c.beginPath(); c.moveTo(x - 13, y); c.lineTo(x + 13, y); c.lineTo(x, y + 30); c.closePath(); c.fillStyle = [C.red, C.mustard, C.teal, C.cream][(i + s) % 4]; c.fill(); inkS(c, 2.5); c.stroke();
      }
    }
    for (const l of this.lanterns) {
      const a = Math.sin(G.t * 1.6 + l.ph) * .12, len = 110, x = l.x + Math.sin(a) * len, y = Math.cos(a) * len;
      inkS(c, 2.5); c.beginPath(); c.moveTo(l.x, 0); c.lineTo(x, y); c.stroke();
      c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y + 18, 4, x, y + 18, 70); g.addColorStop(0, 'rgba(255,210,120,.35)'); g.addColorStop(1, 'rgba(255,210,120,0)'); c.fillStyle = g; c.fillRect(x - 70, y - 52, 140, 140); c.restore();
      ell(c, x, y + 18, 16, 20, 0, '#e7b04d', 3.5); c.fillStyle = C.ink; c.fillRect(x - 10, y - 4, 20, 5); c.fillRect(x - 8, y + 36, 16, 5);
    }
  }
};

// ---------------- SKY, CLOUDS, ISLANDS ----------------
const Sky = {
  init() {
    if (this.bg) return;
    this.bg = staticLayer(1280, 720, 0, 0, c => {
      const g = c.createLinearGradient(0, 0, 0, 720); g.addColorStop(0, '#e8c98c'); g.addColorStop(.5, '#e6d7b0'); g.addColorStop(1, '#93b8ad');
      c.fillStyle = g; c.fillRect(0, 0, 1280, 720);
      const sg = c.createRadialGradient(980, 150, 20, 980, 150, 260); sg.addColorStop(0, 'rgba(255,246,220,.95)'); sg.addColorStop(.25, 'rgba(255,240,205,.55)'); sg.addColorStop(1, 'rgba(255,240,205,0)');
      c.fillStyle = sg; c.fillRect(600, 0, 680, 500);
      circ(c, 980, 150, 54, '#f8ecc8', 4);
      c.save(); c.globalAlpha = .25; inkS(c, 3); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; c.beginPath(); c.moveTo(980 + Math.cos(a) * 70, 150 + Math.sin(a) * 70); c.lineTo(980 + Math.cos(a) * 110, 150 + Math.sin(a) * 110); c.stroke(); } c.restore();
      watercolor(c, 1280, 720, 40, '#7a5a30', 5);
    });
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      const r = seeded(100 + i), w = 200 + r() * 220, h = 90 + r() * 40, blobs = [];
      for (let k = 0; k < 7; k++) blobs.push([-w / 2 + 40 + (k / 6) * (w - 80), -h * .35 - Math.sin(k / 6 * Math.PI) * h * .45 + r() * 10, 26 + Math.sin(k / 6 * Math.PI) * 30 + r() * 16]);
      this.clouds.push({ w, h, spr: staticLayer(w + 80, h + 80, (w + 80) / 2, h + 30, c => {
        for (const b of blobs) { c.beginPath(); c.arc(b[0], b[1], b[2] + 3.5, 0, TAU); c.fillStyle = C.ink; c.fill(); }
        c.beginPath(); c.ellipse(0, -10, w / 2 + 3.5, 26 + 3.5, 0, 0, TAU); c.fill();
        c.fillStyle = C.cream; for (const b of blobs) { c.beginPath(); c.arc(b[0], b[1], b[2], 0, TAU); c.fill(); } c.beginPath(); c.ellipse(0, -10, w / 2, 26, 0, 0, TAU); c.fill();
        c.fillStyle = 'rgba(176,129,79,.22)'; c.beginPath(); c.ellipse(0, 0, w / 2 - 6, 14, 0, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,252,240,.6)'; for (const b of blobs.slice(1, 4)) { c.beginPath(); c.arc(b[0] - b[2] * .3, b[1] - b[2] * .35, b[2] * .35, 0, TAU); c.fill(); }
      }) });
    }
    this.islands = [0, 1, 2, 3].map(i => this.makeIsland(i));
  },
  makeIsland(kind) {
    const r = seeded(40 + kind), w = kind === 3 ? 360 : 180 + r() * 90;
    return staticLayer(w + 120, 420, (w + 120) / 2, 110, c => {
      // rock cone
      c.beginPath(); c.moveTo(-w / 2, 0);
      const pts = 9; for (let i = 1; i < pts; i++) { const t = i / pts; c.lineTo(-w / 2 + t * w, t < .5 ? t * 2 * 150 * (0.8 + r() * .4) : (1 - t) * 2 * 150 * (0.8 + r() * .4)); }
      c.lineTo(w / 2, 0); c.lineTo(8, 250 + r() * 40); c.lineTo(-8, 240); c.closePath();
      c.fillStyle = '#8a6440'; c.fill(); inkS(c, 5); c.stroke();
      c.save(); c.clip(); c.fillStyle = 'rgba(40,20,6,.25)'; c.fillRect(0, 0, w, 300);
      inkS(c, 2.5); for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(-w / 2, k * 45); c.quadraticCurveTo(0, k * 45 + 16, w / 2, k * 45 - 4); c.stroke(); } c.restore();
      // vines
      c.strokeStyle = C.tealD; c.lineWidth = 3.5; for (let k = 0; k < 5; k++) { const x = -w / 2 + 20 + r() * (w - 40); c.beginPath(); c.moveTo(x, 6); c.quadraticCurveTo(x + 10, 40, x - 4, 50 + r() * 60); c.stroke(); }
      // grass cap
      c.beginPath(); c.ellipse(0, 0, w / 2 + 10, 20, 0, 0, TAU); c.fillStyle = '#7b9656'; c.fill(); inkS(c, 5); c.stroke();
      c.fillStyle = '#9ab36c'; c.beginPath(); c.ellipse(-10, -4, w / 2 - 20, 9, 0, 0, TAU); c.fill();
      if (kind === 3) { // big top tent island
        c.save(); c.translate(0, -8);
        c.beginPath(); c.moveTo(-120, 0); c.lineTo(-120, -60); c.quadraticCurveTo(-60, -80, 0, -160); c.quadraticCurveTo(60, -80, 120, -60); c.lineTo(120, 0); c.closePath(); c.fillStyle = C.cream; c.fill();
        c.save(); c.clip(); for (let k = -6; k < 6; k += 2) { c.beginPath(); c.moveTo(0, -160); c.lineTo(k * 24, 0); c.lineTo(k * 24 + 24, 0); c.closePath(); c.fillStyle = C.red; c.fill(); } c.restore();
        inkS(c, 5); c.beginPath(); c.moveTo(-120, 0); c.lineTo(-120, -60); c.quadraticCurveTo(-60, -80, 0, -160); c.quadraticCurveTo(60, -80, 120, -60); c.lineTo(120, 0); c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(0, -160); c.lineTo(0, -200); c.stroke(); c.beginPath(); c.moveTo(0, -200); c.lineTo(36, -190); c.lineTo(0, -178); c.closePath(); c.fillStyle = C.mustard; c.fill(); c.stroke();
        c.beginPath(); c.moveTo(-26, 0); c.quadraticCurveTo(0, -60, 26, 0); c.closePath(); c.fillStyle = C.ink; c.fill();
        c.restore();
      } else {
        const trees = 2 + (r() * 2 | 0);
        for (let k = 0; k < trees; k++) {
          const x = -w / 2 + 30 + r() * (w - 60), h = 60 + r() * 40, lean = (r() - .5) * 30;
          hose(c, x, 0, x + lean, -h, lean * .4, 9, C.brown);
          for (let l = 0; l < 5; l++) { const a = -Math.PI / 2 + (l - 2) * .6; c.save(); c.translate(x + lean, -h); c.rotate(a + Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(24, -18, 46, 6); c.quadraticCurveTo(22, -4, 0, 0); c.fillStyle = C.teal; c.fill(); inkS(c, 3); c.stroke(); c.restore(); }
        }
        if (kind === 1) { c.fillStyle = C.paper; c.fillRect(-20, -34, 40, 34); inkS(c, 4); c.strokeRect(-20, -34, 40, 34); c.beginPath(); c.moveTo(-28, -32); c.lineTo(0, -58); c.lineTo(28, -32); c.closePath(); c.fillStyle = C.red; c.fill(); c.stroke(); }
      }
    });
  },
  drawCloud(c, i, x, y, s = 1, tint) { c.save(); c.translate(x, y); c.scale(s, s); this.clouds[i % 6].spr.draw(c, 0, 0, tint); c.restore(); },
  drawIsland(c, i, x, y, s = 1, tint) { c.save(); c.translate(x, y); c.scale(s, s); this.islands[i].draw(c, 0, 0, tint); c.restore(); }
};

// ---------------- THE PEANUT EXPRESS ----------------
function wheel(c, x, y, r, rot, col = C.red) {
  circ(c, x, y, r, col, 4.5); circ(c, x, y, r * .7, null, 2.5);
  inkS(c, 3); for (let k = 0; k < 6; k++) { const a = rot + k / 6 * TAU; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * .7, y + Math.sin(a) * r * .7); c.stroke(); }
  circ(c, x, y, r * .2, C.mustard, 2.5);
}
const Train = {
  init() {
    if (this.loco) return;
    this.loco = staticLayer(300, 200, 150, 170, c => {
      c.fillStyle = C.ink; c.fillRect(-118, -44, 236, 16);
      c.beginPath(); c.moveTo(110, -44); c.lineTo(146, -10); c.lineTo(110, -10); c.closePath(); c.fillStyle = C.mustard; c.fill(); inkS(c, 4); c.stroke();
      inkS(c, 2); for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(114 + k * 8, -40 + k * 2); c.lineTo(114 + k * 8, -12); c.stroke(); }
      roundRect(c, -46, -104, 150, 60, 22); c.fillStyle = C.teal; c.fill(); inkS(c, 5); c.stroke();
      c.fillStyle = C.mustard; for (const x of [-10, 40, 80]) { c.fillRect(x, -104, 9, 60); inkS(c, 2.5); c.strokeRect(x, -104, 9, 60); }
      circ(c, 104, -74, 30, '#2a2a2a', 5); starPath(c, 104, -74, 14, 6, 5); c.fillStyle = C.mustard; c.fill(); inkS(c, 2.5); c.stroke();
      // funnel
      c.beginPath(); c.moveTo(56, -104); c.lineTo(60, -130); c.quadraticCurveTo(44, -150, 50, -164); c.lineTo(90, -164); c.quadraticCurveTo(96, -150, 80, -130); c.lineTo(84, -104); c.closePath(); c.fillStyle = '#2a2a2a'; c.fill(); inkS(c, 4.5); c.stroke();
      c.fillStyle = C.mustard; c.fillRect(50, -166, 40, 8); inkS(c, 3); c.strokeRect(50, -166, 40, 8);
      ell(c, 16, -106, 18, 14, 0, C.mustard, 4);
      // headlamp
      c.fillStyle = C.mustard; c.fillRect(92, -124, 24, 18); inkS(c, 3.5); c.strokeRect(92, -124, 24, 18); circ(c, 116, -115, 7, C.cream, 3);
      // cab
      c.fillStyle = C.red; c.fillRect(-116, -148, 74, 104); inkS(c, 5); c.strokeRect(-116, -148, 74, 104);
      c.fillStyle = C.ink; c.fillRect(-124, -158, 90, 12);
      c.fillStyle = C.paper; c.fillRect(-104, -136, 50, 40); inkS(c, 4); c.strokeRect(-104, -136, 50, 40);
      c.fillStyle = C.mustard; c.fillRect(-116, -74, 74, 10);
      text(c, 'P.E.', -79, -56, 16, { color: C.cream });
    });
    this.coach = staticLayer(240, 180, 120, 160, c => {
      c.fillStyle = C.ink; c.fillRect(-100, -44, 200, 14);
      c.beginPath(); c.moveTo(-100, -130); c.quadraticCurveTo(0, -156, 100, -130); c.lineTo(100, -120); c.lineTo(-100, -120); c.closePath(); c.fillStyle = C.red; c.fill(); inkS(c, 4.5); c.stroke();
      c.fillStyle = C.tealD; c.fillRect(-96, -122, 192, 80); inkS(c, 5); c.strokeRect(-96, -122, 192, 80);
      c.fillStyle = C.mustard; c.fillRect(-96, -58, 192, 8);
      for (let k = 0; k < 4; k++) { const x = -86 + k * 46; c.fillStyle = 'rgba(40,20,8,.9)'; c.fillRect(x, -112, 34, 42); inkS(c, 3.5); c.strokeRect(x, -112, 34, 42); }
    });
    this.caboose = staticLayer(220, 170, 110, 150, c => {
      c.fillStyle = C.ink; c.fillRect(-86, -44, 172, 14);
      const r = seeded(9);
      for (let k = 0; k < 16; k++) drawBananaCoin(c, -64 + r() * 128, -96 - r() * 30, 1.2 + r() * .5, r() * 6);
      c.fillStyle = '#b07a3e'; c.fillRect(-84, -96, 168, 54); inkS(c, 5); c.strokeRect(-84, -96, 168, 54);
      inkS(c, 2.5); for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(-84, -96 + k * 13.5); c.lineTo(84, -96 + k * 13.5); c.stroke(); }
      c.beginPath(); c.moveTo(-84, -96); c.lineTo(84, -42); c.moveTo(84, -96); c.lineTo(-84, -42); c.stroke();
      c.fillStyle = C.cream; c.fillRect(-38, -84, 76, 26); inkS(c, 3); c.strokeRect(-38, -84, 76, 26); text(c, 'BANANAS', 0, -70, 15, { color: C.redD });
    });
    this.pax = [0, 1, 2, 3].map(i => ({ type: i, ph: i * 1.3 }));
  },
  drawLoco(c, x, y, ang, rot, t) {
    c.save(); c.translate(x, y); c.rotate(ang);
    this.loco.draw(c, 0, 0);
    c.save(); c.beginPath(); c.rect(-104, -136, 50, 40); c.clip(); drawBongoHead(c, -76, -104, .78, Math.sin(t * 3) * .08); c.restore();
    inkS(c, 4); c.strokeRect(-104, -136, 50, 40);
    wheel(c, -80, -24, 18, rot * 1.4); wheel(c, -10, -28, 26, rot); wheel(c, 54, -28, 26, rot); wheel(c, 108, -18, 13, rot * 2);
    const px = Math.cos(rot) * 12, py = Math.sin(rot) * 12;
    inkS(c, 7); c.beginPath(); c.moveTo(-10 + px, -28 + py); c.lineTo(54 + px, -28 + py); c.stroke(); c.strokeStyle = C.mustard; c.lineWidth = 3; c.stroke();
    c.restore();
  },
  drawCoach(c, x, y, ang, rot, t, jostle) {
    c.save(); c.translate(x, y); c.rotate(ang);
    this.coach.draw(c, 0, 0);
    // passengers bobbing in windows
    for (let k = 0; k < 4; k++) {
      const wx = -69 + k * 46, b = Math.sin(t * 6 + k * 1.7) * 2 + (jostle ? Math.sin(t * 30 + k) * jostle * 7 : 0);
      c.save(); c.beginPath(); c.rect(wx - 17, -112, 34, 42); c.clip();
      const col = ['#8a6a4a', '#b8a58a', '#6f7a70', '#a07850'][k];
      if (k === 1) { ell(c, wx - 6, -104 + b, 4, 12, -.2, col, 2.5); ell(c, wx + 6, -104 + b, 4, 12, .2, col, 2.5); }
      else { circ(c, wx - 10, -96 + b, 6, col, 2.5); circ(c, wx + 10, -96 + b, 6, col, 2.5); }
      circ(c, wx, -86 + b, 13, col, 3);
      pieEye(c, wx - 4, -89 + b, 2.4, 4, .4, 0, jostle > .6 ? 'x' : 'open'); pieEye(c, wx + 5, -89 + b, 2.4, 4, .4, 0, jostle > .6 ? 'x' : 'open');
      inkS(c, 2); c.beginPath(); jostle > .3 ? c.arc(wx, -76 + b, 4, Math.PI + .3, TAU - .3) : c.arc(wx, -82 + b, 4, .3, Math.PI - .3); c.stroke();
      c.restore();
    }
    wheel(c, -60, -24, 17, rot * 1.5); wheel(c, 60, -24, 17, rot * 1.5);
    c.restore();
  },
  drawCaboose(c, x, y, ang, rot) {
    c.save(); c.translate(x, y); c.rotate(ang); this.caboose.draw(c, 0, 0); wheel(c, -50, -24, 17, rot * 1.5); wheel(c, 50, -24, 17, rot * 1.5); c.restore();
  }
};

// ---------------- STATION PLATFORM ----------------
function drawPlatform(c, x0, x1, y, sign, t) {
  c.fillStyle = '#7a5231'; c.fillRect(x0, y, x1 - x0, 26); inkS(c, 5); c.strokeRect(x0, y, x1 - x0, 26);
  inkS(c, 2.5); for (let x = x0 + 30; x < x1; x += 40) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 26); c.stroke(); }
  for (let x = x0 + 30; x < x1; x += 140) { c.fillStyle = '#5a3a20'; c.fillRect(x - 8, y + 26, 16, 90); inkS(c, 4); c.strokeRect(x - 8, y + 26, 16, 90); }
  // lamp post
  const lx = x0 + 60; c.fillStyle = C.ink; c.fillRect(lx - 5, y - 150, 10, 150); ell(c, lx, y - 160, 16, 20, 0, '#e7b04d', 4);
  c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(lx, y - 160, 5, lx, y - 160, 90); g.addColorStop(0, 'rgba(255,210,120,.4)'); g.addColorStop(1, 'rgba(255,210,120,0)'); c.fillStyle = g; c.fillRect(lx - 90, y - 250, 180, 180); c.restore();
  // hanging sign
  const sx = (x0 + x1) / 2, sw = Math.sin(t * 1.2) * .03;
  c.save(); c.translate(sx, y - 170); c.rotate(sw);
  inkS(c, 3); c.beginPath(); c.moveTo(-90, -40); c.lineTo(-80, 0); c.moveTo(90, -40); c.lineTo(80, 0); c.stroke();
  roundRect(c, -130, 0, 260, 50, 10); c.fillStyle = C.cream; c.fill(); inkS(c, 5); c.stroke();
  text(c, sign, 0, 27, 24, { color: C.redD });
  c.restore();
}
