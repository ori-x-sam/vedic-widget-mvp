// Dev-only contact sheet of every hazard sprite: /preview-hazards.html?page=0&per=40&z=1.5
// (?extra=1 shows the record visuals and friends). Not part of the build.
import { ARCH, type Arch } from './data/hazards';
import { P } from './data/palettes';
import { RECORDS } from './data/records';
import { mix, withAlpha } from './lib/colour';
import { hazardVariants, HZ_SCALE, paintFriend, paintHazard, paintRecordVis, type Sprite } from './art/sprites/hazards';

const q = new URLSearchParams(location.search);
const page = Number(q.get('page') ?? '0');
const per = Number(q.get('per') ?? '40');
const z = Number(q.get('z') ?? '1.5');
const cols = Number(q.get('cols') ?? '8');
const extra = q.get('extra') === '1';

// every (visual, archetype) pair used by the records, in record order
const pairs: { vis: string; arch: Arch; recs: string[] }[] = [];
for (const r of Object.values(RECORDS)) {
  for (const [arch, vis] of Object.entries(r.hazards) as [Arch, string][]) {
    const hit = pairs.find((p) => p.vis === vis && p.arch === arch);
    if (hit) hit.recs.push(r.id);
    else pairs.push({ vis, arch, recs: [r.id] });
  }
}

interface Cell { label: string; arch: Arch | 'friend' | 'record'; sprite: Sprite }
const t0 = performance.now();
const all: Cell[] = [];
for (const p of pairs) for (let v = 0; v < hazardVariants(p.vis); v++) all.push({ label: `${p.vis}·${p.arch}${hazardVariants(p.vis) > 1 ? ` v${v}` : ''} (${p.recs.join(',')})`, arch: p.arch, sprite: paintHazard(p.vis, p.arch, v) });
const msHazards = performance.now() - t0;
const extras: Cell[] = [];
for (const v of ['drum', 'oar'] as const) extras.push({ label: `record ${v}`, arch: 'record', sprite: paintRecordVis(v) });
for (const f of ['kirtan', 'turtle'] as const) for (let v = 0; v < 3; v++) extras.push({ label: `friend ${f} v${v}`, arch: 'friend', sprite: paintFriend(f, v) });
extras.push({ label: 'unknown·walker', arch: 'walker', sprite: paintHazard('zzz', 'walker', 0) });
extras.push({ label: 'unknown·ceil', arch: 'ceil', sprite: paintHazard('zzz', 'ceil', 0) });
const ms = performance.now() - t0;

const only = q.get('keys')?.split(',');
const cells = extra ? extras : only ? all.filter((c) => only.includes(c.label.split('·')[0])) : all.slice(page * per, page * per + per);
const CW = 180 * z, CH = 200 * z;
const rows = Math.ceil(cells.length / cols);
const cv = document.getElementById('c') as HTMLCanvasElement;
cv.width = CW * cols;
cv.height = CH * rows + 30;
document.body.style.background = P.frame;
const ctx = cv.getContext('2d')!;
ctx.fillStyle = P.frame;
ctx.fillRect(0, 0, cv.width, cv.height);
ctx.fillStyle = P.cream;
ctx.font = '14px sans-serif';
ctx.fillText(`${all.length} hazard sprites in ${msHazards.toFixed(0)} ms; total incl. extras ${ms.toFixed(0)} ms — page ${page}`, 8, 20);

cells.forEach((cell, i) => {
  const x0 = (i % cols) * CW, y0 = 30 + Math.floor(i / cols) * CH;
  const g = ctx.createLinearGradient(0, y0, 0, y0 + CH);
  g.addColorStop(0, mix(P.skyCream, P.seafoam, 0.35));
  g.addColorStop(1, P.skyCream);
  ctx.fillStyle = g;
  ctx.fillRect(x0 + 2, y0 + 2, CW - 4, CH - 4);
  const cx = x0 + CW / 2;
  let ax = cx, ay = y0 + CH * 0.72;
  const a = cell.arch === 'friend' || cell.arch === 'record' ? null : ARCH[cell.arch];
  if (a?.anchor === 'centre' || cell.arch === 'record') ay = y0 + CH * 0.45;
  if (a?.anchor === 'ceiling') ay = y0 + CH * 0.12;
  // lane / ceiling line
  ctx.fillStyle = withAlpha(P.laterite, 0.6);
  if (!a || a.anchor === 'ground') ctx.fillRect(x0 + 2, ay, CW - 4, 2 * z);
  if (a?.anchor === 'ceiling') ctx.fillRect(x0 + 2, ay - 2 * z, CW - 4, 2 * z);
  const s = cell.sprite;
  const w = (s.canvas.width / HZ_SCALE) * z, h = (s.canvas.height / HZ_SCALE) * z;
  ax = cx;
  ctx.drawImage(s.canvas, ax - s.ox * w, ay - s.oy * h, w, h);
  if (a) {
    const hw = a.w * a.hitW * z, hh = a.h * a.hitH * z;
    const hy = a.anchor === 'ground' ? ay - hh : a.anchor === 'ceiling' ? ay : ay - hh / 2;
    ctx.fillStyle = withAlpha(P.sindoor, 0.12);
    ctx.fillRect(ax - hw / 2, hy, hw, hh);
    ctx.strokeStyle = withAlpha(P.sindoor, 0.6);
    ctx.lineWidth = 1;
    ctx.strokeRect(ax - hw / 2, hy, hw, hh);
  }
  ctx.fillStyle = P.ink;
  ctx.font = `${Math.round(10 * z)}px sans-serif`;
  ctx.fillText(cell.label, x0 + 6, y0 + CH - 8);
});
(window as unknown as { __ready: unknown }).__ready = { ms, n: all.length };
