// Dev-only contact sheet of Taapoi's rides: /preview-rides.html?only=cart,foot&zoom=2
// Each row: the ride cycle frames, then jump and hit, at game size (× zoom),
// with the lane line through the origin and the gameplay hitbox.
import { paintRide, RIDE_SCALE } from './art/sprites/rides';
import { VEHICLES } from './data/vehicles';
import { P } from './data/palettes';
import { mix, withAlpha } from './lib/colour';
import type { VehicleId } from './systems/physics';

const ALL: VehicleId[] = [
  'canoe', 'cart', 'boita', 'foot', 'elephant', 'boitaElephant', 'palanquin', 'pressCart', 'bicycle', 'countryBoat',
  'dakota', 'bus', 'train', 'scooter', 'maglev', 'eboat', 'glider', 'lightsail', 'starBoita',
];
const ACTOR = 1.18;
const q = new URLSearchParams(location.search);
const only = q.get('only')?.split(',') as VehicleId[] | undefined;
const zoom = Number(q.get('zoom') ?? '1');
const boxes = q.get('box') !== '0';
const ids = only ?? ALL;
const k = ACTOR * zoom; // logical → screen

const rows = ids.map((id) => {
  const t0 = performance.now();
  const r = paintRide(id);
  return { id, r, ms: performance.now() - t0 };
});

const PAD = 14, LABEL = 22;
const cells = (r: (typeof rows)[number]) => [...r.r.frames, r.r.jump, r.r.hit];
const widthOf = (r: (typeof rows)[number]) => cells(r).reduce((s, c) => s + (c.width / RIDE_SCALE) * k + PAD, PAD);
const W = Math.max(600, ...rows.map(widthOf));
const H = rows.reduce((s, r) => s + (r.r.frames[0].height / RIDE_SCALE) * k + LABEL + PAD, PAD);
const cv = document.getElementById('c') as HTMLCanvasElement;
cv.width = Math.ceil(W);
cv.height = Math.ceil(H);
const ctx = cv.getContext('2d')!;
const sky = ctx.createLinearGradient(0, 0, 0, H);
sky.addColorStop(0, mix(P.seafoam, P.skyCream, 0.55));
sky.addColorStop(1, P.skyCream);
ctx.fillStyle = sky;
ctx.fillRect(0, 0, W, H);

let y = PAD;
for (const row of rows) {
  const { id, r, ms } = row;
  const prof = VEHICLES[id];
  const ch = (r.frames[0].height / RIDE_SCALE) * k;
  ctx.fillStyle = P.ink;
  ctx.font = '14px sans-serif';
  ctx.fillText(`${id} — ${r.frames.length} frames @ ${r.cycleHz} Hz, origin (${r.ox}, ${r.oy}), canvas ${r.frames[0].width / RIDE_SCALE}×${r.frames[0].height / RIDE_SCALE}, ribbon (${r.ribbon.x}, ${r.ribbon.y}), ${ms.toFixed(0)} ms`, PAD, y + 15);
  y += LABEL;
  let x = PAD;
  cells(row).forEach((c, i) => {
    const cw = (c.width / RIDE_SCALE) * k;
    ctx.fillStyle = withAlpha(P.limewhite, 0.35);
    ctx.fillRect(x, y, cw, ch);
    const ox = x + r.ox * k, oy = y + r.oy * k;
    if (boxes) {
      const hb = prof.hitbox;
      const bw = hb.w * ACTOR * zoom / ACTOR, bh = hb.h * zoom;
      ctx.fillStyle = withAlpha(P.neel, 0.12);
      if (prof.mode === 'flight') ctx.fillRect(ox - bw / 2, oy - bh / 2, bw, bh);
      else ctx.fillRect(ox - bw / 2, oy - hb.inset * zoom - bh, bw, bh);
    }
    ctx.drawImage(c, x, y, cw, ch);
    ctx.fillStyle = withAlpha(P.sindoor, 0.7);
    ctx.fillRect(x, oy, cw, 1);
    ctx.fillRect(ox - 3, oy - 3, 6, 6);
    // ribbon tie point
    ctx.fillStyle = withAlpha(P.neel, 0.9);
    ctx.fillRect(ox + r.ribbon.x * k - 2, oy + r.ribbon.y * k - 2, 4, 4);
    ctx.fillStyle = P.ink;
    ctx.font = '10px sans-serif';
    ctx.fillText(i < r.frames.length ? String(i) : i === r.frames.length ? 'jump' : 'hit', x + 3, y + 11);
    x += cw + PAD;
  });
  y += ch + PAD;
}
(window as unknown as { __ready: unknown }).__ready = { rides: rows.map((r) => `${r.id}:${r.ms.toFixed(0)}ms`) };
