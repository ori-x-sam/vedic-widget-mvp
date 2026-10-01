// Low-poly models: every puppet is a stack of simple flat-shaded shapes (box, ball, cyl, cone…) on pivots,
// described part by part in content/*.kdl. Parts animate procedurally around the side-view axis (z),
// the whole model turns smoothly to face left/right, and flash/parry/tint are emissive on its own materials.
import * as THREE from "three";
import type { PuppetDef, PartDef } from "../core/content";
import type { Tokens } from "../core/tokens";

export interface PuppetState {
  pose: string; poseT: number; t: number; facing: number; aim: number; speed: number; vy: number;
  wobble: number; scale: number; squash: number; alpha: number; flash: number; parry: number; flipY: boolean; rot: number;
  grounded: boolean;
}

type AnimOut = { r: number; x: number; y: number; sx: number; sy: number; ry: number; rx: number; hide?: boolean };
type AnimFn = (s: PuppetState, t: number, part: PartDef) => Partial<AnimOut>;

const TAU = Math.PI * 2;
const has = (p: PartDef, tag: string) => p.tags.includes(tag);
const phase = (p: PartDef) => (has(p, "b") ? Math.PI : 0);
const moving = (s: PuppetState) => s.pose === "run" || s.pose === "charge" || s.pose === "walk";

/** View-side animation vocabulary: one small function of pose + time per anim name (anim="…" on a part). */
export const ANIMS: Record<string, AnimFn> = {
  breathe: (s, t) => ({ sy: 1 + Math.sin(t * TAU * 0.9) * 0.03 + (s.pose === "stomp-up" ? 0.08 : 0), sx: 1 - Math.sin(t * TAU * 0.9) * 0.015 }),
  bob: (s, t) => ({ y: moving(s) ? Math.abs(Math.sin(t * TAU * 2.6)) * 7 : Math.sin(t * TAU * 1.1) * 2.5 }),
  leg: (s, t, p) => {
    const ph = phase(p);
    if (s.pose === "run" || s.pose === "walk") return { r: Math.sin(t * TAU * 2.6 + ph) * 0.8 };
    if (s.pose === "charge") return { r: Math.sin(t * TAU * 4 + ph) * 0.6 };
    if (s.pose === "dash") return { r: ph ? 0.9 : -1.2 };
    if (s.pose === "jump" || s.pose === "fall") return { r: ph ? 0.5 : -0.7 };
    if (s.pose === "spin" || s.pose === "glide") return { r: (ph ? 0.3 : -0.3) + Math.sin(t * TAU * 3 + ph) * 0.2 };
    if (s.pose === "duck") return { r: ph ? 1.0 : -1.0, y: -8 };
    if (s.pose === "stomp-up") return { r: ph ? 0 : -0.5 };
    return { r: Math.sin(t * TAU * 0.5 + ph) * 0.04 };
  },
  arm: (s, t, p) => {
    const ph = phase(p);
    if (s.pose === "run") return { r: -Math.sin(t * TAU * 2.6 + ph) * 0.8 };
    if (s.pose === "dash") return { r: 1.3 };
    if (s.pose === "parry") return { r: -2.6 + Math.min(1, s.poseT * 8) * 1.6 };
    if (s.pose === "hurt") return { r: -2.4 };
    if (s.pose === "jump" || s.pose === "spin") return { r: -2.2 };
    if (s.pose === "glide") return { r: -2.8 + Math.sin(t * TAU * 2) * 0.15 };
    if (s.pose === "drumroll") return { r: -0.6 + Math.sin(t * TAU * 8) * 0.5 };
    if (s.pose === "juggle") return { r: -1.6 + Math.sin(t * TAU * 3 + ph) * 0.6 };
    if (s.pose === "windup" || s.pose === "beam-charge") return { r: 0.9 };
    if (s.pose === "spray" || s.pose === "beam") return { r: -1.2 };
    return { r: Math.sin(t * TAU * 0.8 + ph) * 0.08 };
  },
  aim: (s) => {
    if (s.pose === "parry") return { r: -2 + Math.min(1, s.poseT * 8) * 1.4 };
    if (s.pose === "dash") return { r: 0.9 };
    return { r: s.aim };
  },
  tail: (s, t) => {
    if (s.pose === "glide") return { hide: true };
    if (s.pose === "spin") return { r: Math.sin(t * TAU * 4) * 0.9 };
    if (moving(s) || s.pose === "dash") return { r: Math.sin(t * TAU * 2.6) * 0.35 - 0.4 };
    return { r: Math.sin(t * TAU * 0.6) * 0.25 };
  },
  rotor: (s) => ({ hide: s.pose !== "glide", ry: s.t * 40 }),
  head: (s, t) => {
    if (s.pose === "hurt") return { r: Math.sin(t * TAU * 6) * 0.2 };
    if (s.pose === "dizzy") return { r: Math.sin(t * TAU * 1.5) * 0.25 };
    if (s.pose === "drumroll") return { r: Math.sin(t * TAU * 6) * 0.06, y: 4 };
    if (s.pose === "stomp-up") return { r: 0.25, y: 6 };
    if (s.pose === "stomp") return { r: -0.12, y: -8 };
    if (s.pose === "spray") return { r: 0.12 };
    return { r: Math.sin(t * TAU * 0.5) * 0.04, y: moving(s) ? Math.abs(Math.sin(t * TAU * 2.6)) * 3 : 0 };
  },
  blink: (s, t) => ({ sy: (Math.floor(t * 12) % 41 === 0 || s.pose === "hurt") ? 0.12 : 1 }),
  flap: (s, t, p) => ({ ry: (has(p, "b") ? -1 : 1) * (Math.sin(t * TAU * (moving(s) ? 2.6 : 0.7)) * 0.25 + (s.pose === "charge" ? 0.4 : 0)) }),
  trunk: (s, t) => {
    if (s.pose === "spray") return { r: 1.0 + Math.sin(t * TAU * 6) * 0.08 };
    if (s.pose === "charge") return { r: -0.5 };
    if (s.pose === "drumroll") return { r: 1.4 + Math.sin(t * TAU * 5) * 0.3 };
    if (s.pose === "stomp-up") return { r: 1.2 };
    return { r: Math.sin(t * TAU * 0.6) * 0.18 };
  },
  jaw: (s) => ({ r: ["spray", "stomp", "beam", "charge", "hurt", "ko", "drumroll"].includes(s.pose) ? -0.35 : 0 }),
  spin: (s) => ({ r: -s.t * 14 }),
  prop: (s) => ({ rx: s.t * 40 }),
  bank: (s) => ({ r: Math.max(-0.25, Math.min(0.25, s.vy / 2400)) }),
  "spin-slow": (s) => ({ ry: s.t * 1.2 }),
  "spin-y": (s) => ({ ry: s.t * 6 }),
  float: (s, t, p) => ({ y: Math.sin(t * TAU * 0.8 + phase(p)) * 8 }),
  flutter: (s, t, p) => ({ rx: (has(p, "b") ? -1 : 1) * Math.sin(t * TAU * 6) * 0.6 }),
  sway: (s, t, p) => ({ r: Math.sin(t * TAU * 0.4 + phase(p)) * 0.06 }),
  wobble: (s, t, p) => {
    if (s.pose === "ko" || s.pose === "topple") { const k = Math.min(1, s.poseT * 1.5); return { r: (has(p, "b") ? -1.3 : 1.1) * k, x: (has(p, "b") ? -60 : 50) * k, y: -40 * k * k }; }
    return { r: Math.sin(s.t * 9) * s.wobble * 0.18 + Math.sin(t * TAU * 0.5) * 0.03 };
  },
  hat: (s, t) => ({ y: s.pose === "juggle" || s.pose === "summon" ? Math.abs(Math.sin(t * TAU * 2)) * 12 : 0, r: Math.sin(t * TAU * 0.5) * 0.04 }),
  ponytail: (s, t) => ({ r: Math.sin(t * TAU * (moving(s) ? 3 : 1)) * 0.3 }),
  kick: (s, t, p) => ({ r: s.pose === "charge" || s.pose === "kick" ? Math.sin(t * TAU * 3 + phase(p)) * 1.1 : Math.sin(t * TAU * 1.2 + phase(p)) * 0.15 }),
  pulse: (s, t) => ({ sx: 1 + Math.sin(t * TAU * 2) * 0.05, sy: 1 + Math.sin(t * TAU * 2) * 0.05 }),
};

// ── shared unit geometries ──
const GEO = new Map<string, THREE.BufferGeometry>();
export function unitGeo(shape: string, detail = 0, taper = 1): THREE.BufferGeometry {
  const key = `${shape}|${detail}|${taper}`;
  let g = GEO.get(key);
  if (g) return g;
  switch (shape) {
    case "ball": g = new THREE.IcosahedronGeometry(0.5, detail || 1); break;
    case "gem": g = new THREE.OctahedronGeometry(0.5, 0); break;
    case "tetra": g = new THREE.TetrahedronGeometry(0.5, 0); break;
    case "sphere": g = new THREE.SphereGeometry(0.5, detail || 8, Math.max(3, Math.round((detail || 8) * 0.7))); break;
    case "cyl": g = new THREE.CylinderGeometry(0.5 * taper, 0.5, 1, detail || 8); break;
    case "cone": g = new THREE.ConeGeometry(0.5, 1, detail || 8); break;
    case "coin": g = new THREE.CylinderGeometry(0.5, 0.5, 0.2, detail || 12); g.rotateX(Math.PI / 2); break;
    case "torus": g = new THREE.TorusGeometry(0.5 - 0.5 * (taper === 1 ? 0.18 : taper), 0.5 * (taper === 1 ? 0.18 : taper), 5, detail || 14); break;
    case "dome": g = new THREE.SphereGeometry(0.5, detail || 8, 4, 0, TAU, 0, Math.PI / 2); break;
    case "wedge": { // triangular prism, ramp rising toward +x
      const s = new THREE.Shape([new THREE.Vector2(-0.5, -0.5), new THREE.Vector2(0.5, -0.5), new THREE.Vector2(0.5, 0.5)]);
      g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
      g.translate(0, 0, -0.5);
      break;
    }
    case "plane": g = new THREE.PlaneGeometry(1, 1); break;
    default: g = new THREE.BoxGeometry(1, 1, 1);
  }
  g.computeVertexNormals();
  GEO.set(key, g);
  return g;
}

export class MaterialBank {
  private cache = new Map<string, THREE.MeshLambertMaterial>();
  constructor(public tokens: Tokens) {}
  color(token: string): THREE.Color {
    if (!token) return new THREE.Color(1, 1, 1);
    if (token.startsWith("#")) return new THREE.Color(token);
    return new THREE.Color().setRGB(...this.tokens.color(token));
  }
  /** A fresh lit flat-shaded material (models own theirs so they can flash independently). */
  lit(token: string, emissive = 0): THREE.MeshLambertMaterial {
    const c = this.color(token);
    const m = new THREE.MeshLambertMaterial({ color: c, flatShading: true });
    if (emissive > 0) m.emissive.copy(c).multiplyScalar(emissive);
    m.userData.baseEmissive = m.emissive.clone();
    return m;
  }
  /** A shared material for static scenery. */
  shared(token: string, emissive = 0): THREE.MeshLambertMaterial {
    const key = `${token}|${emissive}`;
    let m = this.cache.get(key);
    if (!m) { m = this.lit(token, emissive); this.cache.set(key, m); }
    return m;
  }
}

interface PartNode { def: PartDef; pivot: THREE.Object3D; mesh: THREE.Mesh | null }

const D2R = Math.PI / 180;

export class Model {
  root = new THREE.Group();   // at entity feet
  body = new THREE.Group();   // facing yaw, squash, lean, spin — around the model's center
  inner = new THREE.Group();  // offsets parts so body's origin is the visual center
  parts: PartNode[] = [];
  mats: THREE.MeshLambertMaterial[] = [];
  width = 0; height = 0;
  private cy = 0;
  private yaw: number | null = null;
  /** Free-facing yaw (radians) for the top-down island; null = side-view left/right facing. */
  faceYaw: number | null = null;
  private lastAlpha = 1;
  private parryCol: THREE.Color;
  private flashCol = new THREE.Color(1, 1, 1);
  private tintCol = new THREE.Color(0, 0, 0);
  private tintA = 0;

  constructor(bank: MaterialBank, public def: PuppetDef, shadows = true) {
    this.root.add(this.body);
    this.body.add(this.inner);
    this.parryCol = bank.color("--parry");
    const byId = new Map<string, PartNode>();
    const matFor = new Map<string, THREE.MeshLambertMaterial>();
    const sc = def.scale;
    for (const part of def.parts) {
      const pivot = new THREE.Object3D();
      pivot.position.set(part.x * sc, part.y * sc, part.pz * sc);
      let mesh: THREE.Mesh | null = null;
      if (part.shape && part.shape !== "none") {
        const key = `${part.color}|${part.emissive}`;
        let mat = matFor.get(key);
        if (!mat) { mat = bank.lit(part.color, part.emissive); matFor.set(key, mat); this.mats.push(mat); }
        mesh = new THREE.Mesh(unitGeo(part.shape, part.detail, part.taper), mat);
        const [w, h, d] = [part.dim[0], part.dim[1] ?? part.dim[0], part.dim[2] ?? part.dim[0]];
        mesh.scale.set(w * sc, h * sc, d * sc);
        mesh.position.set((part.off[0] ?? 0) * sc, (part.off[1] ?? 0) * sc, (part.off[2] ?? 0) * sc);
        mesh.rotation.set((part.rot[0] ?? 0) * D2R, (part.rot[1] ?? 0) * D2R, (part.rot[2] ?? 0) * D2R);
        mesh.castShadow = shadows && part.emissive < 0.9;
        pivot.add(mesh);
      }
      const node = { def: part, pivot, mesh };
      byId.set(part.id, node);
      this.parts.push(node);
    }
    for (const n of this.parts) {
      const parent = n.def.parent ? byId.get(n.def.parent) : null;
      (parent ? parent.pivot : this.inner).add(n.pivot);
    }
    const box = new THREE.Box3().setFromObject(this.inner);
    if (box.isEmpty()) box.set(new THREE.Vector3(-20, 0, -20), new THREE.Vector3(20, 40, 20));
    this.width = box.max.x - box.min.x; this.height = box.max.y - Math.min(0, box.min.y);
    this.cy = (box.max.y + Math.max(0, box.min.y)) / 2;
    this.inner.position.y = -this.cy;
    this.body.position.y = this.cy;
  }

  part(id: string) { return this.parts.find((p) => p.def.id === id); }

  update(s: PuppetState, dt: number) {
    const facing = s.facing < 0 ? -1 : 1;
    const sq = s.squash;
    // turn through the camera (3/4 view both ways) instead of snapping
    let target = facing > 0 ? -0.32 : -Math.PI + 0.32;
    if (this.faceYaw !== null && this.yaw !== null) target = this.yaw + Math.atan2(Math.sin(this.faceYaw - this.yaw), Math.cos(this.faceYaw - this.yaw));
    if (this.yaw === null || dt <= 0) this.yaw = this.faceYaw ?? target;
    else this.yaw += (target - this.yaw) * Math.min(1, dt * 16);
    const flip = s.flipY ? Math.PI : 0;
    this.body.scale.set(s.scale * (1 - sq * 0.5), s.scale * (1 + sq), s.scale * (1 - sq * 0.5));
    this.body.position.y = this.cy * s.scale;
    const LEAN: Record<string, number> = { windup: -0.1, "stomp-up": -0.12, "beam-charge": -0.08, charge: 0.14, spray: 0.06, stomp: 0.05, drumroll: -0.05, juggle: -0.04, run: 0.1, dash: 0.3, kick: 0.1, hurt: -0.15 };
    const lean = (LEAN[s.pose] ?? 0) * (s.pose === "run" || s.pose === "dash" ? 1 : Math.min(1, s.poseT * 8));
    this.body.rotation.set(flip, this.yaw, s.rot * facing - lean);
    const t = s.t;
    const sc = this.def.scale;
    for (const n of this.parts) {
      const fn = ANIMS[n.def.anim];
      const o = fn ? fn(s, t + n.def.z * 0.013, n.def) : {};
      n.pivot.rotation.set(o.rx ?? 0, o.ry ?? 0, o.r ?? 0);
      n.pivot.position.set((n.def.x + (o.x ?? 0)) * sc, (n.def.y + (o.y ?? 0)) * sc, n.def.pz * sc);
      n.pivot.scale.set(o.sx ?? 1, o.sy ?? 1, 1);
      n.pivot.visible = !o.hide;
    }
    // materials: flash white on hit, pink while parryable, tints (afterimages, invulnerable)
    const alpha = Math.max(0, Math.min(1, s.alpha));
    const pulse = s.parry > 0 ? 0.35 + Math.sin(s.t * 10) * 0.15 : 0;
    for (const m of this.mats) {
      const base = m.userData.baseEmissive as THREE.Color;
      m.emissive.copy(base);
      if (this.tintA > 0) m.emissive.lerp(this.tintCol, this.tintA);
      if (pulse > 0) m.emissive.lerp(this.parryCol, pulse);
      if (s.flash > 0) m.emissive.lerp(this.flashCol, Math.min(1, s.flash));
      if (alpha !== this.lastAlpha) {
        const tr = alpha < 0.999;
        if (m.transparent !== tr) { m.transparent = tr; m.depthWrite = !tr; m.needsUpdate = true; }
        m.opacity = alpha;
      }
    }
    this.lastAlpha = alpha;
    this.root.visible = this.root.visible && alpha > 0.01;
  }

  /** Emissive tint (0 = none). */
  tint(r: number, g: number, b: number, a: number) { this.tintCol.setRGB(r, g, b); this.tintA = a; }

  setShadows(on: boolean) { for (const n of this.parts) if (n.mesh) n.mesh.castShadow = on; }

  dispose() { for (const m of this.mats) m.dispose(); }
}

export class ModelFactory {
  constructor(public bank: MaterialBank, public puppets: Record<string, PuppetDef>) {}
  make(id: string, shadows = true): Model {
    return new Model(this.bank, this.puppets[id] ?? this.puppets["missing"] ?? { id, scale: 1, parts: [] }, shadows);
  }
}
