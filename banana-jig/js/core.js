'use strict';
// Core: canvas scaling, input, scenes, transitions, particles, film look, save data.
const W = 1280, H = 720, GY = 612, TAU = Math.PI * 2;
const C = {
  ink: '#1b1109', cream: '#f3e3c3', paper: '#e8d2a6', paperD: '#cdb07c', sepia: '#b0814f',
  red: '#b4392b', redD: '#7d2219', mustard: '#d6a238', mustardD: '#a8781e', teal: '#3d7c76', tealD: '#27524e',
  brown: '#6e4326', brownD: '#4a2b16', face: '#ecc896', pink: '#ff4f9a', grey: '#aaa3b8', greyD: '#817a94',
  greyL: '#c9c3d3', white: '#fbf4e2', dark: '#140d07', water: '#6fb3ad'
};
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.random() * a.length | 0];
const ease = {
  outBack: t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inCubic: t => t * t * t,
  inOut: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  outElastic: t => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * TAU / 3) + 1
};
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
};
const reducedMotion = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();

const G = {
  t: 0, dt: 0, rdt: 0, frame: 0, fps: 60, beat: 0, scene: null, sceneName: '', scenes: {}, overlay: null,
  hitStop: 0, trauma: 0, keys: {}, pressed: {}, intensity: 0,
  touch: (() => { try { return matchMedia('(pointer:coarse)').matches; } catch (e) { return false; } })(),
  debug: /debug=1/.test(location.search),
  save: Object.assign({ coins: 0, beaten: {}, best: {}, charmOwned: false, charmOn: false, seenStory: false }, store.get('bj.save', {})),
  settings: Object.assign({ music: .7, sfx: .9, film: true, shake: !reducedMotion, vibe: true }, store.get('bj.settings', {}))
};
G.persist = () => { store.set('bj.save', G.save); store.set('bj.settings', G.settings); };
G.addShake = a => { if (G.settings.shake) G.trauma = Math.min(1, G.trauma + a); };
G.vibe = ms => { if (G.settings.vibe && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } };
G.freeze = s => { G.hitStop = Math.max(G.hitStop, s); };

// ---------- canvas & scaling ----------
const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
const view = { s: 1, ox: 0, oy: 0, dpr: 1, w: 1, h: 1, k: 1 };
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
  cvs.width = Math.round(w * dpr); cvs.height = Math.round(h * dpr);
  const cs = getComputedStyle(document.getElementById('probe'));
  const L = parseFloat(cs.paddingLeft) || 0, R = parseFloat(cs.paddingRight) || 0;
  const T = parseFloat(cs.paddingTop) || 0, B = parseFloat(cs.paddingBottom) || 0;
  const aw = Math.max(1, w - L - R), ah = Math.max(1, h - T - B), s = Math.min(aw / W, ah / H);
  Object.assign(view, { s, dpr, w, h, ox: L + (aw - W * s) / 2, oy: T + (ah - H * s) / 2, k: s * dpr });
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 250));
resize();
const isPortrait = () => view.h > view.w * 1.05;

// ---------- drawing helpers ----------
function font(size, face) { return `${size}px ${face === 'body' ? "'IM Fell English', Georgia, serif" : "Rye, 'Rockwell Extra Bold', Georgia, serif"}`; }
function text(c, str, x, y, size, o = {}) {
  c.font = font(size, o.face); c.textAlign = o.align || 'center'; c.textBaseline = o.base || 'middle';
  if (o.outline) { c.lineWidth = o.outline; c.strokeStyle = o.stroke || C.ink; c.lineJoin = 'round'; c.strokeText(str, x, y); }
  c.fillStyle = o.color || C.ink; c.fillText(str, x, y);
}
function wrapText(c, str, x, y, maxW, size, lh, o = {}) {
  c.font = font(size, o.face); const words = str.split(' '); let line = '', yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (c.measureText(test).width > maxW && line) { text(c, line, x, yy, size, o); line = w; yy += lh; } else line = test;
  }
  if (line) text(c, line, x, yy, size, o);
  return yy;
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
// paper card with ink outline and slight wobble
function card(c, x, y, w, h, fill = C.cream, lw = 5, r = 14) {
  c.save(); c.fillStyle = 'rgba(20,10,4,.35)'; roundRect(c, x + 6, y + 8, w, h, r); c.fill();
  roundRect(c, x, y, w, h, r); c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.strokeStyle = C.ink; c.stroke();
  c.lineWidth = 1.5; c.globalAlpha = .35; roundRect(c, x + 8, y + 8, w - 16, h - 16, Math.max(2, r - 6)); c.stroke(); c.restore();
}

// ---------- immediate-mode buttons ----------
const UI = { list: [] };
const P = {}; // active pointers
const inRect = (p, x, y, w, h) => p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
function button(c, id, x, y, w, h, label, onTap, o = {}) {
  UI.list.push({ id, x, y, w, h, onTap, layer: G._layer, primary: o.primary, key: o.key });
  let pressed = false; for (const k in P) if (P[k].btn === id && inRect(P[k], x, y, w, h)) pressed = true;
  const dy = pressed ? 4 : 0, fill = o.disabled ? '#b9a88a' : (o.fill || (o.primary ? C.mustard : C.cream));
  c.save();
  if (!pressed) { c.fillStyle = C.ink; roundRect(c, x, y + 6, w, h, h / 2.6); c.fill(); }
  roundRect(c, x, y + dy, w, h, h / 2.6); c.fillStyle = fill; c.fill(); c.lineWidth = 4.5; c.strokeStyle = C.ink; c.stroke();
  c.globalAlpha = .5; c.strokeStyle = C.white; c.lineWidth = 3; c.beginPath(); c.moveTo(x + h / 2.6, y + dy + 7); c.lineTo(x + w - h / 2.6, y + dy + 7); c.stroke(); c.globalAlpha = 1;
  text(c, label, x + w / 2, y + h / 2 + dy + 2, o.size || Math.min(34, h * .5), { color: o.disabled ? '#6d5d45' : C.ink });
  c.restore();
}

// ---------- input ----------
function toLogical(e) { return { x: (e.clientX - view.ox) / view.s, y: (e.clientY - view.oy) / view.s }; }
const inputTarget = () => G.overlay || G.scene;
let firstGestureDone = false;
function firstGesture() {
  if (firstGestureDone) return; firstGestureDone = true;
  if (G.touch) {
    const el = document.documentElement;
    try { const r = (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el); r?.catch?.(() => { }); } catch (e) { }
    try { screen.orientation?.lock?.('landscape')?.catch?.(() => { }); } catch (e) { }
  }
}
cvs.addEventListener('pointerdown', e => {
  e.preventDefault(); try { cvs.setPointerCapture(e.pointerId); } catch (er) { }
  if (e.pointerType === 'touch') G.touch = true;
  AudioSys.unlock(); firstGesture();
  const p = toLogical(e), ptr = { id: e.pointerId, x: p.x, y: p.y, sx: p.x, sy: p.y, btn: null, t: G.t };
  P[e.pointerId] = ptr;
  if (Trans.state || isPortrait()) return;
  const layer = G.overlay ? 'overlay' : 'scene';
  for (let i = UI.list.length - 1; i >= 0; i--) {
    const b = UI.list[i];
    if (b.layer === layer && inRect(ptr, b.x - 6, b.y - 6, b.w + 12, b.h + 12)) { ptr.btn = b.id; return; }
  }
  inputTarget()?.onDown?.(ptr);
}, { passive: false });
cvs.addEventListener('pointermove', e => {
  const ptr = P[e.pointerId]; if (!ptr) return;
  const p = toLogical(e); ptr.x = p.x; ptr.y = p.y;
  if (!ptr.btn) inputTarget()?.onMove?.(ptr);
});
function pointerEnd(e) {
  const ptr = P[e.pointerId]; if (!ptr) return; delete P[e.pointerId];
  if (ptr.btn) {
    const b = UI.list.find(b => b.id === ptr.btn);
    if (b && inRect(ptr, b.x - 10, b.y - 10, b.w + 20, b.h + 20) && !Trans.state) { AudioSys.sfx('click'); b.onTap && b.onTap(); }
    return;
  }
  inputTarget()?.onUp?.(ptr);
}
cvs.addEventListener('pointerup', pointerEnd);
cvs.addEventListener('pointercancel', pointerEnd);
cvs.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('keydown', e => {
  AudioSys.unlock();
  if (!G.keys[e.code]) G.pressed[e.code] = true;
  G.keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if ((e.code === 'Enter') && !Trans.state) {
    const layer = G.overlay ? 'overlay' : 'scene';
    const b = UI.list.find(b => b.primary && b.layer === layer); if (b) { AudioSys.sfx('click'); b.onTap(); }
  }
});
addEventListener('keyup', e => { G.keys[e.code] = false; });
function pauseAll() { G.scene?.onBlur?.(); }
document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseAll(); AudioSys.suspend(); } else AudioSys.resume(); });
addEventListener('blur', pauseAll);

// ---------- scenes & iris transition ----------
const Trans = { state: null };
G.go = (name, arg, fast) => {
  if (Trans.state) return;
  Trans.state = { phase: 'close', t: 0, dur: fast ? .22 : .5, name, arg };
};
function enterScene(name, arg) {
  G.scene?.exit?.(); G.overlay = null; G.scene = G.scenes[name]; G.sceneName = name;
  for (const k in P) P[k].btn = 'x'; // cancel held presses across scenes
  FX.clear(); G.trauma = 0; G.hitStop = 0; G.scene.enter?.(arg);
}
function updateTrans(dt) {
  const s = Trans.state; if (!s) return;
  s.t += dt;
  if (s.phase === 'close' && s.t >= s.dur) { enterScene(s.name, s.arg); s.phase = 'open'; s.t = 0; }
  else if (s.phase === 'open' && s.t >= s.dur) Trans.state = null;
}
function drawIris(c) {
  const s = Trans.state; if (!s) return;
  const k = clamp(s.t / s.dur, 0, 1), maxR = 780;
  const r = s.phase === 'close' ? maxR * (1 - ease.inCubic(k)) : maxR * ease.outCubic(k);
  const cx = s.cx ?? 640, cy = s.cy ?? 360;
  c.save(); c.beginPath(); c.rect(-20, -20, W + 40, H + 40); c.arc(cx, cy, Math.max(0, r), 0, TAU, true);
  c.fillStyle = C.dark; c.fill();
  c.lineWidth = 8; c.strokeStyle = '#000'; c.beginPath(); c.arc(cx, cy, Math.max(0, r), 0, TAU); c.stroke(); c.restore();
}

// ---------- particles ----------
const FX = {
  list: [], clear() { this.list.length = 0; },
  add(p) { if (this.list.length > 360) this.list.shift(); p.t = 0; this.list.push(p); return p; },
  puff(x, y, n = 6, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = o.dir != null ? o.dir + rand(-o.spread || -.6, o.spread || .6) : rand(0, TAU), sp = rand(o.sp0 || 40, o.sp1 || 180);
      this.add({ type: 'smoke', x: x + rand(-6, 6), y: y + rand(-6, 6), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rand(o.r0 || 7, o.r1 || 16), life: rand(.35, .6) * (o.life || 1), col: o.col || C.cream, g: o.g || 0 });
    }
  },
  stars(x, y, n = 6, col = C.mustard) {
    for (let i = 0; i < n; i++) { const a = rand(0, TAU), sp = rand(160, 380); this.add({ type: 'star', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rand(7, 13), life: rand(.3, .5), col, rot: rand(0, TAU) }); }
  },
  ink(x, y, n = 6) {
    for (let i = 0; i < n; i++) { const a = rand(0, TAU), sp = rand(120, 360); this.add({ type: 'drop', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 100, r: rand(2.5, 5), life: rand(.3, .6), col: C.ink, g: 900 }); }
  },
  confetti(x, y, n = 30) {
    for (let i = 0; i < n; i++) { const a = rand(-Math.PI, 0), sp = rand(200, 620); this.add({ type: 'conf', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rand(4, 8), life: rand(1, 1.8), col: pick([C.red, C.mustard, C.teal, C.cream]), g: 700, rot: rand(0, TAU), vr: rand(-12, 12) }); }
  },
  words(x, y, str, col = C.cream, size = 34) { this.add({ type: 'word', x, y, vx: 0, vy: -70, life: .9, str, col, size }); },
  update(dt) {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i]; p.t += dt;
      if (p.t >= p.life) { L.splice(i, 1); continue; }
      p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.type === 'smoke') { p.vx *= 1 - 3 * dt; p.vy *= 1 - 3 * dt; }
      if (p.rot != null) p.rot += (p.vr || 8) * dt;
    }
  },
  draw(c) {
    for (const p of this.list) {
      const k = p.t / p.life;
      c.save();
      if (p.type === 'smoke') {
        const r = p.r * (1 + k * 1.2); c.globalAlpha = 1 - k * k;
        c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.fillStyle = p.col; c.fill(); c.lineWidth = 3; c.strokeStyle = C.ink; c.stroke();
      } else if (p.type === 'star') {
        c.translate(p.x, p.y); c.rotate(p.rot); c.globalAlpha = 1 - k; starPath(c, 0, 0, p.r * (1 - k * .5), p.r * .45, 5);
        c.fillStyle = p.col; c.fill(); c.lineWidth = 2.5; c.strokeStyle = C.ink; c.stroke();
      } else if (p.type === 'drop') {
        c.globalAlpha = 1 - k; c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fillStyle = p.col; c.fill();
      } else if (p.type === 'conf') {
        c.translate(p.x, p.y); c.rotate(p.rot); c.globalAlpha = Math.min(1, (1 - k) * 3); c.fillStyle = p.col; c.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      } else if (p.type === 'word') {
        c.globalAlpha = 1 - k * k; text(c, p.str, p.x, p.y, p.size * (1 + .3 * ease.outBack(Math.min(1, k * 4))) , { color: p.col, outline: 7 });
      } else if (p.type === 'ring') {
        c.globalAlpha = 1 - k; c.beginPath(); c.arc(p.x, p.y, p.r + k * p.grow, 0, TAU); c.lineWidth = 6 * (1 - k) + 1; c.strokeStyle = p.col; c.stroke();
      } else if (p.type === 'smear') {
        c.globalAlpha = .5 * (1 - k); c.fillStyle = C.ink; c.beginPath(); c.ellipse(p.x, p.y, p.r * 2.2, p.r * .5, 0, 0, TAU); c.fill();
      }
      c.restore();
    }
  }
};
function starPath(c, x, y, R, r, n) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r : R; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath();
}

// ---------- offscreen sprite cache (characters animate "on twos") ----------
function makeSprite(w, h, ox, oy) {
  const cv = document.createElement('canvas'), cx = cv.getContext('2d');
  return {
    key: null, k: 0,
    draw(c, x, y, key, fn, tint) {
      const k = Math.min(2.4, view.k);
      if (key !== this.key || k !== this.k || tint !== this.tint) {
        if (k !== this.k) { cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); this.k = k; }
        cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height);
        cx.setTransform(k, 0, 0, k, ox * k, oy * k); fn(cx);
        if (tint) { cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalCompositeOperation = 'source-atop'; cx.fillStyle = tint; cx.fillRect(0, 0, cv.width, cv.height); cx.globalCompositeOperation = 'source-over'; }
        this.key = key; this.tint = tint;
      }
      c.drawImage(cv, x - ox, y - oy, w, h);
    }
  };
}

// ---------- old-film post effect ----------
const Film = {
  init() {
    this.grain = [];
    for (let i = 0; i < 4; i++) {
      const g = document.createElement('canvas'); g.width = g.height = 160; const gc = g.getContext('2d'), im = gc.createImageData(160, 160);
      for (let j = 0; j < im.data.length; j += 4) { const v = Math.random() * 255 | 0; im.data[j] = im.data[j + 1] = im.data[j + 2] = v; im.data[j + 3] = Math.random() < .5 ? 90 : 0; }
      gc.putImageData(im, 0, 0); this.grain.push(g);
    }
    const v = document.createElement('canvas'); v.width = 640; v.height = 360; const vc = v.getContext('2d');
    const gr = vc.createRadialGradient(320, 180, 110, 320, 180, 390);
    gr.addColorStop(0, 'rgba(30,14,4,0)'); gr.addColorStop(.7, 'rgba(30,14,4,.18)'); gr.addColorStop(1, 'rgba(18,8,2,.7)');
    vc.fillStyle = gr; vc.fillRect(0, 0, 640, 360); this.vig = v; this.scratches = [];
  },
  draw(c) {
    c.drawImage(this.vig, 0, 0, W, H);
    if (!G.settings.film) return;
    c.save();
    c.fillStyle = 'rgba(118,72,24,.09)'; c.fillRect(0, 0, W, H); // sepia wash
    const fl = Math.random() * .045; c.fillStyle = `rgba(255,236,200,${fl})`; c.fillRect(0, 0, W, H); // flicker
    // grain in device pixels so it stays fine on any screen
    c.setTransform(1, 0, 0, 1, 0, 0);
    const g = this.grain[(G.frame >> 1) & 3];
    if (!g.pat) g.pat = c.createPattern(g, 'repeat');
    c.globalAlpha = .16; c.globalCompositeOperation = 'overlay';
    c.translate(Math.random() * 160 | 0, Math.random() * 160 | 0); c.fillStyle = g.pat; c.fillRect(-160, -160, cvs.width + 160, cvs.height + 160);
    c.restore();
    c.save();
    // dust & hairs
    if (Math.random() < .5) { c.fillStyle = 'rgba(20,10,4,.55)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(rand(0, W), rand(0, H), rand(.8, 2.6), 0, TAU); c.fill(); } }
    if (Math.random() < .04) { c.strokeStyle = 'rgba(20,10,4,.5)'; c.lineWidth = 1.2; const x = rand(0, W), y = rand(0, H); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + rand(-20, 20), y + rand(-20, 20), x + rand(-30, 30), y + rand(-30, 30)); c.stroke(); }
    if (Math.random() < .02) this.scratches.push({ x: rand(40, W - 40), life: rand(.2, .7), t: 0 });
    for (let i = this.scratches.length - 1; i >= 0; i--) {
      const s = this.scratches[i]; s.t += G.rdt; s.x += rand(-2, 2); if (s.t > s.life) { this.scratches.splice(i, 1); continue; }
      c.strokeStyle = 'rgba(250,236,205,.35)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(s.x, 0); c.lineTo(s.x + rand(-3, 3), H); c.stroke();
    }
    c.restore();
  }
};

function drawRotateCard() {
  const d = view.dpr; ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.fillStyle = C.dark; ctx.fillRect(0, 0, view.w, view.h);
  const s = Math.min(view.w / 420, view.h / 520), cx = view.w / 2, cy = view.h / 2;
  ctx.translate(cx, cy); ctx.scale(s, s);
  card(ctx, -170, -210, 340, 420, C.cream, 5, 18);
  ctx.save(); ctx.translate(0, -60); ctx.rotate(-Math.PI / 2 * ease.inOut((Math.sin(G.t * 2.2) + 1) / 2));
  roundRect(ctx, -46, -80, 92, 160, 16); ctx.fillStyle = C.teal; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke();
  roundRect(ctx, -34, -64, 68, 128, 6); ctx.fillStyle = C.paper; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  drawBongoHead(ctx, 0, 90, .9, Math.sin(G.t * 3) * .3);
  text(ctx, 'Turn your phone', 0, 150, 30);
  text(ctx, 'sideways to play', 0, 184, 24, { face: 'body' });
}

// ---------- main loop ----------
let lastT = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const rdt = Math.min(.05, Math.max(0, (now - lastT) / 1000 || 0)); lastT = now;
  G.frame++; G.rdt = rdt; G.t += rdt; if (rdt > 0) G.fps = lerp(G.fps, 1 / rdt, .05);
  AudioSys.tick(); G.beat = AudioSys.beatPhase();
  const portrait = isPortrait();
  if (!portrait) {
    updateTrans(rdt);
    let dt = rdt;
    if (G.hitStop > 0) { G.hitStop -= rdt; dt = 0; }
    G.dt = dt;
    if (G.overlay) G.overlay.update?.(rdt); else G.scene.update?.(dt, rdt);
    if (!G.overlay) FX.update(dt);
    G.trauma = Math.max(0, G.trauma - rdt * 1.7);
  } else if (G.sceneName === 'fight' || G.sceneName === 'ride') G.scene.onBlur?.();

  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = C.dark; ctx.fillRect(0, 0, cvs.width, cvs.height);
  if (portrait) { drawRotateCard(); G.pressed = {}; return; }
  UI.list.length = 0;
  const k = view.k;
  ctx.setTransform(k, 0, 0, k, view.ox * view.dpr, view.oy * view.dpr);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  const sh = G.trauma * G.trauma * 24;
  const wx = G.settings.film ? Math.sin(G.t * 17) * .5 + (G.frame % 9 === 0 ? rand(-.8, .8) : 0) : 0;
  const wy = G.settings.film ? Math.sin(G.t * 11) * .6 : 0;
  ctx.save(); ctx.translate(rand(-sh, sh) + wx, rand(-sh, sh) + wy);
  G._layer = 'scene';
  G.scene.draw(ctx);
  FX.draw(ctx);
  ctx.restore();
  G.scene.drawHUD?.(ctx);
  if (G.overlay) { G._layer = 'overlay'; G.overlay.draw(ctx); }
  drawIris(ctx);
  Film.draw(ctx);
  ctx.restore();
  G.pressed = {};
}

function boot() {
  Film.init();
  Art.init();
  enterScene('title');
  let started = false; const start = () => { if (!started) { started = true; requestAnimationFrame(loop); } };
  try { document.fonts.load('40px Rye').then(start, start); setTimeout(start, 1500); } catch (e) { start(); }
}
