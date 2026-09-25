'use strict';
// Title, storybook, station/map, ticket booth, settings, pause, results.
function openOverlay(o) { o.prev = G.overlay; o.t = 0; G.overlay = o; o.open?.(); }
function closeOverlay() { const o = G.overlay; G.overlay = o ? o.prev : null; }
function dim(c, a = .55) { c.fillStyle = `rgba(14,8,3,${a})`; c.fillRect(0, 0, W, H); }
function coinPill(c, x, y, n) {
  roundRect(c, x, y, 150, 50, 25); c.fillStyle = C.cream; c.fill(); inkS(c, 4); c.stroke();
  drawCoinIcon(c, x + 26, y + 25, 17); text(c, String(n), x + 94, y + 27, 26, { color: C.ink });
}

// ---------------- SETTINGS ----------------
const SettingsOverlay = {
  update(dt) { this.t += dt; },
  draw(c) {
    dim(c, .6); const S = G.settings, x = 340, y = 90, k = ease.outBack(Math.min(1, this.t * 4));
    c.save(); c.translate(640, 360); c.scale(k, k); c.translate(-640, -360);
    card(c, x, y, 600, 540, C.cream, 6, 20);
    text(c, 'SETTINGS', 640, y + 56, 44, { color: C.redD });
    const rows = [['Music', 'music'], ['Sound effects', 'sfx']];
    rows.forEach(([lab, key], i) => {
      const yy = y + 110 + i * 78; text(c, lab, x + 60, yy + 30, 30, { align: 'left', face: 'body' });
      button(c, 'st-' + key + '-', x + 330, yy, 56, 56, '–', () => { S[key] = Math.max(0, Math.round((S[key] - .1) * 10) / 10); AudioSys.applyVolumes(); G.persist(); });
      text(c, Math.round(S[key] * 100) + '%', x + 440, yy + 30, 26);
      button(c, 'st-' + key + '+', x + 494, yy, 56, 56, '+', () => { S[key] = Math.min(1, Math.round((S[key] + .1) * 10) / 10); AudioSys.applyVolumes(); G.persist(); });
    });
    [['Old-film look', 'film'], ['Screen shake', 'shake'], ['Vibration', 'vibe']].forEach(([lab, key], i) => {
      const yy = y + 266 + i * 70; text(c, lab, x + 60, yy + 28, 30, { align: 'left', face: 'body' });
      button(c, 'st-' + key, x + 390, yy, 160, 56, S[key] ? 'On' : 'Off', () => { S[key] = !S[key]; G.persist(); }, { fill: S[key] ? C.mustard : '#cdbb98' });
    });
    button(c, 'st-done', 540, y + 464, 200, 60, 'Done', closeOverlay, { primary: true });
    c.restore();
  }
};

// ---------------- PAUSE ----------------
const PauseOverlay = {
  open() { AudioSys.suspend(); },
  update(dt) { this.t += dt; },
  draw(c) {
    dim(c, .6); const k = ease.outBack(Math.min(1, this.t * 4));
    c.save(); c.translate(640, 360); c.scale(k, k); c.translate(-640, -360);
    card(c, 420, 110, 440, 500, C.cream, 6, 20);
    text(c, 'PAUSED', 640, 170, 50, { color: C.redD });
    const resume = () => { closeOverlay(); AudioSys.resume(); };
    button(c, 'p-res', 490, 220, 300, 70, 'Resume', resume, { primary: true });
    if (G.sceneName === 'fight') button(c, 'p-retry', 490, 306, 300, 70, 'Retry', () => { closeOverlay(); AudioSys.resume(); G.go('fight', null, true); });
    button(c, 'p-set', 490, G.sceneName === 'fight' ? 392 : 306, 300, 70, 'Settings', () => { AudioSys.resume(); openOverlay(SettingsOverlay); });
    button(c, 'p-quit', 490, G.sceneName === 'fight' ? 478 : 392, 300, 70, 'Quit to Station', () => { closeOverlay(); AudioSys.resume(); G.go('station'); });
    c.restore();
  }
};
function pauseButton(c) {
  button(c, 'pause', 612, 12, 56, 56, '', () => { if (!G.overlay) openOverlay(PauseOverlay); }, { fill: C.cream });
  c.fillStyle = C.ink; c.fillRect(630, 28, 7, 24); c.fillRect(643, 28, 7, 24);
}

// ---------------- TITLE ----------------
G.scenes.title = {
  enter() { this.t = 0; AudioSys.play('title'); BigTop.init(); Sky.init(); Train.init(); },
  update(dt) { this.t += dt; },
  draw(c) {
    const t = this.t;
    // back wall & spotlight
    c.fillStyle = '#2a120a'; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(640, 560, 40, 640, 520, 420); g.addColorStop(0, 'rgba(255,226,160,.6)'); g.addColorStop(1, 'rgba(255,226,160,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = '#6a4326'; c.fillRect(0, 590, W, 130); inkS(c, 5); c.beginPath(); c.moveTo(0, 590); c.lineTo(W, 590); c.stroke();
    c.fillStyle = 'rgba(255,230,170,.25)'; c.beginPath(); c.ellipse(640, 640, 260, 40, 0, 0, TAU); c.fill();
    // curtains
    const open = ease.outCubic(Math.min(1, t / 1.6)) * 180;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 7; i++) {
        const x0 = side < 0 ? -open + i * 60 - 20 : W + open - (i + 1) * 60 + 20;
        const fg = c.createLinearGradient(x0, 0, x0 + 60, 0); fg.addColorStop(0, '#4d130d'); fg.addColorStop(.5, '#a82a1e'); fg.addColorStop(1, '#4d130d');
        c.fillStyle = fg; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + 60, 0); c.quadraticCurveTo(x0 + 70 + side * 10, 400, x0 + 64 + side * 16, 720); c.lineTo(x0 + side * 16, 720); c.closePath(); c.fill();
      }
    }
    // valance
    c.fillStyle = C.redD; c.fillRect(0, 0, W, 70);
    c.beginPath(); c.moveTo(0, 70); for (let x = 0; x <= W; x += 80) c.quadraticCurveTo(x + 40, 116, x + 80, 70); c.lineTo(W, 0); c.lineTo(0, 0); c.closePath(); c.fillStyle = '#8f231a'; c.fill(); inkS(c, 5); c.stroke();
    c.fillStyle = C.mustard; for (let x = 40; x < W; x += 80) { c.beginPath(); c.arc(x, 100, 8, 0, TAU); c.fill(); inkS(c, 3); c.stroke(); }
    // logo
    const word = 'BANANA JIG', n = word.length;
    c.font = font(112); const tw = c.measureText(word).width; let x = 640 - tw / 2;
    for (let i = 0; i < n; i++) {
      const ch = word[i], w = c.measureText(ch).width, a = (x + w / 2 - 640) / 900;
      const drop = Math.max(0, 1 - Math.max(0, t - .3 - i * .06) * 3), y = 215 + Math.pow((x + w / 2 - 640) / 440, 2) * 40 - drop * 400 - Math.abs(Math.sin((G.beat + i * .12) * Math.PI)) * 6;
      c.save(); c.translate(x + w / 2, y); c.rotate(a);
      text(c, ch, 6, 8, 112, { color: C.redD, outline: 14 }); text(c, ch, 0, 0, 112, { color: C.cream, outline: 10 });
      c.restore(); x += w;
    }
    const rk = ease.outBack(clamp((t - 1) * 2.5, 0, 1));
    c.save(); c.translate(640, 318); c.scale(rk, rk);
    roundRect(c, -300, -26, 600, 52, 10); c.fillStyle = C.mustard; c.fill(); inkS(c, 5); c.stroke();
    text(c, 'Episode One  ·  Peel Out at the Big Top', 0, 3, 24, { color: C.ink });
    c.restore();
    Art.drawBongo(c, 640, 612, { pose: 'dance', t: G.t, face: Math.sin(G.t * 1.2) > 0 ? 1 : -1, scale: 1.25 });
    if (t > 1.2) {
      button(c, 't-start', 180, 470, 260, 80, 'Start', () => G.go(G.save.seenStory ? 'station' : 'story'), { primary: true });
      button(c, 't-set', 840, 470, 260, 80, 'Settings', () => openOverlay(SettingsOverlay));
    }
    const best = G.save.best.bigtop;
    text(c, best ? `Best grade: ${best}` : 'A one-level demo · landscape · touch or keyboard', 640, 694, 20, { face: 'body', color: C.cream });
  }
};

// ---------------- STORYBOOK ----------------
const STORY = {
  intro: [
    { txt: 'Bongo was the littlest monkey in the Topsy-Turvy Traveling Circus. Every night he cranked the organ for the crooked Ringmaster Rex.', art: 'organ' },
    { txt: 'One night he overheard the Ringmaster\'s plan: every banana in the jungle, locked in the circus vault, to be sold back at triple the price!', art: 'vault' },
    { txt: 'So Bongo swiped the key, fired up the old Peanut Express, and set off down the Canopy Line to win the harvest back, one performer at a time.', art: 'train' }
  ],
  ending: [
    { txt: 'Madame Tusk is out of the act, and the first crate of bananas is back where it belongs!', art: 'win' },
    { txt: 'But up the line, on Coconut Cove, Rex\'s knife-juggling toucans are sharpening their beaks... To be continued! (End of demo.)', art: 'teaser' }
  ]
};
function storyArt(c, kind, t) {
  // drawn inside a 1000x360 frame whose origin is its top-left
  if (kind === 'organ' || kind === 'vault') {
    const g = c.createLinearGradient(0, 0, 0, 360); g.addColorStop(0, '#5a2a18'); g.addColorStop(1, '#b0814f'); c.fillStyle = g; c.fillRect(0, 0, 1000, 360);
    for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? 'rgba(178,64,46,.5)' : 'rgba(240,222,186,.25)'; c.beginPath(); c.moveTo(500, -200); c.lineTo(i * 90 - 40, 360); c.lineTo(i * 90 + 50, 360); c.closePath(); c.fill(); }
    c.fillStyle = '#8a5a30'; c.fillRect(0, 300, 1000, 60);
  }
  if (kind === 'organ') {
    drawRex(c, 720, 330, .78, Math.sin(t * 2));
    c.fillStyle = '#8a4a26'; c.fillRect(280, 220, 120, 80); inkS(c, 5); c.strokeRect(280, 220, 120, 80);
    c.fillStyle = C.mustard; for (let k = 0; k < 5; k++) { c.fillRect(292 + k * 21, 232, 12, 40); inkS(c, 2); c.strokeRect(292 + k * 21, 232, 12, 40); }
    wheel(c, 300, 306, 16, t); wheel(c, 380, 306, 16, t);
    const cr = t * 5; inkS(c, 5); c.beginPath(); c.moveTo(400, 250); c.lineTo(400 + Math.cos(cr) * 24, 250 + Math.sin(cr) * 24); c.stroke();
    Art.drawBongoDirect(c, 450, 320, { pose: 'idle', t, face: -1, scale: 1.1 });
    for (let k = 0; k < 3; k++) { const p = (t * .6 + k / 3) % 1; text(c, '♪', 340 + k * 30 + p * 60, 200 - p * 120, 34, { color: C.cream, outline: 5 }); }
  } else if (kind === 'vault') {
    circ(c, 320, 200, 140, '#8d8a80', 7); circ(c, 320, 200, 110, '#a8a499', 4);
    const r = seeded(4); c.save(); c.beginPath(); c.arc(320, 200, 104, 0, TAU); c.clip(); c.fillStyle = '#3a2412'; c.fillRect(200, 80, 240, 240);
    for (let k = 0; k < 40; k++) drawBananaCoin(c, 230 + r() * 180, 150 + r() * 160, 1.2, r() * 6); c.restore();
    inkS(c, 8); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + t * .3; c.beginPath(); c.moveTo(320 + Math.cos(a) * 120, 200 + Math.sin(a) * 120); c.lineTo(320 + Math.cos(a) * 138, 200 + Math.sin(a) * 138); c.stroke(); }
    drawRex(c, 700, 330, .72, 1 + Math.sin(t * 3));
    text(c, '×3 PRICE!', 700, 60, 40, { color: C.cream, outline: 7 });
    c.save(); c.globalAlpha = .9; Art.drawBongoDirect(c, 520, 320 + Math.sin(t * 4) * 3, { pose: 'idle', t, face: 1, scale: .9 }); c.restore();
    text(c, '!', 540, 170, 44, { color: C.mustard, outline: 6 });
  } else if (kind === 'train' || kind === 'teaser') {
    Sky.bg.draw(c, 0, -120);
    Sky.drawCloud(c, 1, 160, 330, 1.3); Sky.drawCloud(c, 3, 820, 350, 1.4);
    if (kind === 'train') {
      Sky.drawIsland(c, 3, 830, 170 + Math.sin(t) * 6, .55);
      Sky.drawIsland(c, 1, 120, 120 + Math.sin(t + 1) * 6, .5);
      inkS(c, 6); c.beginPath(); c.moveTo(0, 290); c.quadraticCurveTo(500, 250, 1000, 280); c.stroke();
      c.save(); c.translate(560, 270); c.scale(.6, .6); Train.drawLoco(c, 0, 0, -.02, t * 6, t); Train.drawCoach(c, -230, 6, -.03, t * 6, t, 0); c.restore();
      Art.drawBongoDirect(c, 700, 250, { pose: 'wave', t, face: -1, scale: .7 });
    } else {
      Sky.drawIsland(c, 0, 640, 180 + Math.sin(t) * 5, .8, 'rgba(60,40,30,.45)');
      for (let k = 0; k < 3; k++) { const x = 560 + k * 70, y = 90 + Math.sin(t * 3 + k) * 8; ell(c, x, y, 18, 14, 0, C.ink, 0); c.beginPath(); c.moveTo(x + 14, y - 4); c.quadraticCurveTo(x + 44, y, x + 16, y + 8); c.fillStyle = C.mustard; c.fill(); inkS(c, 3); c.stroke(); circ(c, x + 4, y - 4, 3, C.white, 0); }
      text(c, '?', 380, 120, 70, { color: C.cream, outline: 8 });
    }
  } else if (kind === 'win') {
    const g = c.createLinearGradient(0, 0, 0, 360); g.addColorStop(0, '#5a2a18'); g.addColorStop(1, '#b0814f'); c.fillStyle = g; c.fillRect(0, 0, 1000, 360);
    Art.drawTusk(c, 700, 330, { pose: 'ko', t, scale: .55 });
    for (let k = 0; k < 4; k++) { const a = t * 3 + k / 4 * TAU; starPath(c, 690 + Math.cos(a) * 60, 150 + Math.sin(a) * 16, 11, 5, 5); c.fillStyle = C.mustard; c.fill(); inkS(c, 2.5); c.stroke(); }
    const r = seeded(8); c.fillStyle = '#b07a3e'; c.fillRect(220, 250, 180, 70); inkS(c, 5); c.strokeRect(220, 250, 180, 70);
    for (let k = 0; k < 12; k++) drawBananaCoin(c, 240 + r() * 140, 244 - r() * 30, 1.3, r() * 6);
    Art.drawBongoDirect(c, 470, 322, { pose: 'win', t, face: -1, scale: 1 });
  }
}
G.scenes.story = {
  enter(arg) { this.set = arg || 'intro'; this.pages = STORY[this.set]; this.i = 0; this.flip = 0; this.t = 0; AudioSys.play('title'); },
  next() {
    if (this.flip) return;
    if (this.i >= this.pages.length - 1) { this.finish(); return; }
    this.flip = .001; AudioSys.sfx('page');
  },
  finish() { if (this.set === 'intro') { G.save.seenStory = true; G.persist(); } G.go('station'); },
  onUp(p) { this.next(); },
  update(dt) {
    this.t += dt;
    if (this.flip) { this.flip += dt / .5; if (this.flip >= .5 && !this.swapped) { this.i++; this.swapped = true; } if (this.flip >= 1) { this.flip = 0; this.swapped = false; } }
    if (G.pressed.Space || G.pressed.ArrowRight) this.next();
  },
  draw(c) {
    c.fillStyle = '#3a1d10'; c.fillRect(0, 0, W, H);
    watercolor(c, W, H, 0, '#000', 1);
    const k = this.flip ? Math.abs(Math.cos(this.flip * Math.PI)) : 1;
    c.save(); c.translate(140, 0); c.scale(k, 1); c.translate(-140, 0);
    card(c, 140, 40, 1000, 610, C.cream, 6, 16);
    c.save(); c.beginPath(); c.rect(180, 76, 920, 330); c.clip(); c.translate(180, 76); c.scale(.92, .92); storyArt(c, this.pages[this.i].art, this.t); c.restore();
    inkS(c, 5); c.strokeRect(180, 76, 920, 330);
    wrapText(c, this.pages[this.i].txt, 640, 460, 860, 32, 42, { face: 'body', color: C.ink });
    text(c, `${this.i + 1} / ${this.pages.length}`, 640, 620, 20, { face: 'body', color: C.sepia });
    if (this.flip) { c.fillStyle = `rgba(20,10,4,${.35 * (1 - k)})`; c.fillRect(140, 40, 1000, 610); }
    c.restore();
    button(c, 'sk', 1150, 16, 116, 50, 'Skip', () => this.finish(), { size: 22 });
    if (!this.flip && Math.sin(G.t * 5) > -.3) text(c, 'Tap to turn the page ›', 1130, 690, 22, { face: 'body', color: C.cream, align: 'right' });
  }
};

// ---------------- STATION & ROUTE MAP ----------------
const ISLANDS = [
  { id: 'home', name: 'Banana Junction', x: 118, y: 300, art: 1, open: true, home: true },
  { id: 'bigtop', name: 'Big Top Isle', x: 300, y: 214, art: 3, open: true },
  { id: 'cove', name: 'Coconut Cove', x: 440, y: 316, art: 2, open: false },
  { id: 'falls', name: 'Thunder Falls', x: 540, y: 196, art: 0, open: false }
];
const BoothOverlay = {
  update(dt) { this.t += dt; },
  draw(c) {
    dim(c, .6); const S = G.save, k = ease.outBack(Math.min(1, this.t * 4));
    c.save(); c.translate(640, 360); c.scale(k, k); c.translate(-640, -360);
    card(c, 330, 100, 620, 500, C.cream, 6, 20);
    text(c, 'TICKET BOOTH', 640, 156, 42, { color: C.redD });
    // charm art
    c.save(); c.translate(460, 300); c.rotate(Math.sin(G.t * 2) * .1);
    circ(c, 0, 0, 62, C.mustard, 5); circ(c, 0, 0, 48, C.cream, 3); drawBananaCoin(c, 0, 4, 2.4, .3);
    c.restore();
    text(c, 'Lucky Peel charm', 560, 250, 32, { align: 'left' });
    wrapText(c, 'A banana peel on a string. Gives Bongo one extra heart in boss fights.', 560, 296, 340, 24, 30, { face: 'body', align: 'left' });
    if (!S.charmOwned) {
      const can = S.coins >= 100;
      button(c, 'b-buy', 470, 440, 340, 70, can ? 'Buy for 100 coins' : `Need 100 coins (${S.coins})`, () => { if (!can) { AudioSys.sfx('locked'); return; } S.coins -= 100; S.charmOwned = S.charmOn = true; G.persist(); AudioSys.sfx('buy'); }, { primary: can, disabled: !can, size: 26 });
    } else button(c, 'b-eq', 470, 440, 340, 70, S.charmOn ? 'Equipped ✓' : 'Equip', () => { S.charmOn = !S.charmOn; G.persist(); }, { primary: S.charmOn });
    button(c, 'b-close', 540, 526, 200, 56, 'Close', closeOverlay);
    c.restore();
  }
};
const TeaserOverlay = {
  update(dt) { this.t += dt; },
  draw(c) {
    dim(c, .6); const k = ease.outBack(Math.min(1, this.t * 4));
    c.save(); c.translate(640, 360); c.scale(k, k); c.translate(-640, -360);
    card(c, 330, 150, 620, 400, C.cream, 6, 20);
    text(c, 'TRACK UNDER REPAIR', 640, 206, 36, { color: C.redD });
    wrapText(c, this.msg, 640, 268, 520, 28, 36, { face: 'body' });
    button(c, 'tz', 540, 466, 200, 60, 'OK', closeOverlay, { primary: true });
    c.restore();
  }
};
G.scenes.station = {
  enter() {
    this.t = 0; this.sel = 'bigtop'; this.shake = {}; this.puffT = 0; this.leaving = 0;
    Sky.init(); Train.init(); AudioSys.play('station');
    if (G.save.beaten.bigtop && !G.save.teaserShown) { G.save.teaserShown = true; G.persist(); setTimeout(() => { TeaserOverlay.msg = 'Coconut Cove is next on the line, but the track is still being fixed. Thanks for playing the Banana Jig demo!'; openOverlay(TeaserOverlay); }, 700); }
  },
  mapPos(i) { return { x: 640 + i.x, y: 36 + i.y }; },
  onDown(p) {
    for (const i of ISLANDS) {
      const m = this.mapPos(i);
      if (Math.hypot(p.x - m.x, p.y - m.y) < 58) {
        if (i.home) return;
        if (!i.open) { this.shake[i.id] = .4; AudioSys.sfx('locked'); TeaserOverlay.msg = `The line to ${i.name} is still being built. It opens after this demo!`; openOverlay(TeaserOverlay); return; }
        this.sel = i.id; AudioSys.sfx('card');
      }
    }
  },
  board() {
    if (this.leaving) return; this.leaving = .001; AudioSys.sfx('whistle');
    setTimeout(() => G.go('ride'), 900);
  },
  update(dt) {
    this.t += dt; if (this.leaving) this.leaving += dt;
    for (const k in this.shake) this.shake[k] = Math.max(0, this.shake[k] - dt);
    this.puffT -= dt;
    if (this.puffT <= 0) { this.puffT = this.leaving ? .12 : .9; const tx = 520 + this.leaving * this.leaving * 120; FX.puff(tx + 70 * .72, 640 - 168 * .72, this.leaving ? 3 : 1, { dir: -Math.PI / 2 - .3, spread: .3, sp0: 30, sp1: 70, r0: 10, r1: 18, life: 2 }); }
  },
  draw(c) {
    const t = this.t;
    Sky.bg.draw(c, 0, 0);
    Sky.drawIsland(c, 0, 150, 190 + Math.sin(t * .8) * 6, .45, 'rgba(200,190,160,.45)');
    Sky.drawIsland(c, 2, 480, 260 + Math.sin(t * .7 + 1) * 6, .4, 'rgba(200,190,160,.45)');
    for (let i = 0; i < 4; i++) Sky.drawCloud(c, i, ((i * 380 - t * (8 + i * 3)) % 1700 + 1700) % 1700 - 200, 420 + i * 30, .9 + i * .1);
    // station island ground
    c.fillStyle = '#7b9656'; c.fillRect(0, 648, W, 72); inkS(c, 5); c.beginPath(); c.moveTo(0, 648); c.lineTo(W, 648); c.stroke();
    // track
    c.fillStyle = '#4a2e1c'; for (let x = -10; x < W; x += 34) { c.fillRect(x, 640, 22, 12); }
    inkS(c, 5); c.beginPath(); c.moveTo(0, 640); c.lineTo(W, 640); c.stroke();
    drawPlatform(c, -20, 600, 560, 'BANANA JUNCTION', t);
    // ticket booth
    c.fillStyle = C.red; c.fillRect(80, 450, 110, 110); inkS(c, 5); c.strokeRect(80, 450, 110, 110);
    c.fillStyle = C.paper; c.fillRect(98, 470, 74, 50); c.strokeRect(98, 470, 74, 50);
    c.beginPath(); c.moveTo(72, 452); c.lineTo(135, 410); c.lineTo(198, 452); c.closePath(); c.fillStyle = C.mustard; c.fill(); c.stroke();
    text(c, 'TICKETS', 135, 540, 16, { color: C.cream });
    // parked train
    const tx = 520 + this.leaving * this.leaving * 120, rot = this.leaving * this.leaving * 3;
    c.save(); c.translate(0, 640); c.scale(.72, .72); c.translate(0, -640);
    Train.drawCaboose(c, tx / .72 - 440 + 0, 640, 0, rot); Train.drawCoach(c, tx / .72 - 240, 640, 0, rot, G.t, 0); Train.drawLoco(c, tx / .72, 640, 0, rot, G.t);
    c.restore();
    // map poster
    this.drawMap(c, t);
    coinPill(c, 16, 14, G.save.coins);
    if (G.save.charmOn) { roundRect(c, 176, 14, 176, 50, 25); c.fillStyle = C.cream; c.fill(); inkS(c, 4); c.stroke(); drawBananaCoin(c, 202, 40, 1); text(c, 'Lucky Peel', 280, 41, 18); }
    const isl = ISLANDS.find(i => i.id === this.sel);
    button(c, 'st-board', 690, 494, 290, 78, 'All Aboard!', () => this.board(), { primary: true });
    button(c, 'st-booth', 996, 494, 250, 78, 'Ticket Booth', () => openOverlay(BoothOverlay), { size: 28 });
    text(c, `Next stop: ${isl.name}`, 968, 596, 22, { face: 'body', color: C.ink });
    button(c, 'st-back', 1170, 596, 96, 44, 'Title', () => G.go('title'), { size: 18 });
  },
  drawMap(c, t) {
    const x = 640, y = 36, w = 620, h = 440;
    card(c, x, y, w, h, '#e9d6a8', 6, 10);
    c.save(); c.beginPath(); c.rect(x + 10, y + 10, w - 20, h - 20); c.clip();
    watercolor(c, W, H, 0, '#000', 2);
    c.fillStyle = 'rgba(111,160,150,.28)'; c.fillRect(x + 10, y + 10, w - 20, h - 20);
    for (let k = 0; k < 5; k++) Sky.drawCloud(c, k, x + 60 + k * 130, y + 250 + (k % 2) * 110, .45);
    c.restore();
    text(c, 'THE CANOPY LINE', x + w / 2, y + 44, 38, { color: C.redD, outline: 0 });
    text(c, 'Sky Railway · Route Map', x + w / 2, y + 78, 20, { face: 'body', color: C.ink });
    // rails between islands
    const pts = ISLANDS.map(i => this.mapPos(i));
    const link = (a, b, open) => {
      c.save(); c.setLineDash(open ? [14, 10] : [6, 12]); c.lineDashOffset = open ? -t * 30 : 0; inkS(c, open ? 5 : 3.5); c.globalAlpha = open ? 1 : .55;
      c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo((a.x + b.x) / 2, Math.min(a.y, b.y) - 60, b.x, b.y); c.stroke(); c.restore();
    };
    link(pts[0], pts[1], true); link(pts[1], pts[2], false); link(pts[2], pts[3], false);
    ISLANDS.forEach((i, n) => {
      const m = pts[n], sh = this.shake[i.id] ? Math.sin(G.t * 60) * 8 * this.shake[i.id] / .4 : 0, bob = Math.sin(t * 1.5 + n) * 4;
      Sky.drawIsland(c, i.art, m.x + sh, m.y + bob, i.art === 3 ? .26 : .3, i.open ? null : 'rgba(40,26,16,.6)');
      if (!i.open) { // padlock
        c.save(); c.translate(m.x + sh, m.y - 16 + bob); inkS(c, 5); c.beginPath(); c.arc(0, -10, 12, Math.PI, TAU); c.stroke();
        roundRect(c, -18, -10, 36, 28, 5); c.fillStyle = C.mustard; c.fill(); inkS(c, 4); c.stroke(); circ(c, 0, 3, 4, C.ink, 0); c.restore();
      }
      if (G.save.beaten[i.id]) { starPath(c, m.x + 44, m.y - 56, 20, 9, 5); c.fillStyle = C.mustard; c.fill(); inkS(c, 3.5); c.stroke(); }
      roundRect(c, m.x - 74, m.y + 74, 148, 26, 13); c.fillStyle = i.open ? C.cream : '#cdbb98'; c.fill(); inkS(c, 2.5); c.stroke();
      text(c, i.name, m.x, m.y + 88, 17, { color: i.open ? C.ink : '#6d5d45', face: 'body' });
      if (i.id === this.sel) { const ay = m.y - 68 + Math.sin(G.t * 6) * 6; c.beginPath(); c.moveTo(m.x - 16, ay - 20); c.lineTo(m.x + 16, ay - 20); c.lineTo(m.x, ay); c.closePath(); c.fillStyle = C.red; c.fill(); inkS(c, 4); c.stroke(); }
      if (i.home) text(c, 'YOU ARE HERE', m.x, m.y - 50, 15, { color: C.redD });
    });
  }
};

// ---------------- RESULTS ----------------
function gradeFor(r) {
  let pts = 10;
  pts += clamp((300 - r.time) / 180, 0, 1) * 25;
  pts += (r.hp / r.maxHp) * 25;
  pts += Math.min(3, r.parries) / 3 * 20;
  pts += Math.min(6, r.cards) / 6 * 20;
  const scale = [[95, 'A+'], [88, 'A'], [82, 'A-'], [76, 'B+'], [70, 'B'], [64, 'B-'], [58, 'C+'], [52, 'C'], [0, 'D']];
  return scale.find(s => pts >= s[0])[1];
}
const GRADE_ORDER = ['D', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'];
G.scenes.results = {
  enter(r) {
    this.r = r; this.t = 0; this.stamped = false; this.grade = gradeFor(r);
    const S = G.save, prev = S.best.bigtop; this.newBest = !prev || GRADE_ORDER.indexOf(this.grade) > GRADE_ORDER.indexOf(prev);
    if (this.newBest) S.best.bigtop = this.grade;
    this.reward = 60 + GRADE_ORDER.indexOf(this.grade) * 10; S.coins += this.reward;
    const first = !S.beaten.bigtop; S.beaten.bigtop = true; this.first = first; G.persist();
    AudioSys.play('title'); AudioSys.sfx('win');
  },
  update(dt) {
    this.t += dt;
    const lines = 5;
    for (let i = 0; i < lines; i++) if (this.t > .5 + i * .35 && this.t - dt <= .5 + i * .35) AudioSys.sfx('card');
    if (this.t > 2.6 && !this.stamped) { this.stamped = true; G.addShake(.5); AudioSys.sfx('stomp'); FX.ink(900, 330, 14); }
  },
  draw(c) {
    BigTop.draw(c, 640, 0); dim(c, .45);
    card(c, 380, 60, 820, 600, C.cream, 6, 16);
    text(c, 'THE RESULTS', 790, 120, 52, { color: C.redD });
    const r = this.r, mm = Math.floor(r.time / 60), ss = String(Math.floor(r.time % 60)).padStart(2, '0');
    const rows = [['Time', `${mm}:${ss}`], ['Hearts left', `${r.hp} / ${r.maxHp}`], ['Parries', String(r.parries)], ['Super cards used', String(r.cards)], ['Coins earned', `+${this.reward}`]];
    rows.forEach(([a, b], i) => {
      const k = clamp((this.t - .5 - i * .35) * 4, 0, 1); if (!k) return;
      c.save(); c.globalAlpha = k; c.translate((1 - k) * -30, 0);
      text(c, a, 440, 200 + i * 62, 32, { align: 'left', face: 'body' });
      c.font = font(32, 'body'); const aw = c.measureText(a).width; c.font = font(32); const bw = c.measureText(b).width;
      c.save(); inkS(c, 2); c.setLineDash([3, 7]); c.beginPath(); c.moveTo(452 + aw, 212 + i * 62); c.lineTo(790 - bw - 12, 212 + i * 62); c.stroke(); c.restore();
      text(c, b, 790, 200 + i * 62, 32, { align: 'right' });
      c.restore();
    });
    if (this.t > 2.6) {
      const k = clamp((this.t - 2.6) * 5, 0, 1), s = lerp(3, 1, ease.outCubic(k));
      c.save(); c.translate(1000, 320); c.rotate(-.18); c.scale(s, s); c.globalAlpha = k;
      circ(c, 0, 0, 110, null, 0); c.lineWidth = 10; c.strokeStyle = C.red; c.beginPath(); c.arc(0, 0, 110, 0, TAU); c.stroke(); c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 94, 0, TAU); c.stroke();
      text(c, this.grade, 0, 8, 120, { color: C.red });
      text(c, 'GRADE', 0, -74, 20, { color: C.red });
      c.restore();
      if (this.newBest) text(c, 'New best!', 1000, 470, 26, { color: C.teal });
    }
    Art.drawBongo(c, 250, 600, { pose: 'win', t: G.t, face: 1, scale: 1.3 });
    if (this.t > 3.2) button(c, 'r-cont', 640, 560, 300, 74, 'Continue', () => G.go(this.first ? 'story' : 'station', this.first ? 'ending' : null), { primary: true });
  }
};
