// Cutout puppets: SVG parts on pivots, animated procedurally "on twos" (12fps) while the
// root moves smoothly at 60fps. Squash & stretch on the root, smear frames on fast moves.
import * as THREE from "three";
import type { PuppetDef, PartDef } from "../core/content";
import type { Tokens } from "../core/tokens";
import { heldTime } from "../core/clock";
import { characterMaterial } from "./shaders";
import type { TextureBank, Raster } from "./textures";

export interface PuppetState {
  pose: string; poseT: number; t: number; facing: number; aim: number; speed: number; vy: number;
  wobble: number; scale: number; squash: number; alpha: number; flash: number; parry: number; flipY: boolean; rot: number;
  grounded: boolean;
}

type AnimOut = { r: number; x: number; y: number; sx: number; sy: number; hide?: boolean };
type AnimFn = (s: PuppetState, tq: number, part: PartDef) => Partial<AnimOut>;

const TAU = Math.PI * 2;
const has = (p: PartDef, tag: string) => p.tags.includes(tag);
const phase = (p: PartDef) => (has(p, "b") ? Math.PI : 0);
const moving = (s: PuppetState) => s.pose === "run" || s.pose === "charge" || s.pose === "walk";

/** View-side animation vocabulary. Each anim is one small function of pose + quantized time. */
export const ANIMS: Record<string, AnimFn> = {
  breathe: (s, t) => ({ sy: 1 + Math.sin(t * TAU * 0.9) * 0.035 + (s.pose === "stomp-up" ? 0.08 : 0), sx: 1 - Math.sin(t * TAU * 0.9) * 0.02 }),
  bob: (s, t) => ({ y: moving(s) ? Math.abs(Math.sin(t * TAU * 2.6)) * 7 : Math.sin(t * TAU * 1.1) * 2.5 }),
  leg: (s, t, p) => {
    const ph = phase(p);
    if (s.pose === "run" || s.pose === "walk") return { r: Math.sin(t * TAU * 2.6 + ph) * 0.75 };
    if (s.pose === "charge") return { r: Math.sin(t * TAU * 4 + ph) * 0.6 };
    if (s.pose === "jump" || s.pose === "fall") return { r: ph ? 0.5 : -0.7 };
    if (s.pose === "spin" || s.pose === "glide") return { r: (ph ? 0.3 : -0.3) + Math.sin(t * TAU * 3 + ph) * 0.2 };
    if (s.pose === "duck") return { r: ph ? 1.0 : -1.0, y: -8 };
    if (s.pose === "stomp-up") return { r: ph ? 0 : -0.5 };
    return { r: Math.sin(t * TAU * 0.5 + ph) * 0.04 };
  },
  arm: (s, t, p) => {
    const ph = phase(p);
    if (s.pose === "run") return { r: -Math.sin(t * TAU * 2.6 + ph) * 0.8 };
    if (s.pose === "parry") return { r: -2.2 + Math.min(1, s.poseT * 8) * 1.6 };
    if (s.pose === "hurt") return { r: -2.4 };
    if (s.pose === "jump" || s.pose === "spin") return { r: -1.8 };
    if (s.pose === "glide") return { r: -2.6 + Math.sin(t * TAU * 2) * 0.15 };
    if (s.pose === "drumroll") return { r: -0.6 + Math.sin(t * TAU * 8) * 0.5 };
    if (s.pose === "juggle") return { r: -1.6 + Math.sin(t * TAU * 3 + ph) * 0.6 };
    if (s.pose === "windup" || s.pose === "beam-charge") return { r: 0.9 };
    if (s.pose === "spray" || s.pose === "beam") return { r: -1.2 };
    return { r: Math.sin(t * TAU * 0.8 + ph) * 0.08 };
  },
  aim: (s) => {
    if (s.pose === "parry") return { r: -2 + Math.min(1, s.poseT * 8) * 1.4 };
    // gun arm points along the 8-way aim (art drawn pointing right)
    return { r: s.aim };
  },
  tail: (s, t) => {
    if (s.pose === "glide") return { hide: true };
    if (s.pose === "spin") return { r: Math.sin(t * TAU * 4) * 0.9 };
    if (moving(s)) return { r: Math.sin(t * TAU * 2.6) * 0.35 };
    return { r: Math.sin(t * TAU * 0.6) * 0.25 };
  },
  rotor: (s) => ({ hide: s.pose !== "glide", sx: Math.cos(s.t * 47) * 0.85 + Math.sign(Math.cos(s.t * 47)) * 0.15 }),
  head: (s, t) => {
    if (s.pose === "hurt") return { r: Math.sin(t * TAU * 6) * 0.2 };
    if (s.pose === "dizzy") return { r: Math.sin(t * TAU * 1.5) * 0.25 };
    if (s.pose === "drumroll") return { r: Math.sin(t * TAU * 6) * 0.06, y: 4 };
    if (s.pose === "stomp-up") return { r: -0.25, y: 6 };
    if (s.pose === "stomp") return { r: 0.12, y: -8 };
    if (s.pose === "spray") return { r: -0.12 };
    return { r: Math.sin(t * TAU * 0.5) * 0.04, y: moving(s) ? Math.abs(Math.sin(t * TAU * 2.6)) * 3 : 0 };
  },
  blink: (s, t) => ({ sy: (Math.floor(t * 12) % 41 === 0 || s.pose === "hurt") ? 0.12 : 1 }),
  flap: (s, t, p) => ({ r: (has(p, "b") ? -1 : 1) * (Math.sin(t * TAU * (moving(s) ? 2.6 : 0.7)) * 0.12 + (s.pose === "charge" ? -0.3 : 0)) }),
  trunk: (s, t) => {
    if (s.pose === "spray") return { r: -0.95 + Math.sin(t * TAU * 6) * 0.08 };
    if (s.pose === "charge") return { r: 0.6 };
    if (s.pose === "drumroll") return { r: -1.4 + Math.sin(t * TAU * 5) * 0.3 };
    if (s.pose === "stomp-up") return { r: -1.2 };
    return { r: Math.sin(t * TAU * 0.6) * 0.18 };
  },
  jaw: (s) => ({ r: ["spray", "stomp", "beam", "charge", "hurt", "ko", "drumroll"].includes(s.pose) ? 0.35 : 0 }),
  spin: (s) => ({ r: -s.t * 14 }),
  prop: (s) => ({ sx: Math.cos(s.t * 47) * 0.85 + Math.sign(Math.cos(s.t * 47)) * 0.15 }),
  bank: (s) => ({ r: Math.max(-0.25, Math.min(0.25, s.vy / 2400)) }),
  "spin-slow": (s) => ({ r: -s.t * 2 }),
  float: (s, t, p) => ({ y: Math.sin(t * TAU * 0.8 + phase(p)) * 8 }),
  flutter: (s, t, p) => ({ r: (has(p, "b") ? -1 : 1) * Math.sin(t * TAU * 6) * 0.5 }),
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

interface PartNode { def: PartDef; pivot: THREE.Object3D; mesh: THREE.Mesh; mat: THREE.ShaderMaterial }

export class PuppetFactory {
  rasters = new Map<string, Raster>();
  constructor(public tokens: Tokens, public bank: TextureBank, public puppets: Record<string, PuppetDef>) {}

  async preload(ids?: string[]) {
    const list = ids ? ids.map((i) => this.puppets[i]).filter(Boolean) : Object.values(this.puppets);
    await Promise.all(list.flatMap((p) => p.parts.map(async (part) => {
      const key = `${part.svg}@${part.size * p.scale}`;
      if (!this.rasters.has(key)) this.rasters.set(key, await this.bank.get(part.svg, part.size * p.scale));
    })));
  }

  make(id: string): PuppetView {
    return new PuppetView(this, this.puppets[id] ?? this.puppets["missing"] ?? { id, scale: 1, parts: [] });
  }
}

export class PuppetView {
  root = new THREE.Group(); // positioned at entity feet
  body = new THREE.Group(); // squash/stretch, facing, rotation, flip — all around the puppet's center
  inner = new THREE.Group(); // offsets parts so body's origin is the visual center
  private cy = 0;
  parts: PartNode[] = [];
  smear: THREE.Group;
  width = 0; height = 0;

  constructor(f: PuppetFactory, public def: PuppetDef) {
    this.root.add(this.body);
    this.body.add(this.inner);
    const byId = new Map<string, PartNode>();
    const sorted = def.parts.slice();
    let minX = 0, maxX = 0, maxY = 0, minY = 0;
    for (const part of sorted) {
      const r = f.rasters.get(`${part.svg}@${part.size * def.scale}`);
      const h = part.size * def.scale, w = h * (r?.aspect ?? 1);
      const geo = new THREE.PlaneGeometry(w, h);
      geo.translate((0.5 - part.px) * w, (part.py - 0.5) * h, 0);
      const mat = characterMaterial(f.tokens, r?.tex ?? new THREE.Texture());
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = part.z;
      const pivot = new THREE.Object3D();
      pivot.position.set(part.x * def.scale, part.y * def.scale, 0);
      pivot.add(mesh);
      const node = { def: part, pivot, mesh, mat };
      byId.set(part.id, node);
      this.parts.push(node);
      if (!part.parent) {
        minX = Math.min(minX, part.x * def.scale - part.px * w); maxX = Math.max(maxX, part.x * def.scale + (1 - part.px) * w);
        maxY = Math.max(maxY, part.y * def.scale + part.py * h); minY = Math.min(minY, part.y * def.scale - (1 - part.py) * h);
      }
    }
    for (const n of this.parts) {
      const parent = n.def.parent ? byId.get(n.def.parent) : null;
      (parent ? parent.pivot : this.inner).add(n.pivot);
    }
    this.width = maxX - minX; this.height = maxY - Math.min(0, minY);
    this.cy = (maxY + Math.max(minY, 0)) / 2;
    this.inner.position.y = -this.cy;
    // smear: speed lines behind the body on fast moves
    this.smear = new THREE.Group();
    const lineMat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(...f.tokens.color("--ink")), transparent: true, opacity: f.tokens.num("--smear-alpha", 0.35), depthWrite: false });
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), lineMat);
      m.position.set(-0.5, (i + 1) / 4, 0);
      m.scale.set(1, 0.035, 1);
      this.smear.add(m);
    }
    this.smear.visible = false;
    this.root.add(this.smear);
  }

  /** Base z-order offset so several puppets sort correctly. */
  setOrder(base: number) { for (const n of this.parts) n.mesh.renderOrder = base + n.def.z; }

  update(s: PuppetState, tokens: { fps: number; squashK: number; smearSpeed: number }) {
    const tq = heldTime(s.t, tokens.fps); // body animation on twos
    const facing = s.facing < 0 ? -1 : 1;
    const sq = s.squash * tokens.squashK;
    const flip = s.flipY ? -1 : 1;
    // smear frame: stretch along motion for one held frame
    const fast = Math.abs(s.speed) > tokens.smearSpeed;
    const smearK = fast ? 1.22 : 1;
    this.body.scale.set(facing * s.scale * (1 - sq * 0.5) * smearK, flip * s.scale * (1 + sq) / Math.sqrt(smearK), 1);
    this.body.position.y = this.cy * s.scale;
    this.body.rotation.z = s.rot;
    this.smear.visible = fast;
    if (fast) {
      this.smear.scale.set(Math.sign(s.speed) * this.width * 0.9 * s.scale, this.height * s.scale, 1);
      this.smear.position.x = -Math.sign(s.speed) * this.width * 0.2;
    }
    for (const n of this.parts) {
      const fn = ANIMS[n.def.anim];
      const o = fn ? fn(s, tq + n.def.z * 0.013, n.def) : {};
      n.pivot.rotation.z = (o.r ?? 0) * (n.def.anim === "aim" ? 1 : 1);
      n.pivot.position.x = (n.def.x + (o.x ?? 0)) * this.def.scale;
      n.pivot.position.y = (n.def.y + (o.y ?? 0)) * this.def.scale;
      n.pivot.scale.set(o.sx ?? 1, o.sy ?? 1, 1);
      n.pivot.visible = !o.hide;
      const u = n.mat.uniforms;
      u.uAlpha.value = s.alpha;
      u.uFlash.value = s.flash;
      u.uParry.value = s.parry;
      u.uTime.value = s.t;
    }
  }

  tint(r: number, g: number, b: number, a: number) {
    for (const n of this.parts) n.mat.uniforms.uTint.value.set(r, g, b, a);
  }

  dispose() {
    for (const n of this.parts) { n.mesh.geometry.dispose(); n.mat.dispose(); }
  }
}
