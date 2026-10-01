// Low-poly stages: every `prop "kind" …` line in content/stages.kdl becomes a little procedural set piece
// placed in real depth (z < 0 behind the play plane, z > 0 in front). Repeating props (every=/every-y=)
// wrap around the camera so long levels and endless skies never run out of scenery.
import * as THREE from "three";
import type { StageDef, StageProp } from "../core/content";
import { MaterialBank, unitGeo } from "./model";

type Rnd = () => number;
type Upd = (t: number) => void;
interface Built { obj: THREE.Object3D; upd?: Upd }
interface Placed { p: StageProp; copies: THREE.Object3D[]; upds: (Upd | undefined)[] }

function rng(seed: number): Rnd {
  let s = seed >>> 0 || 1;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export class StageBuilder {
  group = new THREE.Group();
  private placed: Placed[] = [];
  private upds: Upd[] = [];
  constructor(public mats: MaterialBank) {}

  // ── tiny mesh helpers ──
  private m(shape: string, color: string, w: number, h: number, d: number, x: number, y: number, z: number, opts: { emissive?: number; detail?: number; taper?: number; rx?: number; ry?: number; rz?: number; shadow?: boolean; receive?: boolean } = {}) {
    const mesh = new THREE.Mesh(unitGeo(shape, opts.detail ?? 0, opts.taper ?? 1), this.mats.shared(color, opts.emissive ?? 0));
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.rotation.set(opts.rx ?? 0, opts.ry ?? 0, opts.rz ?? 0);
    mesh.castShadow = !!opts.shadow;
    mesh.receiveShadow = opts.receive ?? true;
    return mesh;
  }
  private additive(color: string, alpha: number) {
    return new THREE.MeshBasicMaterial({ color: this.mats.color(color), transparent: true, opacity: alpha, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, vertexColors: true });
  }
  /** A catenary string of things between x0..x1 sagging by `sag`. */
  private string(g: THREE.Group, x0: number, x1: number, y: number, z: number, sag: number, n: number, each: (x: number, y: number, i: number) => void, rope = "--ink") {
    for (let i = 0; i <= n; i++) {
      const k = i / n, x = x0 + (x1 - x0) * k, yy = y - Math.sin(k * Math.PI) * sag;
      each(x, yy, i);
    }
    const segs = 10;
    for (let i = 0; i < segs; i++) {
      const k0 = i / segs, k1 = (i + 1) / segs;
      const ax = x0 + (x1 - x0) * k0, ay = y - Math.sin(k0 * Math.PI) * sag, bx = x0 + (x1 - x0) * k1, by = y - Math.sin(k1 * Math.PI) * sag;
      const len = Math.hypot(bx - ax, by - ay);
      g.add(this.m("box", rope, len, 2, 2, (ax + bx) / 2, (ay + by) / 2, z, { rz: Math.atan2(by - ay, bx - ax), receive: false }));
    }
  }

  // ── the prop vocabulary (one function per kind) ──
  private kinds: Record<string, (p: StageProp, r: Rnd, i: number) => Built> = {
    /** Wooden stage deck: top at y, front apron, plank seams. */
    deck: (p) => {
      const g = new THREE.Group();
      const w = p.w || 6000, col = p.color || "--wood";
      g.add(this.m("box", col, w, 40, 760, 0, -20, -260));
      for (let i = 0; i < 9; i++) g.add(this.m("box", "--wood-dark", w, 1, 3, 0, 0.6, -620 + i * 80, { receive: true }));
      g.add(this.m("box", p.color2 || "--velvet-dark", w, 260, 20, 0, -150, 118)); // apron skirt
      g.add(this.m("box", "--gold", w, 10, 24, 0, -6, 116, { emissive: 0.15 }));
      return { obj: g };
    },
    /** Plain ground slab (grass/sand) with a darker lip. */
    ground: (p) => {
      const g = new THREE.Group();
      const w = p.w || 6000;
      g.add(this.m("box", p.color || "--leaf", w, 60, 1100, 0, -30, -380));
      g.add(this.m("box", p.color2 || "--leaf-dark", w, 300, 20, 0, -170, 170));
      return { obj: g };
    },
    /** Endless flat land far below (the shmup's countryside). */
    plain: (p) => { const m = this.m("plane", p.color || "--leaf", 400000, 9000, 1, 0, 0, -4000, { rx: -Math.PI / 2 }); return { obj: m }; },
    /** Flat wall/backdrop panel. */
    backdrop: (p) => ({ obj: this.m("box", p.color || "--velvet", p.w || 4000, p.h || 1400, 20, 0, (p.h || 1400) / 2 - 100, 0) }),
    /** Pleated velvet drape: x/w/h, hangs from y=h. */
    curtain: (p, r) => {
      const g = new THREE.Group();
      const w = p.w || 420, h = p.h || 1000, n = Math.max(3, Math.round(w / 55));
      for (let i = 0; i < n; i++) {
        const k = i / (n - 1), d = 34 + (i % 2) * 22;
        const hh = h - (i % 2 ? 6 : 0);
        g.add(this.m("box", i % 2 ? p.color || "--velvet" : p.color2 || "--velvet-dark", w / n + 4, hh, d, -w / 2 + k * w, hh / 2 - 60, (i % 2) * 18, { shadow: true }));
      }
      // tie-back cord + tassel
      g.add(this.m("box", "--gold", w * 0.9, 14, 70, 0, h * 0.32, 30, { emissive: 0.1 }));
      g.add(this.m("cone", "--gold", 30, 50, 30, (p.x < 0 ? 1 : -1) * w * 0.45, h * 0.27, 50, { emissive: 0.1 }));
      void r;
      return { obj: g };
    },
    /** Top swag strip with gold fringe, spans w. */
    valance: (p) => {
      const g = new THREE.Group();
      const w = p.w || 3200, n = Math.round(w / 160);
      g.add(this.m("box", p.color || "--velvet", w, 120, 40, 0, 60, 0));
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + (i + 0.5) * (w / n);
        g.add(this.m("cyl", p.color || "--velvet", 150, 40, 60, x, -10, 10, { detail: 6, taper: 1.3 }));
        g.add(this.m("cone", "--gold", 18, 34, 18, x, -46, 30, { emissive: 0.15, detail: 5 }));
      }
      g.add(this.m("box", "--gold", w, 12, 50, 0, 0, 22, { emissive: 0.15 }));
      return { obj: g };
    },
    /** Golden proscenium frame (two pillars + header). */
    arch: (p) => {
      const g = new THREE.Group();
      const w = p.w || 1700, h = p.h || 900;
      for (const sx of [-1, 1]) {
        g.add(this.m("box", p.color || "--gold", 70, h, 70, sx * w / 2, h / 2 - 40, 0, { emissive: 0.08 }));
        g.add(this.m("box", p.color2 || "--gold-dark", 100, 40, 100, sx * w / 2, -20, 0));
        g.add(this.m("ball", "--marigold", 60, 60, 60, sx * w / 2, h + 10, 0, { emissive: 0.2 }));
      }
      return { obj: g };
    },
    /** Front-of-stage footlights: a row of glowing cups. */
    footlights: (p) => {
      const g = new THREE.Group();
      const w = p.w || 3000, n = Math.round(w / 140);
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + (i + 0.5) * (w / n);
        g.add(this.m("box", "--ink", 34, 12, 20, x, 0, 0, { receive: false }));
        g.add(this.m("ball", p.color || "--marigold", 20, 10, 14, x, 8, -2, { emissive: 0.9, receive: false }));
      }
      return { obj: g };
    },
    /** Audience: rows of bobbing heads in front of the stage. */
    crowd: (p, r) => {
      const g = new THREE.Group();
      const w = p.w || 3200, n = Math.round(w / 64), rows = p.n || 2;
      const heads: { m: THREE.Object3D; ph: number; y: number }[] = [];
      const tones = ["--skin-1", "--skin-2", "--skin-3"], shirts = [p.color || "--indigo", "--velvet-dark", "--peacock", "--clay-dark", "--raj-coat"];
      for (let row = 0; row < rows; row++) for (let i = 0; i < n; i++) {
        const x = -w / 2 + (i + 0.5 + (row % 2) * 0.5) * (w / n) + (r() - 0.5) * 16, zz = row * 70, yy = -row * 30;
        const person = new THREE.Group();
        person.add(this.m("ball", shirts[Math.floor(r() * shirts.length)], 56, 50, 40, 0, 0, 0, { receive: false }));
        const head = this.m("ball", tones[Math.floor(r() * 3)], 34, 38, 34, 0, 40, 0, { receive: false });
        person.add(head);
        person.add(this.m("ball", "--ink", 36, 18, 36, 0, 54, -3, { receive: false }));
        person.position.set(x, yy, zz);
        g.add(person);
        heads.push({ m: person, ph: r() * 6.28, y: yy });
      }
      return { obj: g, upd: (t) => { for (const h of heads) h.m.position.y = h.y + Math.max(0, Math.sin(t * 5 + h.ph)) * 6; } };
    },
    /** Marigold garland swag between x-w/2..x+w/2. */
    garland: (p) => {
      const g = new THREE.Group();
      const w = p.w || 600;
      this.string(g, -w / 2, w / 2, 0, 0, p.h || 90, Math.round(w / 34), (x, y, i) => {
        g.add(this.m("ball", i % 3 === 2 ? p.color2 || "--vermilion" : p.color || "--marigold", 30, 30, 30, x, y, 0, { emissive: 0.12, receive: false }));
      }, "--leaf-dark");
      return { obj: g };
    },
    /** Triangle flag bunting. */
    bunting: (p, r) => {
      const g = new THREE.Group();
      const w = p.w || 600, cols = ["--saffron", "--teal", "--rani", "--marigold", "--peacock", "--vermilion"];
      this.string(g, -w / 2, w / 2, 0, 0, p.h || 60, Math.round(w / 46), (x, y) => {
        g.add(this.m("cone", cols[Math.floor(r() * cols.length)], 34, 44, 4, x, y - 24, 0, { detail: 3, rz: Math.PI, receive: false }));
      });
      return { obj: g };
    },
    /** Hanging tin star / bulb. */
    star: (p, r) => {
      const g = new THREE.Group();
      const s = 40 + r() * 20;
      g.add(this.m("box", "--ink", 2, 400, 2, 0, 200, 0));
      const st = this.m("gem", p.color || "--gold", s, s, s * 0.4, 0, 0, 0, { emissive: 0.4, receive: false });
      g.add(st);
      const ph = r() * 6;
      return { obj: g, upd: (t) => { st.rotation.y = Math.sin(t * 1.3 + ph) * 0.8; } };
    },
    /** Neon tube light bar. */
    tube: (p) => ({ obj: this.m("cyl", p.color || "--cyber", 14, p.w || 260, 14, 0, 0, 0, { emissive: 0.9, rz: Math.PI / 2, receive: false }) }),
    /** Additive light beam from (x,y) pointing down at rot degrees; w = radius at floor, h = length. */
    spot: (p) => {
      const h = p.h || 900, w = p.w || 260;
      const geo = new THREE.ConeGeometry(w, h, 20, 1, true);
      geo.translate(0, -h / 2, 0);
      const col = new Float32Array(geo.attributes.position.count * 3);
      for (let i = 0; i < geo.attributes.position.count; i++) { const k = 1 + geo.attributes.position.getY(i) / h * 0.85; col.set([k, k, k], i * 3); }
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const mesh = new THREE.Mesh(geo, this.additive(p.color || "--white", 0.13));
      mesh.rotation.z = (p.rot * Math.PI) / 180;
      mesh.renderOrder = 50;
      const g = new THREE.Group();
      g.add(mesh);
      g.add(this.m("cyl", "--ink", 60, 70, 60, 0, 10, 0, { rz: mesh.rotation.z, receive: false }));
      // floor pool
      const pool = new THREE.Mesh(unitGeo("plane"), new THREE.MeshBasicMaterial({ color: this.mats.color(p.color || "--white"), transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }));
      pool.rotation.x = -Math.PI / 2;
      pool.scale.set(w * 2.2, w * 0.9, 1);
      pool.position.set(Math.sin(mesh.rotation.z) * p.y, -p.y + 2, 0); // where the beam meets the floor (y=0)
      g.add(pool);
      const ph = p.x * 0.01;
      return { obj: g, upd: (t) => { mesh.rotation.z = (p.rot * Math.PI) / 180 + Math.sin(t * 0.5 + ph) * 0.06; } };
    },
    /** Big sun / moon disc in the sky. */
    sun: (p) => {
      const g = new THREE.Group();
      const s = 220 * p.s;
      g.add(this.m("ball", p.color || "--marigold", s, s, s * 0.3, 0, 0, 0, { emissive: 0.85, detail: 2, receive: false }));
      const halo = new THREE.Mesh(new THREE.CircleGeometry(s * 0.95, 24), new THREE.MeshBasicMaterial({ color: this.mats.color(p.color2 || p.color || "--marigold"), transparent: true, opacity: 0.25, depthWrite: false }));
      halo.position.z = -40;
      g.add(halo);
      return { obj: g };
    },
    /** Mughal palace skyline: domes, arches, minarets. */
    palace: (p, r) => {
      const g = new THREE.Group();
      const c = p.color || "--paper", c2 = p.color2 || "--saffron";
      g.add(this.m("box", c, 900, 300, 120, 0, 150, 0));
      for (let i = 0; i < 5; i++) g.add(this.m("box", "--clay-dark", 90, 150, 10, -360 + i * 180, 110, 62));
      for (let i = 0; i < 5; i++) g.add(this.m("dome", "--clay-dark", 90, 60, 10, -360 + i * 180, 185, 62, { detail: 8 }));
      g.add(this.m("cyl", c, 300, 120, 300, 0, 360, 0, { detail: 10 }));
      g.add(this.m("dome", c2, 330, 260, 330, 0, 420, 0, { detail: 10 }));
      g.add(this.m("cone", "--gold", 20, 90, 20, 0, 590, 0, { emissive: 0.3 }));
      for (const sx of [-1, 1]) {
        g.add(this.m("cyl", c, 60, 520, 60, sx * 520, 260, 0, { detail: 8 }));
        g.add(this.m("dome", c2, 90, 80, 90, sx * 520, 520, 0, { detail: 8 }));
        g.add(this.m("box", c, 160, 90, 160, sx * 300, 345, 0));
        g.add(this.m("dome", c2, 150, 110, 150, sx * 300, 390, 0, { detail: 8 }));
      }
      void r;
      return { obj: g };
    },
    /** Low-poly palm tree. */
    palm: (p, r) => {
      const g = new THREE.Group();
      const h = 260 + r() * 120;
      let x = 0;
      for (let i = 0; i < 6; i++) { const y = (i + 0.5) * h / 6; x += 6; g.add(this.m("cyl", "--wood", 30 - i * 2, h / 6 + 4, 30 - i * 2, x, y, 0, { detail: 6, taper: 0.85, shadow: true })); }
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const leaf = this.m("cone", i % 2 ? "--leaf" : "--leaf-dark", 46, 200, 12, x + Math.cos(a) * 80, h - 20, Math.sin(a) * 80, { detail: 4, shadow: true });
        leaf.rotation.set(Math.sin(a) * 1.2, 0, -Math.cos(a) * 1.2 - 0.2);
        g.add(leaf);
      }
      return { obj: g };
    },
    tree: (p, r) => {
      const g = new THREE.Group();
      const h = 120 + r() * 60;
      g.add(this.m("cyl", "--wood-dark", 26, h, 26, 0, h / 2, 0, { detail: 6, shadow: true }));
      g.add(this.m("ball", p.color || "--leaf", 170, 150, 170, 0, h + 50, 0, { shadow: true }));
      g.add(this.m("ball", p.color2 || "--leaf-dark", 110, 100, 110, 50, h + 10, 30, { shadow: true }));
      return { obj: g };
    },
    bush: (p, r) => {
      const g = new THREE.Group();
      for (let i = 0; i < 3; i++) g.add(this.m("ball", i % 2 ? p.color2 || "--leaf-dark" : p.color || "--leaf", 90 + r() * 60, 70 + r() * 40, 80, (i - 1) * 60, 20, r() * 30));
      return { obj: g };
    },
    /** Rolling hill or sand dune (big squashed rock). */
    hill: (p, r) => ({ obj: this.m("ball", p.color || "--leaf", (p.w || 900) * (0.8 + r() * 0.4), p.h || 300, 500, 0, 0, 0, { detail: 1 }) }),
    rock: (p, r) => ({ obj: this.m("ball", p.color || "--steel-dark", 80 + r() * 40, 60 + r() * 30, 80, 0, 20, 0, { detail: 0, shadow: true }) }),
    /** Desert fort wall with crenellations. */
    fort: (p) => {
      const g = new THREE.Group();
      const w = p.w || 1400, c = p.color || "--clay";
      g.add(this.m("box", c, w, 260, 80, 0, 130, 0));
      for (let i = 0; i < w / 60; i++) g.add(this.m("box", c, 34, 40, 80, -w / 2 + 30 + i * 60, 280, 0));
      for (const sx of [-1, 0, 1]) {
        g.add(this.m("cyl", c, 150, 380, 150, sx * w * 0.4, 190, 20, { detail: 8 }));
        g.add(this.m("cone", p.color2 || "--clay-dark", 180, 110, 180, sx * w * 0.4, 435, 20, { detail: 8 }));
      }
      g.add(this.m("box", "--ink", 110, 150, 10, 0, 75, 42));
      g.add(this.m("dome", "--ink", 110, 60, 10, 0, 150, 42, { detail: 8 }));
      return { obj: g };
    },
    lantern: (p, r) => {
      const g = new THREE.Group();
      g.add(this.m("box", "--ink", 2, 300, 2, 0, 160, 0));
      const l = this.m("cyl", p.color || "--saffron", 34, 46, 34, 0, 0, 0, { emissive: 0.7, detail: 6 });
      g.add(l);
      g.add(this.m("cone", "--ink", 40, 16, 40, 0, 30, 0, { detail: 6 }));
      const ph = r() * 6;
      return { obj: g, upd: (t) => { g.rotation.z = Math.sin(t * 1.1 + ph) * 0.05; } };
    },
    /** Tall standing mirror panel (Dolly's hall). */
    mirror: (p) => {
      const g = new THREE.Group();
      const w = p.w || 180, h = p.h || 420;
      g.add(this.m("box", p.color || "--gold", w + 30, h + 30, 20, 0, h / 2 + 20, 0, { emissive: 0.08 }));
      g.add(this.m("box", p.color2 || "--sky", w, h, 22, 0, h / 2 + 20, 2, { emissive: 0.25 }));
      g.add(this.m("box", "--white", 8, h * 0.5, 24, -w * 0.28, h / 2 + 60, 3, { emissive: 0.15, rz: 0.2 }));
      g.add(this.m("ball", p.color || "--gold", 50, 50, 30, 0, h + 50, 0, { emissive: 0.1 }));
      return { obj: g };
    },
    /** Billboard poster: colored stripes on a frame. */
    poster: (p, r) => {
      const g = new THREE.Group();
      const w = p.w || 300, h = p.h || 400, cols = [p.color || "--rani", p.color2 || "--marigold", "--teal", "--saffron"];
      g.add(this.m("box", "--ink", w + 20, h + 20, 14, 0, h / 2, 0));
      for (let i = 0; i < 4; i++) g.add(this.m("box", cols[(i + Math.floor(r() * 4)) % 4], w, h / 4, 16, 0, h / 8 + (i * h) / 4, 2, { emissive: 0.1 }));
      g.add(this.m("coin", "--gold", w * 0.42, w * 0.42, w * 0.42, 0, h * 0.6, 14, { emissive: 0.3, detail: 10 }));
      return { obj: g };
    },
    /** Crypto chart: red/green candle bars. */
    chart: (p, r) => {
      const g = new THREE.Group();
      const n = p.n > 1 ? p.n : 12, w = p.w || 1400;
      let v = 200;
      for (let i = 0; i < n; i++) {
        const up = r() < 0.55, d = 40 + r() * 140;
        const y0 = v, y1 = up ? v + d : v - d;
        v = Math.max(80, Math.min(700, y1));
        const col = up ? "--candle-green" : "--candle-red";
        const x = -w / 2 + (i + 0.5) * (w / n);
        g.add(this.m("box", col, (w / n) * 0.55, Math.abs(y1 - y0) + 10, 30, x, (y0 + y1) / 2, 0, { emissive: 0.45 }));
        g.add(this.m("box", col, 6, Math.abs(y1 - y0) + 80, 6, x, (y0 + y1) / 2, 0, { emissive: 0.45 }));
      }
      return { obj: g };
    },
    /** Cloud: a cluster of white icospheres. */
    cloud: (p, r) => {
      const g = new THREE.Group();
      const n = 3 + Math.floor(r() * 3), s = p.s * (0.7 + r() * 0.6);
      for (let i = 0; i < n; i++) g.add(this.m("ball", p.color || "--white", (90 + r() * 80) * s, (70 + r() * 50) * s, 80 * s, (i - n / 2) * 60 * s, r() * 30 * s, r() * 30, { emissive: 0.4, receive: false }));
      const ph = r() * 6;
      return { obj: g, upd: (t) => { g.position.y += Math.sin(t * 0.4 + ph) * 0.05; } };
    },
    /** Mela stall: counter, poles, striped awning, hanging goods. */
    stall: (p, r) => {
      const g = new THREE.Group();
      const c1 = p.color || ["--rani", "--teal", "--saffron", "--peacock"][Math.floor(r() * 4)], c2 = p.color2 || "--white";
      g.add(this.m("box", "--wood", 240, 90, 90, 0, 45, 0, { shadow: true }));
      g.add(this.m("box", c1, 250, 12, 100, 0, 94, 0));
      for (const sx of [-1, 1]) g.add(this.m("cyl", "--wood-dark", 10, 230, 10, sx * 115, 115, 40, { detail: 5 }));
      for (let i = 0; i < 6; i++) g.add(this.m("box", i % 2 ? c1 : c2, 44, 10, 140, -110 + i * 44, 238, 20, { rx: -0.35, shadow: true }));
      for (let i = 0; i < 4; i++) g.add(this.m("ball", ["--marigold", "--vermilion", "--leaf", "--rani"][i], 22, 22, 22, -75 + i * 50, 120 + r() * 30, 30, { emissive: 0.1 }));
      return { obj: g };
    },
    /** Ferris wheel, slowly turning. */
    ferris: (p) => {
      const g = new THREE.Group();
      const R = 260 * p.s;
      const wheel = new THREE.Group();
      wheel.add(this.m("torus", p.color || "--rani", R * 2, R * 2, 40, 0, 0, 0, { taper: 0.04, detail: 20 }));
      const cabins: THREE.Object3D[] = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        wheel.add(this.m("box", "--steel", R, 6, 6, Math.cos(a) * R / 2, Math.sin(a) * R / 2, 0, { rz: a }));
        const cab = this.m("box", ["--marigold", "--teal", "--saffron", "--peacock"][i % 4], 50, 44, 44, Math.cos(a) * R, Math.sin(a) * R - 26, 20, { emissive: 0.1 });
        wheel.add(cab); cabins.push(cab);
      }
      wheel.position.y = R + 60;
      g.add(wheel);
      for (const sx of [-1, 1]) g.add(this.m("box", "--steel-dark", 16, R + 80, 16, sx * R * 0.4, (R + 60) / 2, -30, { rz: sx * 0.35 }));
      return { obj: g, upd: (t) => { wheel.rotation.z = t * 0.15; for (const c of cabins) c.rotation.z = -wheel.rotation.z; } };
    },
    /** Striped circus tent. */
    tent: (p, r) => {
      const g = new THREE.Group();
      const s = p.s * 160, c1 = p.color || ["--vermilion", "--peacock", "--rani"][Math.floor(r() * 3)], c2 = p.color2 || "--white";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        g.add(this.m("box", i % 2 ? c1 : c2, s * 0.8, s * 1.1, 6, Math.cos(a) * s * 0.92, s * 0.55, Math.sin(a) * s * 0.92, { ry: -a + Math.PI / 2, shadow: true }));
      }
      g.add(this.m("cone", c1, s * 2.4, s * 1.1, s * 2.4, 0, s * 1.6, 0, { detail: 8, shadow: true }));
      g.add(this.m("cone", "--marigold", 20, 60, 4, 10, s * 2.3, 0, { detail: 3, rz: -Math.PI / 2, emissive: 0.2 }));
      return { obj: g };
    },
    pillar: (p) => {
      const g = new THREE.Group();
      const h = p.h || 600;
      g.add(this.m("box", p.color2 || "--gold-dark", 110, 40, 110, 0, 20, 0));
      g.add(this.m("cyl", p.color || "--paper", 70, h, 70, 0, h / 2, 0, { detail: 8, shadow: true }));
      g.add(this.m("box", p.color2 || "--gold-dark", 110, 40, 110, 0, h, 0));
      return { obj: g };
    },
  };

  kindNames() { return Object.keys(this.kinds); }

  /** One standalone set piece (the island reuses the stage vocabulary for its tents, stalls and trees). */
  piece(kind: string, o: Partial<StageProp> = {}, seed = 1): { obj: THREE.Object3D; upd?: (t: number) => void } | null {
    const fn = this.kinds[kind];
    if (!fn) return null;
    const p: StageProp = { kind, x: 0, y: 0, z: 0, s: 1, rot: 0, color: "", color2: "", every: 0, everyY: 0, n: 1, from: 0, to: 0, w: 0, h: 0, ...o };
    return fn(p, rng(seed), 0);
  }

  build(st: StageDef) {
    this.clear();
    st.props.forEach((p, idx) => {
      const fn = this.kinds[p.kind];
      if (!fn) return;
      const copies: THREE.Object3D[] = [], upds: (Upd | undefined)[] = [];
      const reps = p.every > 0 || p.everyY > 0 ? Math.max(1, Math.ceil((p.every > 0 ? 4200 : 1) / Math.max(1, p.every || 1)) * (p.everyY > 0 ? Math.ceil(2600 / p.everyY) : 1)) : 1;
      for (let i = 0; i < reps; i++) {
        const b = fn(p, rng(idx * 977 + i * 131 + 7), i);
        b.obj.position.set(p.x, p.y, p.z);
        if (p.kind !== "spot") b.obj.rotation.y = (p.rot * Math.PI) / 180;
        if (p.kind !== "sun" && p.kind !== "cloud" && p.s !== 1) b.obj.scale.setScalar(p.s);
        this.group.add(b.obj);
        copies.push(b.obj); upds.push(b.upd);
      }
      this.placed.push({ p, copies, upds });
    });
  }

  /** Wrap repeating props around the camera; run little animations. */
  update(camX: number, camY: number, t: number, halfW = 650) {
    for (const pl of this.placed) {
      const p = pl.p;
      // curtains hug the screen edges whatever the aspect ratio, so they frame the stage without covering it
      if (p.kind === "curtain") { const w = p.w || 420; pl.copies[0].position.x = camX + Math.sign(p.x || 1) * (halfW + w / 2 - 70); }
      if (p.every > 0 || p.everyY > 0) {
        const ex = p.every || 1e9, ey = p.everyY || 1e9;
        const nx = p.every > 0 ? Math.ceil(4200 / ex) : 1, ny = p.everyY > 0 ? Math.ceil(2600 / ey) : 1;
        // farther props move less on screen per camera unit, but wrapping in world space is exact either way
        const spanX = nx * ex, spanY = ny * ey;
        for (let i = 0; i < pl.copies.length; i++) {
          const ix = i % nx, iy = Math.floor(i / nx);
          const o = pl.copies[i];
          if (p.every > 0) {
            const base = p.x + ix * ex;
            const lo = camX - spanX / 2;
            let x = base + Math.ceil((lo - base) / spanX) * spanX;
            if (p.to > p.from && (x < p.from || x > p.to)) { o.visible = false; continue; }
            o.position.x = x;
          }
          if (p.everyY > 0) {
            const base = p.y + iy * ey;
            const lo = camY - spanY / 2;
            o.position.y = base + Math.ceil((lo - base) / spanY) * spanY;
          }
          o.visible = true;
        }
      }
      for (const u of pl.upds) u?.(t);
    }
    for (const u of this.upds) u(t);
  }

  clear() {
    for (const c of this.group.children.slice()) this.group.remove(c);
    this.placed = []; this.upds = [];
  }

  get count() { return this.placed.length; }
}
