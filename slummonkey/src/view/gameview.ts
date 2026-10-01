// Renders a rules World as a clean low-poly 3D diorama: the game plays on the z=0 plane, the camera looks
// at it slightly from above, sets are built from content/stages.kdl props, characters are flat-shaded
// models from the puppet blocks, bullets/particles/telegraphs are instanced shapes. No post filters.
// Reads world state; never mutates it.
import * as THREE from "three";
import type { Content, StageDef } from "../core/content";
import type { Tokens, RGB } from "../core/tokens";
import type { World } from "../rules/world";
import type { Ent, WorldEvent } from "../rules/types";
import { MaterialBank, Model, ModelFactory, PuppetState } from "./model";
import { Instancer, ShapeKey } from "./instancer";
import { StageBuilder } from "./stage3d";
import { Particles } from "./particles";

interface EntView { m: Model; puppet: string; refl?: Model }
interface Fx { kind: string; x: number; y: number; t: number; dur: number; n: number; id: number; s: string }
interface Look { shape: ShapeKey; color: string; s: number }

/** How each projectile sprite looks as a low-poly shape (color tokens from look/palette.css). */
const LOOKS: Record<string, Look> = {
  "player-coin": { shape: "coin", color: "--cyber", s: 2.1 }, mirchi: { shape: "cone", color: "--chilli", s: 2 }, kabootar: { shape: "bird", color: "--white", s: 2.4 },
  laddoo: { shape: "ball", color: "--marigold", s: 1.6 }, "big-coin": { shape: "coin", color: "--cyber", s: 1.7 }, "mirchi-bomb": { shape: "ball", color: "--chilli", s: 1.6 },
  "big-kabootar": { shape: "bird", color: "--white", s: 2.4 }, "big-laddoo": { shape: "ball", color: "--marigold", s: 1.6 }, "moon-beam": { shape: "ball", color: "--cyber", s: 1.4 },
  "airdrop-crate": { shape: "box", color: "--wood", s: 1.4 }, pellet: { shape: "ball", color: "--saffron", s: 1.5 }, "enemy-coin": { shape: "coin", color: "--gold", s: 1.6 },
  shockwave: { shape: "dome", color: "--marigold", s: 1.6 }, bomb: { shape: "ball", color: "--ink", s: 1.6 }, beam: { shape: "box", color: "--vermilion", s: 1 },
  knife: { shape: "cone", color: "--steel", s: 2.2 }, club: { shape: "box", color: "--teal", s: 1.8 }, card: { shape: "box", color: "--white", s: 1.6 },
  "rabbit-shot": { shape: "ball", color: "--white", s: 1.6 }, pigeon: { shape: "bird", color: "--steel", s: 2.6 }, "water-drop": { shape: "ball", color: "--water", s: 1.6 },
  "candle-red": { shape: "box", color: "--candle-red", s: 1.5 }, "candle-green": { shape: "box", color: "--candle-green", s: 1.5 }, star: { shape: "gem", color: "--marigold", s: 1.8 },
  "prop-shot": { shape: "gem", color: "--steel", s: 1.8 }, cash: { shape: "box", color: "--neon-green", s: 1.6 }, "kite-shot": { shape: "gem", color: "--rani", s: 1.8 },
  marigold: { shape: "gem", color: "--parry", s: 1.8 }, "water-beam": { shape: "box", color: "--water", s: 1 },
};

const SHOT_SHAPES: ShapeKey[] = ["ball", "coin", "cone", "bird", "box", "gem", "dome"];
const PARTICLE_SHAPES: ShapeKey[] = ["ball", "box", "gem", "coin", "tetra"];
const FX_SHAPES: ShapeKey[] = ["ring", "disc", "plane"];

export class GameView {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 16 / 9, 50, 12000);
  mats: MaterialBank;
  puppets: ModelFactory;
  stage: StageBuilder;
  shots: Instancer;
  parts: Instancer;
  fxi: Instancer;
  particles: Particles;
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private skyMat: THREE.ShaderMaterial;
  private views = new Map<number, EntView>();
  private player!: Model;
  private ghosts: { m: Model; t: number; x: number; y: number; facing: number }[] = [];
  private water: THREE.Mesh;
  private sheet: THREE.Mesh;
  private mirrors: THREE.Group[] = [];
  private decals: { x: number; y: number; t: number; s: string; scale: number }[] = [];
  private fx: Fx[] = [];
  private shake = 0;
  private flash = 0;
  private camShakeX = 0; private camShakeY = 0;
  private col: Record<string, THREE.Color> = {};
  t = 0;
  viewW = 1280; viewH = 720;
  stageId = "";
  renderScale = 1;
  sceneCalls = 0;
  private frameTimes: number[] = [];
  private tk: { floorFrac: number; shakeScale: number; shakeDecay: number; hitFlash: number; pitch: number };

  constructor(public canvas: HTMLCanvasElement, public tokens: Tokens, public content: Content, _svgs?: Record<string, string>) {
    THREE.ColorManagement.enabled = false;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tokens.num("--dpr-max", 2)));
    this.renderer.shadowMap.enabled = tokens.num("--shadows", 1) > 0;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.mats = new MaterialBank(tokens);
    this.puppets = new ModelFactory(this.mats, content.puppets);
    this.stage = new StageBuilder(this.mats);
    this.particles = new Particles(tokens);
    this.tk = {
      floorFrac: tokens.num("--floor-frac", 0.27), shakeScale: tokens.num("--shake-scale", 1), shakeDecay: tokens.num("--shake-decay", 10),
      hitFlash: tokens.num("--hit-flash-amount", 0.6), pitch: tokens.num("--camera-pitch", 7),
    };
    this.camera.fov = tokens.num("--camera-fov", 30);

    // sky: a gradient on a huge back-facing sphere that follows the camera
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { uTop: { value: new THREE.Color() }, uBottom: { value: new THREE.Color() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
      fragmentShader: "uniform vec3 uTop; uniform vec3 uBottom; varying vec3 vP; void main(){ float k = smoothstep(-0.1, 0.35, vP.y); gl_FragColor = vec4(mix(uBottom, uTop, k), 1.); }",
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(10000, 16, 12), this.skyMat);
    sky.renderOrder = -1000; sky.frustumCulled = false;
    sky.onBeforeRender = () => sky.position.copy(this.camera.position);
    this.scene.add(sky);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x664433, 1.0);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.6);
    this.sun.castShadow = true;
    const sz = tokens.num("--shadow-map", 1024);
    this.sun.shadow.mapSize.set(sz, sz);
    const sc = this.sun.shadow.camera;
    sc.left = -1200; sc.right = 1200; sc.top = 1000; sc.bottom = -700; sc.near = 10; sc.far = 5000;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 1.5;
    this.sun.shadow.radius = 3;
    this.scene.add(this.hemi, this.sun, this.sun.target, this.stage.group);

    this.shots = new Instancer(SHOT_SHAPES, 700, "glow", 0.55);
    this.parts = new Instancer(PARTICLE_SHAPES, 900, "glow", 0.3);
    this.fxi = new Instancer(FX_SHAPES, 160, "fx");
    this.scene.add(this.shots.group, this.parts.group, this.fxi.group);

    this.water = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: this.mats.color("--water"), transparent: true, opacity: 0.72, flatShading: true, depthWrite: false }));
    this.water.renderOrder = 900; this.water.visible = false;
    this.sheet = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.mats.lit("--velvet", 0.05));
    this.sheet.castShadow = true; this.sheet.visible = false;
    this.scene.add(this.water, this.sheet);
  }

  private c(token: string): THREE.Color { return this.col[token] ??= this.mats.color(token); }

  async load(_stageIds: string[] = []) {
    this.player = this.puppets.make("slummonkey");
    this.scene.add(this.player.root);
    for (let i = 0; i < 3; i++) {
      const m = this.puppets.make("slummonkey", false);
      m.tint(...this.tokens.color("--cyber"), 0.85);
      m.root.visible = false;
      this.scene.add(m.root);
      this.ghosts.push({ m, t: 99, x: 0, y: 0, facing: 1 });
    }
  }

  /** Build the stage set (sky colors, lights, fog, props). */
  async setStage(id: string) {
    if (this.stageId === id) return;
    this.stageId = id;
    const st: StageDef | undefined = this.content.stages[id];
    if (!st) return;
    this.stage.build(st);
    this.skyMat.uniforms.uTop.value.copy(this.c(st.sky[0]));
    this.skyMat.uniforms.uBottom.value.copy(this.c(st.sky[1]));
    this.scene.fog = new THREE.Fog(this.c(st.fog || st.sky[1]), this.tokens.num("--fog-near", 2600), this.tokens.num("--fog-far", 7000));
    this.hemi.color.copy(this.c(st.sky[0])).lerp(new THREE.Color(1, 1, 1), 0.6);
    this.hemi.groundColor.copy(this.c(st.ground)).multiplyScalar(0.7);
    this.hemi.intensity = this.tokens.num("--ambient", 1.2) * st.ambient;
    this.sun.intensity = this.tokens.num("--sun", 1.5) * st.sun;
    this.sun.color.setRGB(1, 0.96, 0.88);
  }

  resize(w: number, h: number) {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.tokens.num("--dpr-max", 2)) * this.renderScale);
    this.renderer.setSize(w, h, false);
    const aspect = w / Math.max(1, h);
    const zoom = this.tokens.num("--camera-zoom", 1);
    this.viewH = Math.max(this.tokens.num("--view-h", 720), 1300 / aspect) / zoom;
    this.viewW = this.viewH * aspect;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  /** World x/y (on the play plane) -> CSS pixel coordinates (for DOM bubbles). */
  private v3 = new THREE.Vector3();
  project(x: number, y: number, w: number, h: number): [number, number] {
    const v = this.v3.set(x, y, 0).project(this.camera);
    return [(v.x * 0.5 + 0.5) * w, (0.5 - v.y * 0.5) * h];
  }

  onEvent(e: WorldEvent) {
    switch (e.type) {
      case "particles": this.particles.emit(e.s ?? "dust", e.x, e.y, e.n ?? 4); break;
      case "shake": this.shake = Math.min(26, this.shake + (e.n ?? 6)); break;
      case "boss-hit": if (Math.random() < 0.35) this.particles.emit("spark", e.x + (Math.random() - 0.5) * 40, e.y + (Math.random() - 0.5) * 60, 1); break;
      case "decal": this.decals.push({ x: e.x, y: e.y, t: 0, s: e.s ?? "powder", scale: e.n ?? 1 }); if (this.decals.length > 80) this.decals.shift(); break;
      case "warn": case "sheet": case "spotlight": case "mirror": case "drumroll": {
        const seg = e.type === "warn" && e.s?.startsWith("seg:");
        this.fx.push({ kind: seg ? "warn-seg" : e.type === "warn" ? "warn-" + (e.s ?? "mark") : e.type + (e.s ? "-" + e.s : ""), x: e.x, y: e.y, t: 0, dur: e.n ?? 1, n: e.n ?? 1, id: e.id ?? 0, s: e.s ?? "" });
        break;
      }
      case "parry": this.particles.emit("parry", e.x, e.y, 8); this.flash = 0.25; break;
      case "player-hurt": this.particles.emit("ink", e.x, e.y, 10); this.particles.emit("spark", e.x, e.y, 6); break;
      case "blink": {
        const g = this.ghosts.find((q) => q.t > 0.3) ?? this.ghosts[0];
        g.t = 0; g.x = e.x; g.y = e.y; g.facing = e.n ?? 1;
        this.particles.emit("cyber", e.x, e.y, 8);
        break;
      }
      case "jump": if (e.s === "2") this.particles.emit("smoke", e.x, e.y, 3); break;
      case "land": if ((e.n ?? 0) > 0.4) this.particles.emit("dust", e.x, e.y, 5); break;
      case "pickup": this.particles.emit("sparkle", e.x, e.y, 5); break;
      case "knockout": this.flash = 0.5; this.shake = 22; this.particles.emit("confetti", e.x, e.y, 80); this.particles.emit("coin", e.x, e.y, 30); break;
      case "ex": this.particles.emit("sparkle", e.x, e.y, 6); break;
      case "super": this.flash = 0.35; this.shake = 12; break;
      case "topple": this.particles.emit("smoke", e.x, e.y + 100, 20); break;
      case "bg": void this.setStage(e.s ?? this.stageId); break;
    }
  }

  private state(e: { pose: string; poseT: number; facing: number }, o: Partial<PuppetState>): PuppetState {
    return { pose: e.pose, poseT: e.poseT, t: this.t, facing: e.facing, aim: 0, speed: 0, vy: 0, wobble: 0, scale: 1, squash: 0, alpha: 1, flash: 0, parry: 0, flipY: false, rot: 0, grounded: true, ...o };
  }

  render(w: World, alpha: number, realDt: number) {
    this.t += realDt;
    const t = this.t;
    this.adaptResolution(realDt);

    // ── camera: perspective, looking at the play plane from a little above ──
    this.shake = Math.max(0, this.shake - this.tk.shakeDecay * realDt * Math.max(1, this.shake * 0.3));
    if (Math.floor(t * 30) !== Math.floor((t - realDt) * 30)) {
      this.camShakeX = (Math.random() - 0.5) * this.shake * this.tk.shakeScale;
      this.camShakeY = (Math.random() - 0.5) * this.shake * this.tk.shakeScale;
    }
    const camX = w.camX, camY = w.camY;
    const fov = (this.camera.fov * Math.PI) / 180;
    const dist = this.viewH / 2 / Math.tan(fov / 2);
    const pitch = (this.tk.pitch * Math.PI) / 180;
    const tx = camX + this.camShakeX, ty = camY + this.viewH * (0.5 - this.tk.floorFrac) + this.camShakeY;
    this.camera.position.set(tx, ty + Math.sin(pitch) * dist, Math.cos(pitch) * dist);
    this.camera.lookAt(tx, ty, 0);
    this.camera.updateMatrixWorld();
    this.sun.position.set(camX - 500, camY + 1600, 1300);
    this.sun.target.position.set(camX, camY, 0);

    this.stage.update(camX, camY, t, this.viewW / 2);

    // ── water ──
    if (w.water > w.floor - 40) {
      this.water.visible = true;
      const top = w.water + 12, bottom = camY - 600;
      this.water.scale.set(this.viewW * 2 + 400, top - bottom, 900);
      this.water.position.set(camX, (top + bottom) / 2 + Math.sin(t * 2) * 3, -150);
      if (Math.random() < 0.2) this.particles.emit("bubble", camX + (Math.random() - 0.5) * this.viewW, top - 40, 1);
    } else this.water.visible = false;

    // ── entities ──
    const seen = new Set<number>();
    for (const e of w.all) {
      if (e.kind === "director") continue;
      seen.add(e.id);
      let v = this.views.get(e.id);
      if (!v || v.puppet !== e.puppet) {
        if (v) this.drop(v);
        const m = this.puppets.make(e.puppet);
        this.scene.add(m.root);
        v = { m, puppet: e.puppet };
        this.views.set(e.id, v);
      }
      const x = e.px + (e.x - e.px) * alpha, y = e.py + (e.y - e.py) * alpha;
      const fade = !e.alive ? Math.max(0, 1 - e.deadT * 2) : e.kind === "part" && e.hp <= 0 ? Math.max(0.35, 1 - e.deadT) : 1;
      v.m.root.visible = !e.hidden && fade > 0;
      v.m.root.position.set(x, y, 0);
      if (e.kind === "platform") v.m.root.scale.set(e.w / 100, 1, 1); // platform models are authored 100 wide
      // invisible bosses keep a faint shimmer so you can still read them
      const a = e.alpha * fade;
      const st = this.state(e, {
        t: t + e.id * 0.37, speed: (e.x - e.px) / w.dt, vy: (e.y - e.py) / w.dt, wobble: e.wobble, scale: e.scale, squash: e.squash,
        alpha: e.kind === "boss" && a < 0.2 && !e.hidden ? 0.16 + Math.sin(t * 6) * 0.04 : a,
        flash: e.hitFlash > 0 ? this.tk.hitFlash : 0, parry: e.parryable && !(e.vars.parryCd > 0) ? 1 : 0, flipY: e.flipY, rot: e.rot,
      });
      v.m.update(st, realDt);
      // mirror maze: only the real one has a reflection in the mirror behind her
      if (e.reflect) {
        if (!v.refl) { v.refl = this.puppets.make(e.puppet, false); v.refl.tint(...this.tokens.color("--sky"), 0.4); this.scene.add(v.refl.root); }
        v.refl.root.visible = !e.hidden;
        v.refl.root.position.set(x, y, -300);
        v.refl.update({ ...st, facing: -st.facing, alpha: 0.6 * st.alpha }, realDt);
      } else if (v.refl) v.refl.root.visible = false;
    }
    for (const [id, v] of this.views) if (!seen.has(id)) { this.drop(v); this.views.delete(id); }

    // mirror frames behind dolly + decoys
    const mirrorFor = w.all.filter((e) => (e.kind === "decoy" || e.reflect) && e.alive && !e.hidden);
    while (this.mirrors.length < mirrorFor.length) { const g = this.mirrorFrame(); this.mirrors.push(g); this.scene.add(g); }
    this.mirrors.forEach((g, i) => { const e = mirrorFor[i]; g.visible = !!e; if (e) g.position.set(e.x, w.floor, -150); });

    // ── player ──
    const p = w.player;
    const want = p.flying ? "rickshaw" : "slummonkey";
    if (this.player.def.id !== want && this.content.puppets[want]) { this.scene.remove(this.player.root); this.player.dispose(); this.player = this.puppets.make(want); this.scene.add(this.player.root); }
    const px = p.px + (p.x - p.px) * alpha, py = p.py + (p.y - p.py) * alpha;
    this.player.root.position.set(px, py, 0);
    this.player.root.visible = true;
    const flicker = p.iframes > 0 && Math.floor(t * 12) % 2 === 0;
    this.player.update(this.state(p, {
      aim: Math.atan2(p.aimY, Math.abs(p.aimX) < 1e-3 ? 1e-3 : p.aimX * p.facing), speed: p.vx, vy: p.vy,
      squash: p.grounded ? 0 : Math.max(-0.12, Math.min(0.12, p.vy / 6000)), alpha: 1, flash: p.hurtT > 0.25 ? 1 : flicker ? 0.45 : 0,
      rot: p.pose === "spin" ? -t * 16 * p.facing : 0, grounded: p.grounded,
    }), realDt);
    if (p.invulnT > 0) this.player.tint(...this.tokens.color("--sky"), 0.3 + Math.sin(t * 20) * 0.2); else this.player.tint(0, 0, 0, 0);
    for (const g of this.ghosts) {
      g.t += realDt;
      g.m.root.visible = g.t < 0.22;
      if (!g.m.root.visible) continue;
      g.m.root.position.set(g.x, g.y, -10);
      g.m.update(this.state({ pose: "dash", poseT: 0, facing: g.facing }, { alpha: 0.55 * (1 - g.t / 0.22) }), 0);
    }

    // ── floor marks + telegraphs: flat red rings/bars, the sheet, spotlights ──
    const fb = this.fxi;
    fb.begin();
    const red = this.c("--vermilion"), white = this.c("--white"), ink = this.c("--ink");
    if (!p.flying) {
      // landing marker: a soft ring under the player that shrinks with height (platforming readability)
      const gy = w.groundUnder(px, py + 1, py - 2000);
      if (py - gy > 30) { const k = Math.max(0.35, 1 - (py - gy) / 700); fb.add("ring", px, gy + 1.5, 0, 70 * k, 1, 40 * k, 0, 0, 0, white); }
    }
    for (let i = this.decals.length - 1; i >= 0; i--) {
      const d = this.decals[i];
      d.t += realDt;
      if (d.t > 5) { this.decals.splice(i, 1); continue; }
      const s = (60 * d.scale + 20) * Math.min(1, (5 - d.t) / 1.5);
      fb.add("disc", d.x, d.y + 2, 0, s, 1, s * 0.6, 0, 0, 0, white);
    }
    let sheetOn = false;
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.t += realDt;
      if (f.t > f.dur + 0.2) { this.fx.splice(i, 1); continue; }
      const blink = Math.floor(f.t * 10) % 2 ? 1 : 0.6;
      const grow = Math.min(1, f.t / 0.15);
      if (f.kind === "warn-mark") { fb.add("ring", f.x, f.y + 3, 0, 170 * grow, 1, 120 * grow, 0, 0, 0, red); fb.add("disc", f.x, f.y + 2, 0, 130 * grow * blink, 1, 90 * grow * blink, 0, 0, 0, red); }
      else if (f.kind === "warn-line-x") fb.add("plane", f.x, w.camY + 280, 0, 50, 600, 1, 0, 0, 0, blink > 0.8 ? red : white);
      else if (f.kind === "warn-line-y") fb.add("plane", w.camX, f.y, 0, this.viewW, 40, 1, 0, 0, 0, blink > 0.8 ? red : white);
      else if (f.kind === "warn-beam") { const a = (f.n * Math.PI) / 180; fb.add("plane", f.x + Math.cos(a) * 900, f.y + Math.sin(a) * 900, 0, 1800, 12, 1, 0, 0, a, red); }
      else if (f.kind === "warn-seg") {
        const [x2, y2] = f.s.slice(4).split(",").map(Number);
        const len = Math.hypot(x2 - f.x, y2 - f.y);
        fb.add("plane", (f.x + x2) / 2, (f.y + y2) / 2, 0, len, 14, 1, 0, 0, Math.atan2(y2 - f.y, x2 - f.x), red);
      }
      else if (f.kind === "warn-graph") fb.add("plane", w.camX, w.floor + 300, -2, this.viewW, 520, 1, 0, 0, 0, this.c("--candle-green"));
      else if (f.kind === "spotlight") { const e = w.ent(f.id); fb.add("disc", e?.x ?? f.x, w.floor + 2, 0, 300, 1, 160, 0, 0, 0, this.c("--marigold")); }
      else if (f.kind === "sheet-drop" || f.kind === "sheet-lift") {
        const k = Math.min(1, f.t / 0.5), drop = f.kind === "sheet-drop";
        const yb = drop ? w.floor + 600 - k * 600 : w.floor + k * 700;
        sheetOn = drop || k < 1;
        this.sheet.position.set(f.x, yb + 180, 30);
        this.sheet.scale.set(380, 360, 30);
        this.sheet.rotation.z = Math.sin(f.t * 12) * 0.04;
      }
      else if (f.kind === "drumroll" && Math.floor(t * 12) % 2 === 0) this.particles.emit("sparkle", f.x + Math.sin(t * 9) * 80, f.y + 200 + Math.cos(t * 7) * 60, 1);
      else if ((f.kind === "mirror-flash" || f.kind === "mirror-spawn") && f.t < realDt * 1.5) this.particles.emit("glass", f.x, f.y + 120, 8);
    }
    this.sheet.visible = sheetOn;
    void ink;
    fb.end();

    // ── bullets: instanced glowing shapes ──
    const sb = this.shots;
    sb.begin();
    const pink = this.c("--parry");
    for (const q of w.projs.live) {
      const x = q.px + (q.x - q.px) * alpha, y = q.py + (q.y - q.py) * alpha;
      const look = LOOKS[q.parryable ? "marigold" : q.def.sprite] ?? LOOKS.pellet;
      const col = q.parryable ? pink : this.c(look.color);
      if (q.len > 0) {
        const wob = 1 + Math.sin(t * 50) * 0.08;
        sb.add("box", x + Math.cos(q.angle) * q.len / 2, y + Math.sin(q.angle) * q.len / 2, 0, q.len, q.r * 2 * wob, q.r * 2 * wob, 0, 0, q.angle, col);
        continue;
      }
      const sz = q.r * look.s * (q.def.scale ?? 1);
      const dir = q.vx || q.vy ? Math.atan2(q.vy, q.vx) : 0;
      if (q.parryable) { const pu = 1 + Math.sin(t * 12) * 0.12; sb.add("gem", x, y, 0, sz * pu, sz * pu, sz * pu, t * 2, t * 3, 0, col); continue; }
      switch (look.shape) {
        case "coin": sb.add("coin", x, y, 0, sz, sz, sz, 0, q.rot * 2 + t * 6, 0, col); break;
        case "cone": case "bird": sb.add(look.shape, x, y, 0, sz, sz * 0.5, sz * 0.6, 0, 0, dir, col); break;
        case "box": sb.add("box", x, y, 0, sz, sz * 0.7, sz * 0.3, t * 3, 0, q.rot, col); break;
        case "dome": sb.add("dome", x, y - q.r, 0, sz * 1.4, sz, sz, 0, 0, 0, col); break;
        default: sb.add(look.shape, x, y, 0, sz, sz, sz, q.rot, q.rot * 0.7, 0, col);
      }
    }
    sb.end();

    // ── particles ──
    this.particles.step(realDt);
    this.parts.begin();
    this.particles.draw(this.parts, this.tokens.color("--parry") as RGB);
    this.parts.end();

    // hit/parry flash: a brief exposure kick on the lights instead of a post filter
    this.flash = Math.max(0, this.flash - realDt * 3);
    const st = this.content.stages[this.stageId];
    this.hemi.intensity = this.tokens.num("--ambient", 1.2) * (st?.ambient ?? 1) * (1 + this.flash);
    this.renderer.render(this.scene, this.camera);
    this.sceneCalls = this.renderer.info.render.calls;
  }

  private mirrorFrame() {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(250, 400, 16), this.mats.shared("--gold", 0.08));
    frame.position.y = 200;
    const glass = new THREE.Mesh(new THREE.BoxGeometry(220, 370, 4), new THREE.MeshLambertMaterial({ color: this.c("--sky"), transparent: true, opacity: 0.35, depthWrite: false, flatShading: true }));
    glass.position.set(0, 200, 10);
    glass.renderOrder = 800;
    g.add(frame, glass);
    return g;
  }

  private drop(v: EntView) {
    this.scene.remove(v.m.root); v.m.dispose();
    if (v.refl) { this.scene.remove(v.refl.root); v.refl.dispose(); }
  }

  /** Render any scene with the same renderer (the island uses this). */
  composite(scene: THREE.Scene, camera: THREE.Camera, realDt: number) {
    this.t += realDt;
    this.adaptResolution(realDt);
    this.renderer.render(scene, camera);
  }

  /** Dynamic resolution: drop render scale if frames run long, recover when smooth. */
  private adaptResolution(dt: number) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    const prev = this.renderScale;
    if (avg > 1 / 50 && this.renderScale > 0.6) this.renderScale = Math.max(0.6, this.renderScale - 0.1);
    else if (avg < 1 / 58 && this.renderScale < 1) this.renderScale = Math.min(1, this.renderScale + 0.05);
    if (prev !== this.renderScale) { const s = new THREE.Vector2(); this.renderer.getSize(s); this.resize(s.x, s.y); }
  }

  // ── introspection for stories/tests: what is actually on screen ──
  get decalCount() { return this.decals.length; }
  get particleCount() { return this.particles.count; }
  get bulletCount() { return this.shots.total; }
  get playerPuppetId() { return this.player.def.id; }
  playerPartVisible(id: string) { const n = this.player.part(id); return !!n && n.pivot.visible && this.player.root.visible; }
  ghostVisible() { return this.ghosts.some((g) => g.m.root.visible); }
  entityVisible(id: number) { const v = this.views.get(id); return !!v && v.m.root.visible; }
  entityPuppet(id: number) { return this.views.get(id)?.puppet ?? ""; }
  reflectionVisible(id: number) { const v = this.views.get(id); return !!v?.refl && v.refl.root.visible; }
  get stageLayerCount() { return this.stage.count; }

  clearWorld() {
    for (const [, v] of this.views) this.drop(v);
    this.views.clear();
    this.decals = []; this.fx = [];
    this.sheet.visible = false;
  }

  dispose() { this.renderer.dispose(); }
}

export type { Ent };
