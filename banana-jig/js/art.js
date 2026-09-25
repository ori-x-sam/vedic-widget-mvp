'use strict';
// Character & prop art, drawn with canvas paths in a rubber-hose style.
function inkS(c, w = 5) { c.lineWidth = w; c.strokeStyle = C.ink; c.lineJoin = 'round'; c.lineCap = 'round'; }
function circ(c, x, y, r, fill, lw = 5) { c.beginPath(); c.arc(x, y, r, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } if (lw) { inkS(c, lw); c.stroke(); } }
function ell(c, x, y, rx, ry, rot, fill, lw = 5) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } if (lw) { inkS(c, lw); c.stroke(); } }
function hose(c, x1, y1, x2, y2, bend, w = 7, col) {
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
  const cx = (x1 + x2) / 2 - dy / l * bend, cy = (y1 + y2) / 2 + dx / l * bend;
  c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(cx, cy, x2, y2); c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = w; c.strokeStyle = C.ink; c.stroke();
  if (col) { c.lineWidth = w - 6; c.strokeStyle = col; c.stroke(); }
}
function tube(c, x0, y0, cx, cy, x1, y1, r0, r1, fill, lw = 5) {
  const N = 16, L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, it = 1 - t;
    const x = it * it * x0 + 2 * it * t * cx + t * t * x1, y = it * it * y0 + 2 * it * t * cy + t * t * y1;
    const dx = 2 * it * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * it * (cy - y0) + 2 * t * (y1 - cy), l = Math.hypot(dx, dy) || 1, r = lerp(r0, r1, t);
    L.push([x - dy / l * r, y + dx / l * r]); R.push([x + dy / l * r, y - dx / l * r]);
  }
  c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (const p of L) c.lineTo(p[0], p[1]);
  for (let i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath();
  c.fillStyle = fill; c.fill(); inkS(c, lw); c.stroke();
  // wrinkles
  c.lineWidth = 2.5;
  for (const t of [.35, .5, .65]) { const i = Math.round(t * N); c.beginPath(); c.moveTo(lerp(L[i][0], R[i][0], .2), lerp(L[i][1], R[i][1], .2)); c.quadraticCurveTo((L[i][0] + R[i][0]) / 2 + 3, (L[i][1] + R[i][1]) / 2 + 3, lerp(L[i][0], R[i][0], .8), lerp(L[i][1], R[i][1], .8)); c.stroke(); }
}
function glove(c, x, y, r, ang = 0, point = false) {
  c.save(); c.translate(x, y); c.rotate(ang);
  ell(c, -r * .95, 0, r * .38, r * .75, 0, C.white, 3);
  if (point) { ell(c, r * 1.05, -r * .2, r * .8, r * .3, 0, C.white, 3); ell(c, r * .1, -r * .9, r * .26, r * .48, -.3, C.white, 3); }
  circ(c, 0, 0, r, C.white, 3);
  c.lineWidth = 1.8; c.beginPath(); c.moveTo(r * .1, -r * .5); c.lineTo(r * .45, -r * .1); c.moveTo(-r * .15, -r * .45); c.lineTo(r * .15, 0); c.stroke();
  c.restore();
}
function pieEye(c, x, y, rx, ry, lx = .5, ly = 0, mode = 'open') {
  if (mode === 'x') { inkS(c, 3.2); c.beginPath(); c.moveTo(x - rx, y - rx); c.lineTo(x + rx, y + rx); c.moveTo(x + rx, y - rx); c.lineTo(x - rx, y + rx); c.stroke(); return; }
  if (mode === 'closed') { inkS(c, 3); c.beginPath(); c.arc(x, y, rx * 1.1, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); return; }
  if (mode === 'wide') { ell(c, x, y, rx * 1.35, ry * 1.2, 0, C.white, 2.5); ell(c, x + lx * rx * .4, y, rx * .6, ry * .6, 0, C.ink, 0); return; }
  ell(c, x, y, rx, ry, 0, C.ink, 0);
  const cx = x + lx * rx * .35, cy = y - ry * .15 + ly * ry * .2;
  c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, ry * .62, -1.45, -.55); c.closePath(); c.fillStyle = C.white; c.fill();
}
function peanutPath(c, rx, ry) {
  c.beginPath(); c.moveTo(-rx, 0);
  c.bezierCurveTo(-rx, -ry * 1.1, -rx * .15, -ry * 1.05, 0, -ry * .62); c.bezierCurveTo(rx * .15, -ry * 1.05, rx, -ry * 1.1, rx, 0);
  c.bezierCurveTo(rx, ry * 1.1, rx * .15, ry * 1.05, 0, ry * .62); c.bezierCurveTo(-rx * .15, ry * 1.05, -rx, ry * 1.1, -rx, 0); c.closePath();
}

// ---------------- BONGO ----------------
function bongoHead(c, hx, hy, o = {}) {
  const fur = o.fur || C.brown, eyes = o.eyes || 'open', mouth = o.mouth || 'smile';
  circ(c, hx - 24, hy - 2, 10.5, fur, 4); circ(c, hx - 24, hy - 2, 5, C.face, 0);
  circ(c, hx + 25, hy - 5, 10.5, fur, 4); circ(c, hx + 25, hy - 5, 5, C.face, 0);
  circ(c, hx, hy, 25, fur, 5);
  c.fillStyle = C.face;
  c.beginPath(); c.ellipse(hx + 6, hy + 8, 17, 13, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(hx - 2, hy - 6, 9.5, 10.5, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(hx + 14, hy - 6, 9.5, 10.5, 0, 0, TAU); c.fill();
  pieEye(c, hx - 2, hy - 7, 4.6, 7.6, .6, 0, eyes); pieEye(c, hx + 13, hy - 7, 4.6, 7.6, .6, 0, eyes);
  inkS(c, 2.6); c.beginPath(); c.arc(hx - 2, hy - 13, 7, Math.PI * 1.2, Math.PI * 1.7); c.stroke(); c.beginPath(); c.arc(hx + 14, hy - 14, 7, Math.PI * 1.3, Math.PI * 1.8); c.stroke();
  ell(c, hx + 7, hy + 2.5, 4.5, 3, 0, C.ink, 0);
  if (mouth === 'smile') { inkS(c, 3); c.beginPath(); c.moveTo(hx - 5, hy + 8); c.quadraticCurveTo(hx + 8, hy + 20, hx + 21, hy + 7); c.stroke(); }
  else if (mouth === 'open' || mouth === 'grit') {
    c.beginPath(); c.moveTo(hx - 5, hy + 8); c.quadraticCurveTo(hx + 8, hy + 27, hx + 21, hy + 7); c.quadraticCurveTo(hx + 8, hy + 12, hx - 5, hy + 8); c.closePath();
    c.fillStyle = '#5a1a12'; c.fill(); inkS(c, 3); c.stroke();
    if (mouth === 'grit') { c.fillStyle = C.white; c.fillRect(hx - 1, hy + 9, 18, 5); }
    else { c.beginPath(); c.ellipse(hx + 9, hy + 15, 5, 3, 0, 0, TAU); c.fillStyle = '#d86a5a'; c.fill(); }
  } else if (mouth === 'o') { ell(c, hx + 8, hy + 13, 5, 6, 0, '#5a1a12', 3); }
  // fez
  c.save(); c.translate(hx + 5, hy - 22); c.rotate(-.22 + (o.tilt || 0));
  c.beginPath(); c.moveTo(-13, 4); c.lineTo(-9, -17); c.lineTo(9, -17); c.lineTo(13, 4); c.closePath(); c.fillStyle = o.vest || C.red; c.fill(); inkS(c, 4); c.stroke();
  c.fillStyle = C.redD; c.fillRect(-12, -2, 24, 5);
  const sw = Math.sin((o.t || G.t) * 7) * 5;
  hose(c, 0, -17, 12 + sw * .3, -8 + Math.abs(sw) * .4, -4, 3.2); circ(c, 13 + sw * .3, -5 + Math.abs(sw) * .4, 3.5, C.mustard, 2);
  c.restore();
}
function drawBongoHead(c, x, y, s = 1, tilt = 0) { c.save(); c.translate(x, y); c.scale(s, s); c.rotate(tilt); bongoHead(c, 0, 0, { tilt }); c.restore(); }

function bongoBody(c, s) {
  const f = Math.floor((s.t || 0) * 12), pose = s.pose || 'idle', beat = s.beat != null ? s.beat : G.beat;
  let bob = 0, lean = 0, sq = 1, fl = [-13, 0], fr = [13, 0], hl = [-24, -44], hr = [25, -46], spin = 0, eyes = 'open', mouth = 'smile';
  switch (pose) {
    case 'idle': { const b = Math.abs(Math.sin(beat * Math.PI)); bob = -b * 4; sq = 1.03 - b * .04; hl = [-24, -42 + bob]; hr = [25, -42 + bob]; break; }
    case 'run': { const ph = (f % 8) / 8 * TAU; fl = [Math.sin(ph) * 20, -Math.max(0, Math.cos(ph)) * 18]; fr = [Math.sin(ph + Math.PI) * 20, -Math.max(0, -Math.cos(ph)) * 18]; bob = -Math.abs(Math.sin(ph)) * 7; lean = .14; hl = [-Math.cos(ph) * 20 - 6, -46 + bob]; hr = [Math.cos(ph) * 20 + 8, -46 + bob]; mouth = 'open'; break; }
    case 'jump': fl = [-12, -26]; fr = [14, -20]; hl = [-30, -94]; hr = [30, -92]; bob = -10; mouth = 'open'; break;
    case 'fall': fl = [-15, -4]; fr = [16, -10]; hl = [-34, -82 + (f % 2) * 6]; hr = [34, -86 + ((f + 1) % 2) * 6]; bob = -6; mouth = 'o'; break;
    case 'duck': sq = .7; fl = [-24, 0]; fr = [24, 0]; hl = [-28, -30]; hr = [28, -32]; lean = .05; break;
    case 'dash': fl = [-32, -12]; fr = [-10, -4]; hl = [-38, -56]; hr = [-22, -66]; lean = .34; mouth = 'grit'; break;
    case 'hurt': fl = [-18, -8]; fr = [18, -4]; hl = [-34, -98 + (f % 2) * 5]; hr = [36, -94]; eyes = 'x'; mouth = 'o'; lean = -.2; break;
    case 'parry': fl = [-10, -28]; fr = [12, -24]; hl = [-20, -82]; hr = [24, -86]; spin = f * .95; mouth = 'open'; break;
    case 'dance': { const k = (f >> 2) % 2 === 0; fl = k ? [-24, -24] : [-12, 0]; fr = k ? [14, 0] : [26, -26]; hl = k ? [-32, -94] : [-28, -50]; hr = k ? [28, -50] : [32, -96]; bob = -Math.abs(Math.sin(beat * Math.PI)) * 8; lean = k ? .12 : -.12; mouth = 'open'; break; }
    case 'wave': hr = [36, -104 + Math.sin((s.t || 0) * 12) * 7]; mouth = 'open'; break;
    case 'ghost': fl = [-6, -12]; fr = [7, -9]; hl = [-30, -92]; hr = [30, -92]; eyes = 'closed'; break;
    case 'win': hl = [-30, -104]; hr = [32, -106]; fl = [-16, -6]; fr = [16, 0]; mouth = 'open'; bob = -Math.abs(Math.sin((s.t || 0) * 6)) * 12; break;
  }
  if (s.gun) { const ax = s.aim.x * (s.face || 1), ay = s.aim.y, l = Math.hypot(ax, ay) || 1; hr = [12 + ax / l * 32, -66 + bob + ay / l * 32]; }
  const fur = s.fur || C.brown, vest = s.vest || C.red;
  const sx = 1 + (1 - sq) * .7;
  c.save();
  c.scale(sx, sq); c.rotate(lean);
  if (spin) { c.translate(0, -60); c.rotate(spin); c.translate(0, 60); }
  // tail
  const tw = Math.sin(f * .8) * 4;
  c.beginPath(); c.moveTo(-14, -44 + bob); c.bezierCurveTo(-42, -40 + bob, -48 + tw, -76 + bob, -32, -84 + bob); c.bezierCurveTo(-20, -90 + bob, -16, -74 + bob, -27, -72 + bob);
  c.lineCap = 'round'; c.lineWidth = 8; c.strokeStyle = C.ink; c.stroke(); c.lineWidth = 3.5; c.strokeStyle = fur; c.stroke();
  // back arm
  hose(c, -10, -66 + bob, hl[0], hl[1], 6, 7); glove(c, hl[0], hl[1], 7.5, Math.atan2(hl[1] + 66, hl[0] + 10));
  // legs
  hose(c, -8, -36 + bob, fl[0], fl[1] - 6, -5, 7); hose(c, 8, -36 + bob, fr[0], fr[1] - 6, 5, 7);
  for (const ft of [fl, fr]) { ell(c, ft[0] + 5, ft[1] - 5, 13, 8, 0, C.ink, 0); c.fillStyle = 'rgba(255,245,225,.5)'; c.beginPath(); c.ellipse(ft[0] + 8, ft[1] - 8, 5, 2, -.2, 0, TAU); c.fill(); }
  // body + vest
  ell(c, 0, -55 + bob, 18, 22, 0, fur, 5);
  c.beginPath(); c.moveTo(-17, -62 + bob); c.quadraticCurveTo(-18, -38 + bob, -4, -34 + bob); c.lineTo(2, -60 + bob); c.lineTo(-4, -74 + bob); c.closePath(); c.fillStyle = vest; c.fill(); inkS(c, 3); c.stroke();
  c.beginPath(); c.moveTo(17, -62 + bob); c.quadraticCurveTo(18, -38 + bob, 8, -34 + bob); c.lineTo(8, -60 + bob); c.lineTo(10, -74 + bob); c.closePath(); c.fill(); c.stroke();
  circ(c, -6, -52 + bob, 2.4, C.mustard, 1.5); circ(c, -5, -43 + bob, 2.4, C.mustard, 1.5);
  // head
  bongoHead(c, 4, -100 + bob, { fur, vest, eyes, mouth, t: s.t });
  // front arm
  hose(c, 12, -66 + bob, hr[0], hr[1], s.gun ? 0 : -6, 7);
  glove(c, hr[0], hr[1], 7.5, Math.atan2(hr[1] - (-66 + bob), hr[0] - 12), !!s.gun);
  c.restore();
}

// ---------------- MADAME TUSK ----------------
function tuskBody(c, s) {
  const t = s.t || 0, f = Math.floor(t * 12), pose = s.pose || 'idle';
  let tip = [-112 + Math.sin(f * .5) * 10, -142], curl = 1, flap = Math.sin(f * .7) * .1, legL = [-36, 0], legR = [36, 0];
  let armL = [-86, -108], armR = [86, -110], by = 0, eyes = 'open', mouth = 'smile', brows = 0, puff = 0, lean = 0, sq = 1 + Math.sin(t * 3) * .015, flipX = 1;
  switch (pose) {
    case 'wind': tip = [-40, -340]; curl = -1; lean = .06; armL = [-110, -200]; armR = [110, -200]; mouth = 'o'; break;
    case 'spray': tip = [-190, -262]; curl = .4; lean = -.06; armL = [-60, -110]; mouth = 'o'; break;
    case 'cheeks': tip = [-176, -212]; curl = .2; puff = 1; armL = [-70, -120]; armR = [80, -120]; break;
    case 'toss': tip = [-178, -196 + (f % 2) * 8]; curl = .1; mouth = 'o'; break;
    case 'angry': brows = 1; tip = [-120, -118 + Math.sin(f) * 8]; armL = [-92, -198 + (f % 2) * 8]; armR = [92, -198 + ((f + 1) % 2) * 8]; mouth = 'grr'; break;
    case 'stompUp': legR = [58, -92]; lean = .1; armL = [-128, -196]; armR = [126, -206]; sq = 1.05; brows = 1; mouth = 'grr'; break;
    case 'stompDown': sq = .88; legL = [-52, 0]; legR = [52, 0]; armL = [-124, -80]; armR = [124, -82]; brows = 1; mouth = 'o'; break;
    case 'spin': flipX = (f >> 1) % 2 ? -1 : 1; legL = [0, 0]; legR = [42, -64]; armL = [-40, -336]; armR = [40, -338]; by = -22; tip = [-60, -140]; eyes = 'closed'; break;
    case 'hang': case 'swoop': armL = [-48, -352]; armR = [48, -354]; legL = [-28 + Math.sin(t * 5) * 6, 8]; legR = [30 + Math.sin(t * 5 + 1) * 6, 14]; tip = pose === 'swoop' ? [-60, 52] : [-70, -118]; curl = pose === 'swoop' ? -.2 : 1.4; mouth = pose === 'swoop' ? 'o' : 'sad'; break;
    case 'pop': eyes = 'wide'; mouth = 'o'; armL = [-120, -220 + (f % 2) * 14]; armR = [120, -214 + ((f + 1) % 2) * 14]; tip = [-130, -300]; curl = -1; break;
    case 'ko': eyes = 'x'; mouth = 'tongue'; tip = [-70, -96]; curl = 2; armL = [-110, -40]; armR = [104, -44]; sq = .85; legL = [-60, 0]; legR = [60, 0]; break;
    case 'bow': armL = [-120, -150]; armR = [110, -210]; tip = [-150, -300]; curl = -.6; eyes = 'closed'; break;
  }
  const hurt = s.cry || pose === 'hang' || pose === 'swoop';
  const GR = C.grey;
  c.save(); c.scale(flipX, sq); c.rotate(lean);
  // ears (behind)
  ell(c, 46, -236 + by, 60, 70, .22 + flap, GR, 5); ell(c, 50, -234 + by, 42, 52, .22 + flap, '#cbb1a6', 0);
  ell(c, -84, -246 + by, 28, 50, -.25 - flap, GR, 5);
  // back arm
  hose(c, 52, -176 + by, armR[0], armR[1] + by, -14, 22, GR); glove(c, armR[0], armR[1] + by, 14, Math.atan2(armR[1] + 176, armR[0] - 52));
  // legs & slippers
  for (const [hx, lg] of [[-28, legL], [28, legR]]) {
    hose(c, hx, -60 + by, lg[0], lg[1] - 10, hx < 0 ? -6 : 6, 28, GR);
    ell(c, lg[0] - 4, lg[1] - 8, 24, 12, 0, C.teal, 4);
    inkS(c, 2.5); c.beginPath(); c.moveTo(lg[0] - 14, lg[1] - 14); c.lineTo(lg[0] + 6, lg[1] - 34); c.moveTo(lg[0] + 4, lg[1] - 14); c.lineTo(lg[0] - 10, lg[1] - 34); c.stroke();
  }
  // body
  ell(c, 0, -136 + by, 80, 82, 0, GR, 6);
  c.fillStyle = C.greyL; c.beginPath(); c.ellipse(-16, -126 + by, 48, 56, 0, 0, TAU); c.fill();
  // tutu
  c.beginPath();
  for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, rr = i % 2 ? 1 : .86; c.lineTo(Math.cos(a) * 116 * rr, -86 + by + Math.sin(a) * 30 * rr); }
  c.closePath(); c.fillStyle = C.teal; c.fill(); inkS(c, 5); c.stroke();
  c.beginPath(); c.ellipse(0, -92 + by, 84, 16, 0, Math.PI, TAU); c.fillStyle = C.cream; c.fill(); inkS(c, 3); c.stroke();
  for (let i = 0; i < 7; i++) { const x = -66 + i * 22; circ(c, x, -80 + by + Math.abs(i - 3) * 2, 3, C.mustard, 1.5); }
  // head
  const hx = -22, hy = -234 + by;
  circ(c, hx, hy, 64, GR, 6);
  c.fillStyle = C.greyL; c.beginPath(); c.ellipse(hx - 8, hy + 10, 40, 32, 0, 0, TAU); c.fill();
  // eyes
  const ex1 = hx - 30, ex2 = hx + 4, ey = hy - 14;
  c.fillStyle = 'rgba(61,124,118,.55)'; c.beginPath(); c.ellipse(ex1, ey - 6, 14, 10, 0, Math.PI, TAU); c.fill(); c.beginPath(); c.ellipse(ex2, ey - 8, 14, 10, 0, Math.PI, TAU); c.fill();
  pieEye(c, ex1, ey, 8.5, 14, -.6, 0, eyes); pieEye(c, ex2, ey - 2, 8.5, 14, -.6, 0, eyes);
  if (eyes === 'open' || eyes === 'wide') { inkS(c, 3); for (const [x, y0] of [[ex1, ey - 14], [ex2, ey - 16]]) for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x + k * 5, y0); c.lineTo(x + k * 9 - 3, y0 - 9); c.stroke(); } }
  if (brows) { inkS(c, 6); c.beginPath(); c.moveTo(ex1 - 14, ey - 30); c.lineTo(ex1 + 8, ey - 20); c.moveTo(ex2 + 14, ey - 32); c.lineTo(ex2 - 8, ey - 22); c.stroke(); }
  c.fillStyle = 'rgba(217,125,107,.55)'; circ(c, hx - 48, hy + 20, 12 + puff * 9, 'rgba(217,125,107,.5)', 0); circ(c, hx + 22, hy + 16, 12 + puff * 9, 'rgba(217,125,107,.5)', 0);
  if (puff) { ell(c, hx - 50, hy + 18, 20, 17, 0, null, 3); ell(c, hx + 24, hy + 14, 20, 17, 0, null, 3); }
  // mouth (under trunk)
  const mx = hx + 6, my = hy + 34;
  if (mouth === 'smile') { inkS(c, 3.5); c.beginPath(); c.arc(mx, my - 8, 14, .3, Math.PI - .3); c.stroke(); }
  else if (mouth === 'o') ell(c, mx, my, 11, 13, 0, '#5a1a12', 3.5);
  else if (mouth === 'grr') { c.beginPath(); c.moveTo(mx - 16, my); c.lineTo(mx + 16, my - 4); c.lineTo(mx + 12, my + 8); c.lineTo(mx - 12, my + 10); c.closePath(); c.fillStyle = C.white; c.fill(); inkS(c, 3.5); c.stroke(); c.beginPath(); c.moveTo(mx, my - 2); c.lineTo(mx, my + 9); c.stroke(); }
  else if (mouth === 'sad') { inkS(c, 3.5); c.beginPath(); c.arc(mx, my + 12, 13, Math.PI + .4, TAU - .4); c.stroke(); }
  else if (mouth === 'tongue') { ell(c, mx, my, 12, 9, 0, '#5a1a12', 3); ell(c, mx + 4, my + 10, 7, 9, .3, '#d86a5a', 3); }
  // trunk
  const bx = hx - 30, byy = hy + 12, cxp = (bx + tip[0]) / 2 + 50 * curl, cyp = (byy + tip[1]) / 2 + 40 * curl;
  tube(c, bx + 8, byy - 12, cxp, cyp, tip[0], tip[1], 21, 11, GR, 5);
  ell(c, tip[0], tip[1], 11, 11, 0, C.greyD, 4); ell(c, tip[0], tip[1], 5, 5, 0, C.ink, 0);
  // tiara
  c.save(); c.translate(hx + 4, hy - 60); c.rotate(.12);
  c.beginPath(); c.moveTo(-26, 6); c.lineTo(-22, -12); c.lineTo(-11, 0); c.lineTo(0, -20); c.lineTo(11, 0); c.lineTo(22, -12); c.lineTo(26, 6); c.closePath(); c.fillStyle = C.mustard; c.fill(); inkS(c, 3.5); c.stroke();
  circ(c, 0, -3, 5, C.teal, 2.5); c.restore();
  // front arm
  hose(c, -58, -172 + by, armL[0], armL[1] + by, 14, 22, GR); glove(c, armL[0], armL[1] + by, 14, Math.atan2(armL[1] + 172, armL[0] + 58));
  // tears
  if (hurt) {
    c.strokeStyle = C.water; c.lineWidth = 6; c.lineCap = 'round';
    for (const [x, y] of [[ex1, ey + 12], [ex2, ey + 10]]) { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 10 + Math.sin(t * 9) * 5, y + 30, x - 4, y + 60); c.stroke(); }
  }
  c.restore();
}

function drawBall(c, x, y, r, rot) {
  c.save(); c.translate(x, y);
  c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = C.cream; c.fill();
  c.save(); c.clip(); c.rotate(rot);
  for (let i = -4; i <= 4; i++) { if (i % 2) { c.fillStyle = C.red; c.fillRect(i * r * .32 - r * .16, -r, r * .32, r * 2); } }
  c.fillStyle = C.mustard; c.fillRect(-r, -r * .16, r * 2, r * .32);
  starPath(c, 0, 0, r * .34, r * .15, 5); c.fillStyle = C.teal; c.fill(); inkS(c, 3); c.stroke();
  c.restore();
  const g = c.createRadialGradient(-r * .35, -r * .4, r * .1, 0, 0, r); g.addColorStop(0, 'rgba(255,248,230,.5)'); g.addColorStop(.6, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,16,4,.35)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
  inkS(c, 6); c.stroke(); c.restore();
}

// ---------------- SEAL ----------------
function sealBody(c, s) {
  const f = Math.floor((s.t || 0) * 12), toss = s.pose === 'toss';
  const SL = '#5f6d74';
  c.save();
  // tail flippers
  ell(c, -46, -8, 16, 7, -.5, SL, 4);
  c.beginPath(); c.moveTo(-50, -10); c.quadraticCurveTo(-30, -60, 8, -70 - (toss ? 14 : 0)); c.quadraticCurveTo(40, -66, 36, -30); c.quadraticCurveTo(30, 0, -50, -10); c.closePath(); c.fillStyle = SL; c.fill(); inkS(c, 5); c.stroke();
  c.fillStyle = '#95a2a8'; c.beginPath(); c.ellipse(16, -30, 14, 24, .2, 0, TAU); c.fill();
  ell(c, 8, -18 + (f % 2) * 3, 22, 8, .7, SL, 4); // flipper
  const hx = 26, hy = -80 - (toss ? 16 : 0);
  circ(c, hx, hy, 22, SL, 5);
  ell(c, hx + 18, hy + 6, 12, 9, 0, '#95a2a8', 3); ell(c, hx + 27, hy + 1, 5, 4, 0, C.ink, 0);
  pieEye(c, hx + 2, hy - 6, 4.5, 7, .6); pieEye(c, hx + 13, hy - 8, 4.5, 7, .6);
  inkS(c, 1.6); for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(hx + 22, hy + 8); c.lineTo(hx + 40, hy + 6 + k * 6); c.stroke(); }
  // little ruff collar
  c.beginPath(); for (let i = 0; i <= 10; i++) { const a = Math.PI * .1 + i / 10 * Math.PI * .8; c.lineTo(hx - 4 + Math.cos(a) * (i % 2 ? 26 : 20), hy + 22 + Math.sin(a) * (i % 2 ? 10 : 6)); } c.fillStyle = C.red; c.fill(); inkS(c, 3); c.stroke();
  c.restore();
}

// ---------------- RINGMASTER REX (story art) ----------------
function drawRex(c, x, y, s = 1, grin = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const B = '#4f4552', L = '#857886';
  hose(c, -60, -150, -110, -40, -20, 30, B); hose(c, 60, -150, 110, -40, 20, 30, B);
  glove(c, -110, -40, 18); glove(c, 110, -40, 18);
  ell(c, 0, -120, 80, 95, 0, C.red, 6);
  c.fillStyle = C.white; c.beginPath(); c.moveTo(-26, -210); c.lineTo(26, -210); c.lineTo(0, -120); c.closePath(); c.fill(); inkS(c, 4); c.stroke();
  for (const yy of [-150, -110, -70]) circ(c, -38, yy, 5, C.mustard, 2), circ(c, 38, yy, 5, C.mustard, 2);
  circ(c, 0, -250, 58, B, 6);
  ell(c, 0, -238, 42, 36, 0, L, 3);
  pieEye(c, -16, -262, 6, 10, .3); pieEye(c, 16, -262, 6, 10, -.3);
  inkS(c, 7); c.beginPath(); c.moveTo(-34, -280); c.lineTo(-6, -272); c.moveTo(34, -280); c.lineTo(6, -272); c.stroke();
  c.beginPath(); c.moveTo(-30, -226); c.quadraticCurveTo(0, -212 + grin * 10, 30, -226); c.lineWidth = 4; c.stroke();
  // mustache
  c.beginPath(); c.moveTo(0, -234); c.bezierCurveTo(-20, -246, -40, -236, -46, -222); c.bezierCurveTo(-30, -230, -12, -226, 0, -232); c.bezierCurveTo(12, -226, 30, -230, 46, -222); c.bezierCurveTo(40, -236, 20, -246, 0, -234); c.fillStyle = C.ink; c.fill();
  // top hat
  c.fillStyle = C.ink; c.fillRect(-36, -380, 72, 80); ell(c, 0, -300, 62, 12, 0, C.ink, 0); c.fillStyle = C.red; c.fillRect(-36, -322, 72, 12);
  c.restore();
}

// ---------------- PROJECTILES & PROPS ----------------
function drawPellet(c, x, y, a) {
  c.save(); c.translate(x, y); c.rotate(a);
  c.strokeStyle = 'rgba(243,227,195,.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-26, 0); c.lineTo(-12, 0); c.stroke();
  peanutPath(c, 10, 6); c.fillStyle = C.cream; c.fill(); inkS(c, 3); c.stroke(); c.restore();
}
function drawPeanut(c, x, y, rot, pink) {
  c.save(); c.translate(x, y); c.rotate(rot);
  peanutPath(c, 20, 12); c.fillStyle = pink ? C.pink : '#c99a5b'; c.fill(); inkS(c, 4); c.stroke();
  c.fillStyle = pink ? '#ffd0e4' : '#8d6634'; for (const [px, py] of [[-10, -3], [-6, 4], [9, -4], [12, 3]]) { c.beginPath(); c.arc(px, py, 1.8, 0, TAU); c.fill(); }
  c.restore();
  if (pink) sparkle(c, x + 16, y - 14);
}
function sparkle(c, x, y) { const k = .6 + Math.sin(G.t * 20) * .4; c.save(); c.translate(x, y); c.scale(k, k); starPath(c, 0, 0, 8, 2.5, 4); c.fillStyle = C.white; c.fill(); c.restore(); }
function drawBlob(c, x, y, r, vx, vy) {
  c.save(); c.translate(x, y); c.rotate(Math.atan2(vy, vx) + Math.PI / 2);
  c.beginPath(); c.moveTo(0, -r * 1.7); c.quadraticCurveTo(r * 1.1, -r * .2, r, r * .3); c.arc(0, r * .3, r, 0, Math.PI); c.quadraticCurveTo(-r * 1.1, -r * .2, 0, -r * 1.7); c.closePath();
  c.fillStyle = C.water; c.fill(); inkS(c, 3.5); c.stroke();
  c.fillStyle = 'rgba(255,255,240,.7)'; c.beginPath(); c.ellipse(-r * .35, 0, r * .22, r * .4, .3, 0, TAU); c.fill(); c.restore();
}
function drawTear(c, x, y, pink) {
  const r = 11; c.save(); c.translate(x, y);
  c.beginPath(); c.moveTo(0, -r * 2); c.quadraticCurveTo(r * 1.1, -r * .1, r, r * .3); c.arc(0, r * .3, r, 0, Math.PI); c.quadraticCurveTo(-r * 1.1, -r * .1, 0, -r * 2); c.closePath();
  c.fillStyle = pink ? C.pink : C.water; c.fill(); inkS(c, 3.5); c.stroke();
  c.fillStyle = 'rgba(255,255,240,.7)'; c.beginPath(); c.ellipse(-3.5, 0, 2.4, 4.5, .3, 0, TAU); c.fill(); c.restore();
  if (pink) sparkle(c, x + 12, y - 16);
}
function drawStripeBall(c, x, y, r, rot, pink) {
  c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = pink ? C.pink : C.cream; c.fill();
  c.save(); c.clip(); c.fillStyle = pink ? '#ffd0e4' : C.red; for (let i = -2; i <= 2; i += 2) c.fillRect(i * r * .4 - r * .2, -r, r * .4, r * 2); c.restore();
  inkS(c, 4); c.stroke(); c.restore(); if (pink) sparkle(c, x + r, y - r);
}
function drawBananaRang(c, x, y, rot, s = 1) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.beginPath(); c.moveTo(-26, -6); c.quadraticCurveTo(0, 26, 26, -6); c.quadraticCurveTo(0, 10, -26, -6); c.closePath();
  c.fillStyle = '#f2c63c'; c.fill(); inkS(c, 4); c.stroke();
  circ(c, -26, -6, 3.5, C.brownD, 2); circ(c, 26, -6, 3.5, C.brownD, 2); c.restore();
}
function drawBananaCoin(c, x, y, s = 1, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.beginPath(); c.moveTo(-18, -12); c.quadraticCurveTo(-8, 18, 20, 10); c.quadraticCurveTo(-2, 6, -12, -14); c.closePath();
  c.fillStyle = '#f2c63c'; c.fill(); inkS(c, 3.5); c.stroke(); circ(c, -15, -13, 3, C.brownD, 1.5);
  c.fillStyle = 'rgba(255,250,220,.7)'; c.beginPath(); c.ellipse(-4, 4, 5, 2, .6, 0, TAU); c.fill(); c.restore();
}
function drawCoinIcon(c, x, y, r = 16) { circ(c, x, y, r, C.mustard, 3.5); circ(c, x, y, r * .62, null, 2); drawBananaCoin(c, x, y + 1, r / 34, .2); }

const Art = {};
// plain helpers used by scenes (keep sprite objects separate from the draw functions)
Art.init = function () {
  this.bongoS = makeSprite(230, 240, 115, 196);
  this.tuskS = makeSprite(560, 600, 280, 500);
  this.sealS = makeSprite(170, 150, 80, 128);
};
Art.drawBongo = function (c, x, y, s) {
  const f = Math.floor((s.t || 0) * 12), sc = s.scale || 1, face = s.face || 1;
  const key = [s.pose, f, face, s.gun ? Math.round(s.aim.x * 2) + ',' + Math.round(s.aim.y * 2) : '', s.fur || '', sc, s.pose === 'idle' ? (G.beat * 12 | 0) : '', s.sx || 1, s.sy || 1].join('|');
  const spr = s.sprite || this.bongoS;
  spr.draw(c, x, y, key, cx => { cx.scale(face * sc * (s.sx || 1), sc * (s.sy || 1)); bongoBody(cx, s); }, s.tint);
};
Art.drawBongoDirect = function (c, x, y, s) {
  const sc = s.scale || 1, face = s.face || 1;
  c.save(); c.translate(x, y); c.scale(face * sc, sc); bongoBody(c, s); c.restore();
};
Art.drawTusk = function (c, x, y, s) {
  const f = Math.floor((s.t || 0) * 12), face = s.face || 1, sc = s.scale || 1;
  const key = [s.pose, f, face, sc, s.sx || 1, s.sy || 1].join('|');
  this.tuskS.draw(c, x, y, key, cx => { cx.scale(face * sc * (s.sx || 1), sc * (s.sy || 1)); tuskBody(cx, s); }, s.tint);
};
Art.drawSeal = function (c, x, y, s, spr) {
  const f = Math.floor((s.t || 0) * 12), face = s.face || 1;
  (spr || this.sealS).draw(c, x, y, [s.pose, f, face].join('|'), cx => { cx.scale(face, 1); sealBody(cx, s); }, s.tint);
};
