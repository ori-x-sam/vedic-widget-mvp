// Act III · Gajapati (records 16–19). Lead: sindoor; supports haldi, neel,
// tota — Pattachitra and Pipili reds and yellows. Deities, temples and
// chariots are scenery only, drawn traditionally.
import { P } from '../../data/palettes';
import { mix, withAlpha } from '../../lib/colour';
import { glow, taperStroke, wrapped } from '../brush';
import { bank, scatter, treeRow, type SceneDef } from '../engine';
import { jagannathTemple, pacheri, pandal, rekhaDeula, stall } from '../kit/buildings';
import { chariot } from '../kit/craft';
import { cat, cow, elephant, horse, monkey } from '../kit/animals';
import { chhati, crowd, flag, person } from '../kit/people';

const SKY: [number, string][] = [[0, mix(P.seafoam, P.skyCream, 0.4)], [0.5, mix(P.skyCream, P.haldi, 0.18)], [1, P.skyCream]];
const FESTIVE = [P.sindoor, P.haldi, P.rani, P.tota, P.neel];

export const SCENES: Record<string, () => SceneDef> = {
  // 16 · 29 Jun 1435 — Kapilendra Deva is crowned Gajapati.
  r16: () => ({
    id: 'r16',
    sky: { stops: SKY, sun: { x: 980, y: 120, r: 38 }, clouds: 'cumulus' },
    far: [{ kind: 'hills', a: mix(P.neel, P.skyCream, 0.6), b: P.neel, height: [24, 60], trees: true, haze: 0.5 }],
    ground: { kind: 'land', plain: mix(P.tota, P.haldi, 0.3), plainDetail: 'grass', path: mix(P.sindoor, P.chandan, 0.45), verge: mix(P.tota, P.laterite, 0.2) },
    mid: (ctx, rng, W) => {
      treeRow(ctx, rng.fork('t'), W, 190, 0.3, 0.25);
      scatter(rng.fork('rk'), W, [260, 420], (x) => wrapped(W, x, 40, (xx) => rekhaDeula(ctx, rng.fork(x), xx, 214, rng.range(80, 110), { haze: 0.3 })));
      bank(ctx, rng.fork('b'), W, 238, mix(P.tota, P.haldi, 0.3), mix(P.laterite, P.tota, 0.3));
      scatter(rng.fork('fl'), W, [120, 200], (x) => wrapped(W, x, 20, (xx) => flag(ctx, xx, 236, rng.range(36, 54), rng.pick(FESTIVE), 0.1)));
    },
    near: (ctx, rng, W) => {
      scatter(rng.fork('ch'), W, [220, 380], (x) => wrapped(W, x, 40, (xx) => {
        chhati(ctx, xx, 70, 20, [P.sindoor, P.haldi, P.neel, P.tota]);
        crowd(ctx, rng.fork(x), xx - 36, xx + 36, 134, 1.3, { density: 2 });
      }));
      wrapped(W, 1000, 70, (xx) => elephant(ctx, xx, 134, 0.9, { caparison: [P.sindoor, P.haldi], howdah: true }));
    },
    fore: 'flowers',
    sign: { date: '29 Jun 1435', title: 'Coronation' },
    landmarks: [
      {
        // The coronation: the Gajapati crowned under a Pipili canopy, drums and conch, elephants flanking.
        at: 0.45, plane: 'mid', w: 460, h: 230,
        paint: (ctx, rng, w, h) => {
          pandal(ctx, rng, w / 2, h - 4, 250, 150);
          chhati(ctx, w / 2, 40, 38, [P.sindoor, P.haldi, P.neel, P.tota]);
          ctx.fillStyle = mix(P.sindoor, P.ink, 0.25);
          ctx.fillRect(w / 2 - 38, h - 40, 76, 36); // dais
          person(ctx, w / 2, h - 40, 2.1, { pose: 'sit', cloth: P.haldi, cloth2: P.sindoor, head: 'crown', skin: 0.5 });
          person(ctx, w / 2 - 34, h - 40, 1.7, { pose: 'wave', cloth: P.limewhite, head: 'turban', skin: 0.6 });
          person(ctx, w / 2 + 38, h - 40, 1.7, { pose: 'conch', cloth: P.limewhite, head: 'turban', skin: 0.55 });
          elephant(ctx, w / 2 - 170, h - 4, 0.95, { caparison: [P.sindoor, P.haldi], howdah: true });
          elephant(ctx, w / 2 + 170, h - 4, 0.95, { caparison: [P.sindoor, P.neel], facing: -1, trunkUp: true });
          crowd(ctx, rng, 30, 120, h - 4, 1.6, { poses: ['armsUp', 'wave'], density: 1.6 });
          crowd(ctx, rng, w - 130, w - 30, h - 4, 1.6, { poses: ['armsUp', 'wave'], density: 1.6 });
          person(ctx, w / 2 - 80, h - 4, 1.5, { pose: 'drum', cloth: P.tota, head: 'turban' });
        },
      },
      {
        // A small elephant calf has stolen the marigold garlands.
        at: 0.8, plane: 'near', w: 200, h: 110,
        paint: (ctx, _rng, w, h) => {
          elephant(ctx, w / 2, h - 2, 0.55, { trunkUp: true });
          for (let i = 0; i < 6; i++) dab2(ctx, w / 2 + 14 + i * 3, h - 62 + i * 2, i);
          person(ctx, w / 2 - 60, h - 2, 1.2, { pose: 'point', cloth: P.rani, sari: true, head: 'veil' });
          person(ctx, w / 2 + 70, h - 2, 1.2, { pose: 'armsUp', cloth: P.haldi, head: 'cap' });
        },
      },
    ],
  }),

  // 17 · Legend — two riders and a milkmaid (Pattachitra feel; no hazards).
  r17: () => ({
    id: 'r17',
    sky: { stops: [[0, mix(P.haldi, P.skyCream, 0.55)], [1, P.skyCream]], sun: { x: 900, y: 130, r: 44, rays: true }, clouds: 'streak', cloudTint: P.limewhite },
    far: [{ kind: 'hills', a: mix(P.tota, P.skyCream, 0.5), b: P.neel, height: [30, 80], trees: true, haze: 0.45 }],
    ground: { kind: 'land', plain: mix(P.tota, P.haldi, 0.35), plainDetail: 'fields', path: mix(P.sindoor, P.chandan, 0.5), verge: mix(P.tota, P.neel, 0.2) },
    mid: (ctx, rng, W) => {
      treeRow(ctx, rng.fork('t'), W, 200, 0.28, 0.35);
      bank(ctx, rng.fork('b'), W, 238, mix(P.tota, P.haldi, 0.3), mix(P.laterite, P.tota, 0.3));
      // the king's army, marching far behind: little elephants and banners
      scatter(rng.fork('ar'), W, [180, 300], (x) => wrapped(W, x, 40, (xx) => { elephant(ctx, xx, 238, 0.42, { caparison: [P.sindoor, P.haldi], haze: 0.35 }); flag(ctx, xx + 18, 236, 40, P.sindoor, 0.35); }));
    },
    near: (ctx, rng, W) => {
      scatter(rng.fork('v'), W, [300, 520], (x) => wrapped(W, x, 40, (xx) => { cow(ctx, xx, 134, 1.1, { grazing: true }); }));
      // flat Pattachitra-like creeper border motifs
      for (let x = 0; x < W; x += 54) wrapped(W, x, 16, (xx) => { ctx.fillStyle = withAlpha(P.sindoor, 0.55); ctx.beginPath(); ctx.ellipse(xx, 136, 7, 3.4, 0.5, 0, Math.PI * 2); ctx.fill(); });
    },
    fore: 'flowers',
    sign: { date: 'Legend', title: 'Kanchi–Kaveri' },
    landmarks: [
      {
        // Two horsemen ride ahead of the army (as in the temple murals).
        at: 0.3, plane: 'mid', w: 260, h: 130,
        paint: (ctx, _rng, w, h) => {
          horse(ctx, w / 2 - 50, h - 4, 1.2, mix(P.ink, P.neel, 0.3), 1);
          person(ctx, w / 2 - 50, h - 30, 1.2, { pose: 'sit', cloth: P.neel, head: 'crown', skin: 0.75 });
          horse(ctx, w / 2 + 50, h - 4, 1.2, P.limewhite, 1);
          person(ctx, w / 2 + 50, h - 30, 1.2, { pose: 'sit', cloth: P.limewhite, head: 'crown', skin: 0.2 });
          glow(ctx, w / 2, h - 40, 120, P.haldi, 0.18);
        },
      },
      {
        // Manika, the milkmaid, offering curd from a pot by the road.
        at: 0.65, plane: 'near', w: 180, h: 110,
        paint: (ctx, _rng, w, h) => {
          person(ctx, w / 2, h - 2, 1.5, { pose: 'serve', cloth: P.rani, cloth2: P.haldi, sari: true, head: 'veil', skin: 0.5 });
          ctx.fillStyle = mix(P.laterite, P.ink, 0.15);
          ctx.beginPath(); ctx.ellipse(w / 2 + 26, h - 12, 12, 11, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = P.limewhite;
          ctx.beginPath(); ctx.ellipse(w / 2 + 26, h - 22, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
          cow(ctx, w / 2 - 54, h - 2, 1.1, { humped: true });
        },
      },
    ],
  }),

  // 18 · 1510 — Chaitanya arrives; Rath Yatra on Bada Danda.
  r18: () => ({
    id: 'r18',
    sky: { stops: SKY, sun: { x: 1020, y: 116, r: 36 }, clouds: 'cumulus' },
    far: [{ kind: 'hills', a: mix(P.peacock, P.skyCream, 0.55), b: P.neel, height: [18, 44], haze: 0.55 }],
    ground: { kind: 'land', plain: mix(P.chandan, P.limewhite, 0.4), plainDetail: 'sand', path: mix(P.chandan, P.limewhite, 0.25), verge: mix(P.tota, P.chandan, 0.4) },
    mid: (ctx, rng, W) => {
      treeRow(ctx, rng.fork('t'), W, 168, 0.35, 0.2);
      jagannathTemple(ctx, rng.fork('jt'), 360, 232, 1.2, 0.2);
      pacheri(ctx, rng.fork('pw'), 40, 700, 238, 28, 0.2);
      scatter(rng.fork('st'), W, [200, 340], (x) => wrapped(W, x, 50, (xx) => stall(ctx, xx, 238, 46, 32, [P.sindoor, P.haldi], 0.15)));
    },
    near: (ctx, rng, W) => {
      scatter(rng.fork('cr'), W, [100, 180], (x) => wrapped(W, x, 30, (xx) => crowd(ctx, rng.fork(x), xx - 20, xx + 20, 134, 1.2, { poses: ['cymbal', 'armsUp', 'drum'], density: 1.6 })));
      scatter(rng.fork('ch'), W, [260, 460], (x) => wrapped(W, x, 30, (xx) => chhati(ctx, xx, 60, 18, FESTIVE)));
    },
    fore: 'flowers',
    sign: { date: '1510', title: 'Rath Yatra' },
    landmarks: [
      {
        // The three chariots with their exact canopy pairs, drawn traditionally, far on Bada Danda.
        at: 0.5, plane: 'far', w: 700, h: 260, y: 450,
        paint: (ctx, rng, w, h) => {
          chariot(ctx, rng.fork('a'), 130, h - 6, 0.82, [P.sindoor, P.haldi], 0.15);
          chariot(ctx, rng.fork('b'), 350, h - 6, 0.9, [P.sindoor, P.tota], 0.15);
          chariot(ctx, rng.fork('c'), 570, h - 6, 0.78, [P.sindoor, P.ink], 0.15);
          crowd(ctx, rng, 20, w - 20, h - 4, 1.0, { poses: ['pull', 'armsUp'], density: 1.2, haze: 0.1 });
        },
      },
      {
        // Chaitanya and the kirtan: dancing devotees, cymbals and drums.
        at: 0.22, plane: 'mid', w: 240, h: 120,
        paint: (ctx, _rng, w, h) => {
          person(ctx, w / 2, h - 4, 1.8, { pose: 'armsUp', cloth: P.haldi, cloth2: P.limewhite, head: 'bun', skin: 0.3 });
          person(ctx, w / 2 - 44, h - 4, 1.4, { pose: 'cymbal', cloth: P.limewhite, head: 'bun', skin: 0.5 });
          person(ctx, w / 2 + 44, h - 4, 1.4, { pose: 'drum', cloth: P.limewhite, head: 'bun', skin: 0.55 });
          person(ctx, w / 2 + 84, h - 4, 1.3, { pose: 'armsUp', cloth: P.limewhite, head: 'bun', skin: 0.45 });
          glow(ctx, w / 2, h - 50, 90, P.marigold, 0.15);
        },
      },
      {
        // A monkey has grabbed a banana from a pilgrim's stall.
        at: 0.75, plane: 'near', w: 160, h: 100,
        paint: (ctx, _rng, w, h) => {
          stall(ctx, w / 2 - 20, h - 2, 56, 40, [P.rani, P.haldi]);
          monkey(ctx, w / 2 + 44, h - 2, 1.2, -1, 0, P.haldi);
          person(ctx, w / 2 - 20, h - 2, 1.2, { pose: 'armsUp', cloth: P.tota, head: 'turban' });
        },
      },
    ],
  }),

  // 19 · 1568 — the mridanga, a palm-leaf forest at dusk (quiet tone).
  r19: () => ({
    id: 'r19',
    sky: { stops: [[0, mix(P.neel, P.ink, 0.35)], [0.45, mix(P.neel, P.sindoor, 0.35)], [0.8, mix(P.marigold, P.sindoor, 0.4)], [1, mix(P.haldi, P.marigold, 0.5)]], sun: { x: 300, y: 330, r: 44, colour: P.marigold }, stars: 60, clouds: 'streak', cloudTint: P.rani },
    far: [{ kind: 'hills', a: mix(P.neel, P.ink, 0.45), b: P.neel, height: [40, 100], trees: true, haze: 0.2 }],
    ground: { kind: 'land', plain: mix(P.tota, P.ink, 0.55), plainDetail: 'grass', path: mix(P.laterite, P.ink, 0.45), verge: mix(P.tota, P.ink, 0.6) },
    mid: (ctx, rng, W) => {
      treeRow(ctx, rng.fork('t'), W, 230, 0.15, 0.7);
      // lamps of a distant village
      scatter(rng.fork('l'), W, [120, 260], (x) => wrapped(W, x, 20, (xx) => { glow(ctx, xx, 222, 14, P.haldi, 0.8); ctx.fillStyle = P.haldi; ctx.fillRect(xx - 1, 220, 2, 3); }));
    },
    near: (ctx, rng, W) => {
      scatter(rng.fork('p'), W, [120, 220], (x) => wrapped(W, x, 80, (xx) => taperStroke(ctx, [{ x: xx, y: 140 }, { x: xx + rng.range(-8, 8), y: rng.range(20, 60) }], 6, mix(P.laterite, P.ink, 0.6), 1, [1, 0.6])));
      scatter(rng.fork('c'), W, [380, 700], (x) => wrapped(W, x, 20, (xx) => cat(ctx, xx, 136, 1.1, P.ink, -1)));
    },
    fore: 'grass',
    rain: false,
    sign: { date: '1568', title: 'The mridanga' },
    landmarks: [
      {
        // A devotee, far away, hurries along the forest path carrying a mridanga drum.
        at: 0.4, plane: 'mid', w: 160, h: 90,
        paint: (ctx, _rng, w, h) => {
          person(ctx, w / 2, h - 4, 1.5, { pose: 'carry', cloth: P.limewhite, head: 'turban', skin: 0.5, facing: 1 });
          glow(ctx, w / 2 + 10, h - 30, 36, P.haldi, 0.3);
        },
      },
      {
        // The temple at dusk, a single lamp lit on its steps.
        at: 0.1, plane: 'far', w: 220, h: 200, y: 452,
        paint: (ctx, rng, w, h) => {
          rekhaDeula(ctx, rng, w / 2, h - 4, 160, { haze: 0.35 });
          glow(ctx, w / 2, h - 10, 22, P.marigold, 0.9);
        },
      },
    ],
  }),
};

/** A marigold garland bead. */
function dab2(ctx: CanvasRenderingContext2D, x: number, y: number, i: number): void {
  ctx.fillStyle = i % 2 ? P.marigold : P.haldi;
  ctx.beginPath();
  ctx.arc(x, y, 3.4, 0, Math.PI * 2);
  ctx.fill();
}
