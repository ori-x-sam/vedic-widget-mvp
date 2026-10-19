// The arena, Clash Royale style, painted like the scenes inside the Kalinga Rush frames. Three lanes run up the screen
// over bright grass, seen from a tilted 3/4 camera (far rows narrower and closer together); a river with three bridges
// crosses the middle; sky and soft clouds lie beyond the far end. Your towers stand at the bottom (the Sun), the
// opponent's at the top (the Moon): a Dhvaja per lane at tile 3 / 17 and the Mahadhvaja behind the middle lane. Each
// revealed lane is painted as its Kshetra (snow for Kailash, palms and boulders for Kishkindha...); a veiled lane is
// plain grass. A Kshetra chip at each lane's far end shows its mark ("?" until revealed); tapping it calls onChip.
// Nothing here decides anything about the game: it draws the state it is handed.
import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { lerpColor } from '../decl/css';
import { DHVAJAS, KSHETRAS, TEAMS } from '../content';
import { mulberry } from './random';
import { token } from '../tokens';
import { T } from '../tuning';
import { LOOK } from './look';
import * as P from './props';
import { createUnit, type Act, type Side, type UnitView } from './unit';

export type ArenaUnit = { id: number; god: string; side: Side; lane: number; tile: number; act: Act; actT: number };
export type ArenaTower = { side: Side; lane: number | 'maha'; hpFrac: number };
/** `grade` and `sky` are the yuga's tokens (content/match.kdl): the light over the arena and the sky beyond it. */
export type ArenaState = { lanes: (string | null)[]; units: ArenaUnit[]; towers?: ArenaTower[]; grade?: string; sky?: string };

/** World extent along a lane, tiles: a little behind each Mahadhvaja so the plinths have ground to stand on. */
const BACK_TILES = 1.4;
/** Lane centres across the field, -1 (left edge) .. 1 (right edge) at the near end. */
export const LANE_X = [-0.62, 0, 0.62];
/** Half a lane's ground strip, the same units. */
const LANE_HALF = 0.2;
/** The sky band above the far end, as a share of the arena's height. */
const SKY_SHARE = 0.11;

export type Box = { x: number; y: number; w: number; h: number };

/** The 3/4 projection: a lane point (x across, -1..1; tile along, 0 your end .. 20 theirs) to screen px, and its scale. */
export function project(box: Box, x: number, tile: number) {
  const span = T.LANE_TILES + 2 * BACK_TILES, u = (tile + BACK_TILES) / span, k = LOOK.ARENA_TILT;
  const near = box.y + box.h, far = box.y + box.h * SKY_SHARE;
  const z = 1 + k * u, depth = (u / z) * (1 + k); // 0 at the near edge, 1 at the far edge
  const s = 1 / z;
  return { x: box.x + box.w / 2 + x * s * box.w * 0.5, y: near - depth * (near - far), s };
}

export type Arena = ReturnType<typeof createArena>;

export function createArena(onChip: (lane: number) => void = () => {}) {
  const root = new Container(), ground = new Graphics(), water = new Graphics(), things = new Container(), flags = new Graphics(), chips = new Container(), grade = new Graphics();
  things.sortableChildren = true;
  root.addChild(ground, water, things, flags, grade, chips);
  let box: Box = { x: 0, y: 0, w: 390, h: 600 };
  let lanes: (string | null)[] = [null, null, null];
  let painted = '';
  let sky = '--sky';
  const units = new Map<number, { view: UnitView; data: ArenaUnit }>();
  let clock = 0;

  const C = (n: string) => token(n);
  const pt = (x: number, tile: number) => project(box, x, tile);
  /** A ground quad between two lateral bounds and two tiles. */
  const quad = (g: Graphics, x0: number, x1: number, t0: number, t1: number, color: number, alpha = 1) => {
    const a = pt(x0, t0), b = pt(x1, t0), c = pt(x1, t1), d = pt(x0, t1);
    g.moveTo(a.x, a.y).lineTo(b.x, b.y).lineTo(c.x, c.y).lineTo(d.x, d.y).closePath().fill({ color, alpha });
  };
  const towerTiles = () => ({ dhvaja: DHVAJAS.dhvaja!.tile, maha: DHVAJAS.mahadhvaja!.tile });
  const isRiver = (tile: number) => Math.abs(tile - T.MIDLINE_TILE) < 0.9;

  function paintSky(g: Graphics) {
    const top = box.y, horizon = pt(0, T.LANE_TILES + BACK_TILES).y, n = 14;
    for (let i = 0; i < n; i++) g.rect(box.x, top + ((horizon - top) * i) / n, box.w, (horizon - top) / n + 1).fill(lerpColor(C(sky), C('--sky-cream'), (i / (n - 1)) ** 1.6));
    const hills = lerpColor(C('--grass-shade'), C('--sky'), 0.45);
    g.moveTo(box.x, horizon);
    for (let i = 0; i <= 8; i++) g.quadraticCurveTo(box.x + (box.w * (i - 0.5)) / 8, horizon - 10 - (i % 3) * 5, box.x + (box.w * i) / 8, horizon - 2);
    g.lineTo(box.x + box.w, horizon + 2).lineTo(box.x, horizon + 2).closePath().fill(hills);
    const r = mulberry(7);
    for (let i = 0; i < 4; i++) P.cloud(g, box.x + box.w * (0.12 + 0.25 * i + r() * 0.08), top + (horizon - top) * (0.25 + r() * 0.35), 0.55 + r() * 0.25);
    g.circle(box.x + box.w * 0.84, top + (horizon - top) * 0.32, 11).fill({ color: C('--haldi'), alpha: 0.35 }).circle(box.x + box.w * 0.84, top + (horizon - top) * 0.32, 7).fill(C('--haldi'));
  }

  function paintField(g: Graphics) {
    const far = T.LANE_TILES + BACK_TILES, near = -BACK_TILES;
    quad(g, -1.6, 1.6, near, far, C('--grass'));
    // Clash Royale's mown bands: every other two-tile band a shade lighter.
    for (let t = near; t < far; t += 2) if (Math.round((t - near) / 2) % 2 === 0) quad(g, -1.6, 1.6, t, Math.min(far, t + 1), C('--grass-light'), 0.35);
    // grass texture: short strokes, light and dark, denser near
    const r = mulberry(11);
    for (let i = 0; i < 420; i++) {
      const p = pt(-1.05 + r() * 2.1, near + r() * (far - near)), len = 3 * p.s;
      g.moveTo(p.x, p.y).lineTo(p.x + (r() - 0.5) * 2, p.y - len).stroke({ width: 1.1 * p.s, color: r() < 0.5 ? C('--grass-shade') : C('--grass-light'), alpha: 0.55 });
    }
  }

  function paintLane(g: Graphics, lane: number, kshetra: string | null) {
    const x = LANE_X[lane]!, k = kshetra ? KSHETRAS[kshetra] : undefined;
    const far = T.LANE_TILES + 0.4, near = -0.4;
    if (k) {
      // the place's own ground: its lead colour lifted toward limewhite (Patala's cavern stays deep)
      const lead = C(k.lead), ground = kshetra === 'patala' ? lerpColor(lead, C('--peacock'), 0.25) : lerpColor(lead, C('--limewhite'), 0.3);
      quad(g, x - LANE_HALF, x + LANE_HALF, near, far, ground);
      quad(g, x - LANE_HALF, x - LANE_HALF + 0.03, near, far, lerpColor(ground, C('--hud-edge'), 0.2));
      quad(g, x + LANE_HALF - 0.03, x + LANE_HALF, near, far, lerpColor(ground, C('--hud-edge'), 0.2));
    }
    // the walked path down the lane's middle, worn at its edges, broken by the river
    for (const [t0, t1] of [[near, T.MIDLINE_TILE - 0.9], [T.MIDLINE_TILE + 0.9, far]] as const) {
      quad(g, x - 0.085, x + 0.085, t0, t1, C('--path-shade'));
      quad(g, x - 0.07, x + 0.07, t0, t1, kshetra === 'kailash' || kshetra === 'himavat' ? C('--limewhite') : C('--path'));
    }
  }

  function paintRiver(g: Graphics) {
    const t0 = T.MIDLINE_TILE - 0.9, t1 = T.MIDLINE_TILE + 0.9;
    quad(g, -1.6, 1.6, t0 - 0.12, t1 + 0.12, C('--path-shade'));
    quad(g, -1.6, 1.6, t0, t1, C('--river-deep'));
    quad(g, -1.6, 1.6, t0 + 0.25, t1 - 0.25, C('--river'));
    for (const x of LANE_X) {
      quad(g, x - 0.12, x + 0.12, t0 - 0.25, t1 + 0.25, lerpColor(C('--wood'), C('--hud-edge'), 0.3));
      for (let t = t0 - 0.2; t < t1 + 0.2; t += 0.32) quad(g, x - 0.11, x + 0.11, t, t + 0.24, C('--wood'));
      quad(g, x - 0.125, x - 0.1, t0 - 0.25, t1 + 0.25, lerpColor(C('--wood'), C('--hud-edge'), 0.45));
      quad(g, x + 0.1, x + 0.125, t0 - 0.25, t1 + 0.25, lerpColor(C('--wood'), C('--hud-edge'), 0.45));
    }
  }

  /** Scenery at a ground point, depth-sorted with the gods. */
  function prop(draw: (g: Graphics, x: number, y: number, s: number) => void, x: number, tile: number) {
    const p = pt(x, tile), g = new Graphics();
    draw(g, 0, 0, p.s);
    g.position.set(p.x, p.y);
    g.zIndex = p.y;
    things.addChild(g);
  }

  /** The Kshetra's scenery along its lane's edges, every couple of tiles, never on the path or the river. */
  function sceneryFor(lane: number, kshetra: string) {
    const x = LANE_X[lane]!, r = mulberry(lane * 101 + kshetra.length);
    const k = KSHETRAS[kshetra]!, support = C(k.support[0]!);
    for (let tile = 1.2; tile < T.LANE_TILES - 0.5; tile += 1.9) {
      if (isRiver(tile) || Math.abs(tile - towerTiles().dhvaja) < 1 || Math.abs(tile - (T.LANE_TILES - towerTiles().dhvaja)) < 1) continue;
      for (const side of [-1, 1]) {
        const px = x + side * (LANE_HALF - 0.06) + (r() - 0.5) * 0.03, t = tile + (r() - 0.5) * 0.6, pick = r();
        const draw: Record<string, (g: Graphics, x: number, y: number, s: number) => void> = {
          kailash: (g, a, b, s) => (pick < 0.6 ? P.snow(g, a, b, s * 0.9) : P.pine(g, a, b, s * 0.7, true)),
          'ksheer-sagar': (g, a, b, s) => P.pool(g, a, b, s * 0.8, C('--limewhite')),
          kurukshetra: (g, a, b, s) => (pick < 0.5 ? P.flag(g, a, b, s * 0.8, support) : P.boulder(g, a, b, s * 0.6, C('--laterite'))),
          'swarna-lanka': (g, a, b, s) => P.goldTile(g, a, b, s * 0.8, pick < 0.5 ? C('--haldi') : C('--marigold')),
          kishkindha: (g, a, b, s) => (pick < 0.5 ? P.palm(g, a, b, s * 0.75) : P.boulder(g, a, b, s * 0.8, C('--laterite'))),
          dandakaranya: (g, a, b, s) => { P.tree(g, a, b, s * 0.75, pick < 0.5 ? C('--tota') : lerpColor(C('--tota'), C('--peacock'), 0.5)); P.glow(g, a + 6 * s, b - 30 * s, s); },
          'samudra-manthan': (g, a, b, s) => P.pool(g, a, b, s * 0.85, C('--peacock')),
          amaravati: (g, a, b, s) => (pick < 0.6 ? P.flowerBush(g, a, b, s * 0.8, C('--rani')) : P.cloud(g, a, b - 8 * s, s * 0.45)),
          meru: (g, a, b, s) => P.goldTile(g, a, b, s * 0.85, pick < 0.5 ? C('--marigold') : C('--haldi')),
          patala: (g, a, b, s) => { P.boulder(g, a, b, s * 0.6, C('--neel')); P.glow(g, a, b - 12 * s, s * 1.2, pick < 0.5 ? C('--haldi') : C('--seafoam')); },
          satyaloka: (g, a, b, s) => P.lotusFlower(g, a, b, s * 0.9, C('--rani')),
          himavat: (g, a, b, s) => P.pine(g, a, b, s * 0.75, pick < 0.5),
        };
        prop(draw[kshetra] ?? P.flowerBush, px, t);
      }
    }
  }

  /** Trees, palms and flowers between and outside the lanes, Kalinga-shore style, the same in every match. */
  function borderScenery() {
    const r = mulberry(3);
    for (const x of [-0.95, -0.31, 0.31, 0.95]) {
      for (let tile = -0.6; tile < T.LANE_TILES + 0.8; tile += 2.3) {
        if (isRiver(tile)) continue;
        const pick = r(), t = tile + r() * 0.8, px = x + (r() - 0.5) * 0.06;
        if (Math.abs(x) > 0.9) prop((g, a, b, s) => (pick < 0.5 ? P.palm(g, a, b, s) : P.tree(g, a, b, s)), px, t);
        else prop((g, a, b, s) => (pick < 0.35 ? P.tree(g, a, b, s * 0.8) : pick < 0.7 ? P.flowerBush(g, a, b, s, pick < 0.5 ? C('--rani') : C('--marigold')) : P.boulder(g, a, b, s * 0.6)), px, t);
      }
    }
  }

  /** A tower: a stone plinth, a bamboo staff and a Pipili banner in its side's colours, with an HP bar. */
  function tower(side: Side, x: number, tile: number, big: boolean, hpFrac: number) {
    const p = pt(x, tile), g = new Graphics(), s = p.s * (big ? 1.45 : 1), team = TEAMS[side]!;
    const stone = C('--khondalite'), w = 22 * s, h = 18 * s;
    g.ellipse(0, 2 * s, w * 1.1, 7 * s).fill({ color: C('--grass-shade'), alpha: 0.6 });
    g.rect(-w, -h, w * 2, h).fill(lerpColor(stone, C('--hud-edge'), 0.2));
    g.rect(-w, -h, w * 0.9, h).fill(stone);
    g.ellipse(0, -h, w, 6 * s).fill(lerpColor(stone, C('--limewhite'), 0.35));
    for (let i = -2; i <= 2; i++) g.rect(i * w * 0.4 - 3 * s, -h - 6 * s, 6 * s, 6 * s).fill(lerpColor(stone, C('--limewhite'), 0.2)); // merlons
    g.rect(-1.5 * s, -h - 46 * s, 3 * s, 46 * s).fill(C('--wood'));
    g.circle(0, -h - 47 * s, 2.5 * s).fill(C('--haldi'));
    g.zIndex = p.y;
    g.position.set(p.x, p.y);
    things.addChild(g);
    const bar = new Graphics(), bw = 30 * s;
    bar.roundRect(-bw / 2, -h - 58 * s, bw, 5 * s, 2 * s).fill(C('--hud-edge')).roundRect(-bw / 2 + 1, -h - 57 * s, (bw - 2) * hpFrac, 3 * s, 1.5 * s).fill(C(team.paint));
    bar.position.set(p.x, p.y); bar.zIndex = p.y + 0.5;
    things.addChild(bar);
    banners.push({ x: p.x, y: p.y - h - 44 * s, s, paint: C(team.paint), trim: C(team.trim), emblem: team.emblem });
  }
  let banners: { x: number; y: number; s: number; paint: number; trim: number; emblem: string }[] = [];

  /** Banners wave every frame. */
  function drawFlags() {
    flags.clear();
    for (const b of banners) {
      const L = 26 * b.s, H = 16 * b.s, wave = (i: number) => Math.sin(clock * 3 + i * 1.3 + b.x * 0.05) * 2.5 * b.s;
      flags.moveTo(b.x + 1.5 * b.s, b.y);
      for (let i = 1; i <= 4; i++) flags.lineTo(b.x + (L * i) / 4, b.y + wave(i));
      for (let i = 4; i >= 1; i--) flags.lineTo(b.x + (L * i) / 4, b.y + H + wave(i));
      flags.lineTo(b.x + 1.5 * b.s, b.y + H).closePath().fill(b.paint);
      flags.rect(b.x + 1.5 * b.s, b.y + H * 0.42 + wave(1) * 0.5, L * 0.85, 2 * b.s).fill(b.trim);
      const ex = b.x + L * 0.5, ey = b.y + H * 0.5 + wave(2);
      if (b.emblem === 'disc') flags.circle(ex, ey, 4 * b.s).fill(b.trim);
      else flags.circle(ex, ey, 4.5 * b.s).fill(b.trim).circle(ex + 2 * b.s, ey - 1 * b.s, 3.8 * b.s).fill(b.paint);
    }
  }

  /** River ripples drift; fireflies and lamps would twinkle here too. */
  function drawWater() {
    water.clear();
    const r = mulberry(5);
    for (let i = 0; i < 26; i++) {
      const x = -1.05 + ((r() * 2.1 + clock * 0.03 * (0.5 + r())) % 2.1), t = T.MIDLINE_TILE - 0.55 + r() * 1.1;
      if (LANE_X.some((lx) => Math.abs(lx - x) < 0.14)) continue;
      const p = pt(x, t);
      water.moveTo(p.x - 5 * p.s, p.y).lineTo(p.x + 5 * p.s, p.y).stroke({ width: 1.5 * p.s, color: C('--river-light'), alpha: 0.7 * (0.5 + 0.5 * Math.sin(clock * 2 + i)) });
    }
  }

  function drawChips() {
    chips.removeChildren().forEach((c) => c.destroy({ children: true }));
    lanes.forEach((k, lane) => {
      const p = pt(LANE_X[lane]!, T.LANE_TILES + BACK_TILES * 0.45), c = new Container(), g = new Graphics(), d = k ? KSHETRAS[k] : undefined;
      const r = 15;
      g.circle(0, 2, r + 2).fill({ color: C('--hud-edge'), alpha: 0.5 });
      g.circle(0, 0, r + 2).fill(C('--hud-edge')).circle(0, 0, r).fill(d ? C(d.lead) : C('--hud'));
      if (d) g.moveTo(-r * 0.7, r * 0.45).arc(0, 0, r, Math.PI * 0.85, Math.PI * 0.15, true).fill(C(d.support[0]!)).circle(0, 0, r).stroke({ width: 2, color: C('--gold') });
      else g.circle(0, 0, r).stroke({ width: 2, color: C('--hud-rule') });
      const mark = new Text({ text: d ? d.name[0]! : '?', style: { fontFamily: 'Lilita One, Arial Black, sans-serif', fontSize: 17, fill: C('--cream'), stroke: { color: C('--hud-edge'), width: 4 } }, resolution: 2 });
      mark.anchor.set(0.5);
      c.addChild(g, mark);
      c.position.set(p.x, p.y);
      c.eventMode = 'static'; c.cursor = 'pointer';
      c.hitArea = new Rectangle(-22, -22, 44, 44); // a finger-sized target
      c.on('pointertap', () => onChip(lane));
      c.label = `kshetra-chip-${lane + 1}`;
      chips.addChild(c);
    });
  }

  function paint(towers: ArenaTower[]) {
    ground.clear();
    const gods = new Set([...units.values()].map((u) => u.view.root));
    things.removeChildren().forEach((c) => { if (!gods.has(c as Container)) c.destroy({ children: true }); }); // scenery goes; the gods stay
    banners = [];
    paintSky(ground);
    paintField(ground);
    lanes.forEach((k, lane) => paintLane(ground, lane, k));
    paintRiver(ground);
    borderScenery();
    lanes.forEach((k, lane) => k && sceneryFor(lane, k));
    const { dhvaja, maha } = towerTiles();
    const hp = (side: Side, lane: number | 'maha') => towers.find((t) => t.side === side && t.lane === lane)?.hpFrac ?? 1;
    for (const side of ['sun', 'moon'] as const) {
      const at = (t: number) => (side === 'sun' ? t : T.LANE_TILES - t);
      LANE_X.forEach((x, lane) => tower(side, x, at(dhvaja), false, hp(side, lane)));
      tower(side, 0, at(maha), true, hp(side, 'maha'));
    }
    drawChips();
    for (const u of units.values()) things.addChild(u.view.root);
  }

  return {
    root,
    /** Where the arena draws, in design px. */
    setBox(b: Box) { box = b; painted = ''; },
    /** Draw this state: repaint the ground when the box or the Kshetras change; reconcile the gods by id. */
    sync(s: ArenaState) {
      const key = JSON.stringify([box, s.lanes, s.towers ?? [], s.sky]);
      lanes = s.lanes;
      sky = s.sky ?? '--sky';
      if (key !== painted) { painted = key; paint(s.towers ?? []); }
      const live = new Set(s.units.map((u) => u.id));
      for (const [id, u] of units) if (!live.has(id)) { u.view.root.destroy({ children: true }); units.delete(id); }
      for (const d of s.units) {
        let u = units.get(d.id);
        if (!u) { u = { view: createUnit(d.god, d.side, LOOK.UNIT_HEIGHT_PX), data: d }; units.set(d.id, u); things.addChild(u.view.root); }
        u.data = d;
        const p = pt(LANE_X[d.lane]!, d.tile);
        u.view.root.position.set(p.x, p.y);
        u.view.root.scale.set(p.s);
        u.view.root.zIndex = p.y + 0.1;
        u.view.set(d.act, d.actT, d.side === 'sun' ? -1 : 1);
      }
      grade.clear();
      // the yuga's light: a multiply wash, stronger the darker the grade (dawn barely tints; Kali is night)
      if (s.grade) { const c = C(s.grade), lum = (((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11) / 255; grade.rect(box.x, box.y, box.w, box.h).fill({ color: c, alpha: Math.min(1, LOOK.GRADE_MIX * (1.8 - lum)) }); }
      grade.blendMode = 'multiply';
    },
    /** Advance the idle motion (water, banners) by dt seconds. */
    tick(dt: number) { clock += dt; drawWater(); drawFlags(); },
  };
}
