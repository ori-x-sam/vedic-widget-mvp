// Renders a rules World with three.js: painted parallax stage, cutout puppets, instanced bullets,
// particles, telegraph FX, water, and the VHS/film post stack. Reads world state; never mutates it.
import * as THREE from "three";
import type { Content, StageDef } from "../core/content";
import type { Tokens } from "../core/tokens";
import type { World } from "../rules/world";
import type { Ent, WorldEvent } from "../rules/types";
import { TextureBank, Atlas } from "./textures";
import { PuppetFactory, PuppetView, PuppetState } from "./puppet";
import { SpriteBatch } from "./batch";
import { Particles } from "./particles";
import { paperMaterial, paperBakeMaterial, postMaterial, skyMaterial, spriteBatchMaterial, waterMaterial } from "./shaders";

export const SPRITES = [
  // projectiles
  "pellet", "coin", "enemy-coin", "player-coin", "mirchi", "kabootar", "laddoo", "big-coin", "mirchi-bomb", "big-kabootar", "big-laddoo",
  "airdrop-crate", "shockwave", "bomb", "knife", "club", "card", "rabbit-shot", "pigeon", "water-drop", "candle-red", "candle-green",
  "marigold", "star", "beam", "moon-beam", "prop-shot", "cash", "kite-shot", "water-beam",
  // fx
  "puff", "confetti", "confetti-b", "sparkle", "spark", "coin-fx", "shard", "petal", "pop-ring", "bubble", "footprint", "shadow",
  "warn-mark", "warn-line", "spotlight", "token", "sheet", "rotor-disc", "glow", "cone", "muzzle", "impact",
].map((s) => `sprites/${s}`).concat(["parts/dolly/mirror-frame"]);

interface EntView { pv: PuppetView; puppet: string; refl?: PuppetView; lastX: number }
interface Fx { kind: string; x: number; y: number; t: number; dur: number; n: number; id: number; s: string }

export class GameView {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-640, 640, 360, -360, -100, 100);
  rt: THREE.WebGLRenderTarget;
  postScene = new THREE.Scene();
  postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  post: THREE.ShaderMaterial;
  bank: TextureBank;
  puppets: PuppetFactory;
  atlas!: Atlas;
  bullets!: SpriteBatch;
  under!: SpriteBatch; // decals, shadows, warn marks (below actors)
  over!: SpriteBatch;  // particles (above actors)
  lights!: SpriteBatch; // additive stage lighting + glows (between the painted stage and the actors)
  particles: Particles;
  private views = new Map<number, EntView>();
  private player!: PuppetView;
  private ghosts: { pv: PuppetView; t: number; x: number; y: number; facing: number }[] = [];
  private stageGroup = new THREE.Group();
  private fgGroup = new THREE.Group();
  private layers: { mesh: THREE.Mesh; mat: THREE.ShaderMaterial; depth: number; y: number; tile: string; tiley: boolean; w: number; h: number; x: number }[] = [];
  private sky: THREE.Mesh | null = null;
  private water: THREE.Mesh;
  private decals: { x: number; y: number; t: number; s: string; scale: number }[] = [];
  private fx: Fx[] = [];
  private shake = 0;
  private lastImpact = 0;
  private tracking = 0;
  private flash = 0;
  private camShakeX = 0; private camShakeY = 0;
  t = 0;
  viewW = 1280; viewH = 720;
  stageId = "";
  renderScale = 1;
  private frameTimes: number[] = [];
  private tk: { fps: number; squashK: number; smearSpeed: number; floorFrac: number; shadowA: number; shakeScale: number; shakeDecay: number; playerGlow: number; hitFlash: number; tracking: number; trackingDecay: number };

  constructor(public canvas: HTMLCanvasElement, public tokens: Tokens, public content: Content, svgs: Record<string, string>) {
    THREE.ColorManagement.enabled = false;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tokens.num("--dpr-max", 2)));
    this.rt = new THREE.WebGLRenderTarget(4, 4, { samples: 0, depthBuffer: false });
    this.post = postMaterial(tokens, this.rt.texture);
    this.postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.post));
    this.bank = new TextureBank(tokens, svgs);
    this.puppets = new PuppetFactory(tokens, this.bank, content.puppets);
    this.particles = new Particles(tokens);
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), waterMaterial(tokens));
    this.water.renderOrder = 900;
    this.water.visible = false;
    this.scene.add(this.stageGroup, this.fgGroup, this.water);
    this.tk = {
      fps: tokens.num("--anim-fps", 12), squashK: tokens.num("--squash-k", 1), smearSpeed: tokens.num("--smear-speed", 900),
      floorFrac: tokens.num("--floor-frac", 0.27), shadowA: tokens.num("--shadow-alpha", 0.28), shakeScale: tokens.num("--shake-scale", 1),
      shakeDecay: tokens.num("--shake-decay", 10), playerGlow: tokens.num("--player-glow", 0.28), hitFlash: tokens.num("--hit-flash-amount", 0.35), tracking: tokens.num("--tracking", 0.6), trackingDecay: tokens.num("--tracking-decay", 3),
    };
  }

  async load(stageIds: string[] = []) {
    this.atlas = await this.bank.atlas(SPRITES, 128);
    this.bullets = new SpriteBatch(this.atlas, spriteBatchMaterial(this.tokens, this.atlas.tex), 1200, 600);
    this.under = new SpriteBatch(this.atlas, spriteBatchMaterial(this.tokens, this.atlas.tex), 600, 50);
    this.over = new SpriteBatch(this.atlas, spriteBatchMaterial(this.tokens, this.atlas.tex), 1000, 700);
    this.lights = new SpriteBatch(this.atlas, spriteBatchMaterial(this.tokens, this.atlas.tex, true), 300, 30);
    this.scene.add(this.lights.mesh, this.under.mesh, this.bullets.mesh, this.over.mesh);
    await this.puppets.preload();
    for (const s of stageIds) await this.preloadStage(s);
    this.player = this.puppets.make("slummonkey");
    this.player.setOrder(400);
    this.scene.add(this.player.root);
    for (let i = 0; i < 3; i++) {
      const pv = this.puppets.make("slummonkey");
      pv.setOrder(390);
      pv.tint(...this.tokens.color("--cyber"), 1);
      pv.root.visible = false;
      this.scene.add(pv.root);
      this.ghosts.push({ pv, t: 99, x: 0, y: 0, facing: 1 });
    }
  }

  private async preloadStage(id: string) {
    const st = this.content.stages[id];
    if (!st) return;
    await Promise.all(st.layers.filter((l) => !l.art.startsWith("sky:")).map((l) => this.bank.get(l.art, this.layerHeight(l.art, l.scale), 1)));
  }

  private layerHeight(art: string, scale: number) {
    const svg = this.bank.svgs[this.bank.norm(art)] ?? "";
    const m = /viewBox\s*=\s*"[\d.\s-]+\s([\d.]+)"/.exec(svg);
    return (m ? parseFloat(m[1]) : 720) * scale;
  }

  /** Build the painted stage (sky + parallax layers + foreground). */
  private stageToken = 0;
  async setStage(id: string) {
    if (this.stageId === id) return;
    this.stageId = id;
    const token = ++this.stageToken;
    const st: StageDef | undefined = this.content.stages[id];
    if (!st) return;
    // rasterize first, then swap in one go (a later setStage wins the race)
    await this.preloadStage(id);
    if (token !== this.stageToken) return;
    for (const l of this.layers) { this.stageGroup.remove(l.mesh); this.fgGroup.remove(l.mesh); l.mat.dispose(); }
    this.layers = [];
    if (this.sky) { this.scene.remove(this.sky); this.sky = null; }
    let order = 0;
    for (const l of st.layers.slice().sort((a, b) => b.depth - a.depth)) {
      if (l.art.startsWith("sky:")) {
        const name = l.art.slice(4);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMaterial(this.tokens, `--sky-${name}-top`, `--sky-${name}-bottom`));
        m.frustumCulled = false; m.renderOrder = -1000;
        this.sky = m; this.scene.add(m);
        continue;
      }
      const h = this.layerHeight(l.art, l.scale);
      const r = await this.bank.get(l.art, h, 1);
      const w = h * r.aspect;
      const baked = this.bake(r.tex, r.w, r.h, l.tile, l.tiley);
      const far = Math.max(0, l.depth - 1);
      const haze = Math.min(0.6, far * this.tokens.num("--haze", 0.2));
      const desat = Math.min(0.6, far * this.tokens.num("--bg-desat", 0.4));
      const dim = l.dim >= 0 ? l.dim : l.depth < 1 ? this.tokens.num("--fg-dim", 0.7) : 1;
      const blur = l.blur >= 0 ? l.blur : l.depth > 1 ? Math.min(2.5, far * this.tokens.num("--bg-blur", 1.6)) : l.depth < 1 ? this.tokens.num("--fg-blur", 1.2) : 0;
      const mat = paperMaterial(this.tokens, baked, haze, desat, dim, blur);
      if (l.tint) mat.uniforms.uTint.value.setRGB(...this.tokens.color(l.tint));
      const meshW = l.tile ? 3200 : w;
      const meshH = l.tiley ? 2400 : h;
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(meshW, meshH), mat);
      mesh.frustumCulled = false;
      mat.uniforms.uRepeat.value.set(l.tile ? meshW / w : 1, l.tiley ? meshH / h : 1);
      mesh.renderOrder = l.depth < 1 ? 800 + order : -500 + order;
      order++;
      (l.depth < 1 ? this.fgGroup : this.stageGroup).add(mesh);
      this.layers.push({ mesh, mat, depth: l.depth, y: l.y, tile: l.tile ? "x" : "", tiley: l.tiley, w, h, x: l.x });
    }
  }

  private baked = new Map<THREE.Texture, THREE.Texture>();
  /** Paint a layer once (watercolour/gouache pass in texture space) and keep the result with mipmaps. */
  private bake(src: THREE.Texture, w: number, h: number, tileX: boolean, tileY: boolean): THREE.Texture {
    const hit = this.baked.get(src);
    if (hit) return hit;
    const rt = new THREE.WebGLRenderTarget(w, h, {
      depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter,
      // wrap must be set at construction for render targets (it's baked into the GL texture's sampler state)
      wrapS: tileX ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping, wrapT: tileY ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping,
    });
    if (tileX) src.wrapS = THREE.RepeatWrapping;
    if (tileY) src.wrapT = THREE.RepeatWrapping;
    src.needsUpdate = true;
    // noise in the bake uses texture-space coords; integer periods keep tiles seamless at the wrap
    const mat = paperBakeMaterial(this.tokens, src, w, h, new THREE.Vector2(tileX ? 1 : 0, tileY ? 1 : 0));
    const sc = new THREE.Scene();
    sc.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    const prev = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(rt);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.clear();
    this.renderer.render(sc, this.postCam);
    this.renderer.setRenderTarget(prev);
    mat.dispose();
    this.baked.set(src, rt.texture);
    return rt.texture;
  }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    const dpr = this.renderer.getPixelRatio() * this.renderScale;
    this.rt.setSize(Math.max(1, Math.floor(w * dpr)), Math.max(1, Math.floor(h * dpr)));
    this.post.uniforms.uRes.value.set(w * dpr, h * dpr);
    const aspect = w / Math.max(1, h);
    const zoom = this.tokens.num("--camera-zoom", 1);
    this.viewH = Math.max(this.tokens.num("--view-h", 720), 1300 / aspect) / zoom;
    this.viewW = this.viewH * aspect;
  }

  /** World x/y -> CSS pixel coordinates (for DOM bubbles). */
  project(x: number, y: number, w: number, h: number): [number, number] {
    const c = this.camera;
    return [((x - (c.position.x + c.left)) / (c.right - c.left)) * w, (1 - (y - (c.position.y + c.bottom)) / (c.top - c.bottom)) * h];
  }

  onEvent(e: WorldEvent) {
    switch (e.type) {
      case "particles": this.particles.emit(e.s ?? "dust", e.x, e.y, e.n ?? 4); break;
      case "shake": this.shake = Math.min(30, this.shake + (e.n ?? 6)); break;
      case "boss-hit":
        if (this.t - this.lastImpact > 0.11) { this.lastImpact = this.t; this.fx.push({ kind: "impact", x: e.x + (Math.random() - 0.5) * 40, y: e.y + (Math.random() - 0.5) * 60, t: 0, dur: 0.12, n: 1, id: 0, s: "" }); }
        break;
      case "tracking": this.tracking = Math.max(this.tracking, e.n ?? 0.4); break;
      case "decal": this.decals.push({ x: e.x, y: e.y, t: 0, s: e.s ?? "powder", scale: e.n ?? 1 }); if (this.decals.length > 80) this.decals.shift(); break;
      case "warn": case "sheet": case "spotlight": case "mirror": case "drumroll": {
        const seg = e.type === "warn" && e.s?.startsWith("seg:");
        this.fx.push({ kind: seg ? "warn-seg" : e.type === "warn" ? "warn-" + (e.s ?? "mark") : e.type + (e.s ? "-" + e.s : ""), x: e.x, y: e.y, t: 0, dur: e.n ?? 1, n: e.n ?? 1, id: e.id ?? 0, s: e.s ?? "" });
        break;
      }
      case "parry": this.particles.emit("parry", e.x, e.y, 8); this.flash = 0.25; break;
      case "player-hurt": this.particles.emit("ink", e.x, e.y, 10); this.particles.emit("spark", e.x, e.y, 6); break;
      case "blink": {
        const g = this.ghosts.find((q) => q.t > 0.4) ?? this.ghosts[0];
        g.t = 0; g.x = e.x; g.y = e.y; g.facing = e.n ?? 1;
        const [tx, ty] = (e.s ?? "0,0").split(",").map(Number);
        this.particles.emit("cyber", e.x, e.y, 10);
        this.particles.emit("cyber", tx, ty, 8);
        this.tracking = Math.max(this.tracking, 0.12);
        break;
      }
      case "jump": if (e.s === "2") this.particles.emit("smoke", e.x, e.y, 3); break;
      case "land": if ((e.n ?? 0) > 0.4) this.particles.emit("dust", e.x, e.y, 5); break;
      case "pickup": this.particles.emit("sparkle", e.x, e.y, 5); break;
      case "knockout": this.flash = 0.6; this.shake = 25; this.tracking = 1; this.particles.emit("confetti", e.x, e.y, 80); this.particles.emit("coin", e.x, e.y, 30); break;
      case "ex": this.particles.emit("sparkle", e.x, e.y, 6); this.fx.push({ kind: "muzzle", x: e.x, y: e.y, t: 0, dur: 0.12, n: 2, id: 0, s: "" }); break;
      case "shoot": if (Math.random() < 0.6) this.fx.push({ kind: "muzzle", x: e.x, y: e.y, t: 0, dur: 0.05, n: 1, id: 0, s: "" }); break;
      case "super": this.flash = 0.35; this.shake = 12; break;
      case "topple": this.particles.emit("smoke", e.x, e.y + 100, 20); break;
      case "bg": void this.setStage(e.s ?? this.stageId); break;
    }
  }

  render(w: World, alpha: number, realDt: number) {
    this.t += realDt;
    const t = this.t;
    this.adaptResolution(realDt);
    // ── camera ──
    this.shake = Math.max(0, this.shake - this.tk.shakeDecay * realDt * Math.max(1, this.shake * 0.3));
    if (Math.floor(t * 30) !== Math.floor((t - realDt) * 30)) {
      this.camShakeX = (Math.random() - 0.5) * this.shake * this.tk.shakeScale;
      this.camShakeY = (Math.random() - 0.5) * this.shake * this.tk.shakeScale;
    }
    const camX = w.camX, camY = w.camY;
    const c = this.camera;
    c.left = -this.viewW / 2; c.right = this.viewW / 2; c.top = this.viewH / 2; c.bottom = -this.viewH / 2;
    c.position.set(camX + this.camShakeX, camY + this.viewH * (0.5 - this.tk.floorFrac) + this.camShakeY, 10);
    c.updateProjectionMatrix();
    c.updateMatrixWorld();

    // ── stage layers (parallax) ──
    if (this.sky) { const m = this.sky.material as THREE.ShaderMaterial; m.uniforms.uTime.value = t; m.uniforms.uCam.value.set(camX, camY); }
    for (const l of this.layers) {
      const par = 1 - 1 / l.depth;
      l.mat.uniforms.uTime.value = t;
      if (l.tiley) {
        // vertical tiling (sky climbs): the quad follows the camera, the texture scrolls
        l.mesh.position.set(l.tile ? camX : l.x + camX * par, camY + this.viewH * (0.5 - this.tk.floorFrac), 0);
        l.mat.uniforms.uOffset.value.set(l.tile ? ((camX / l.depth) % l.w) / l.w : 0, ((camY / l.depth) % l.h) / l.h);
      } else if (l.tile) {
        l.mesh.position.set(camX, l.y + camY * par + l.h / 2, 0);
        l.mat.uniforms.uOffset.value.set(((camX / l.depth) % l.w) / l.w, 0);
      } else {
        l.mesh.position.set(l.x + camX * par, l.y + camY * par + l.h / 2, 0);
      }
    }

    // ── water ──
    if (w.water > w.floor - 40) {
      this.water.visible = true;
      const top = w.water + 12;
      const bottom = camY - 400;
      this.water.scale.set(this.viewW + 200, top - bottom, 1);
      this.water.position.set(camX, (top + bottom) / 2, 0);
      (this.water.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
      if (Math.random() < 0.2) this.particles.emit("bubble", camX + (Math.random() - 0.5) * this.viewW, top - 40, 1);
    } else this.water.visible = false;

    // ── entities ──
    const seen = new Set<number>();
    let order = 100;
    for (const e of w.all) {
      if (e.kind === "director") continue;
      seen.add(e.id);
      let v = this.views.get(e.id);
      if (!v || v.puppet !== e.puppet) {
        if (v) { this.scene.remove(v.pv.root); v.pv.dispose(); if (v.refl) { this.scene.remove(v.refl.root); v.refl.dispose(); } }
        const pv = this.puppets.make(e.puppet);
        this.scene.add(pv.root);
        v = { pv, puppet: e.puppet, lastX: e.x };
        this.views.set(e.id, v);
      }
      const base = e.kind === "platform" || e.kind === "pot" ? 60 : e.kind === "boss" ? 200 : e.kind === "part" ? 220 : e.kind === "rider" ? 320 : e.kind === "hazard" ? 150 : 250;
      v.pv.setOrder(base + (order++ % 50) * 2);
      const x = e.px + (e.x - e.px) * alpha, y = e.py + (e.y - e.py) * alpha;
      const fade = !e.alive ? Math.max(0, 1 - e.deadT * 2) : e.kind === "part" && e.hp <= 0 ? Math.max(0.35, 1 - e.deadT) : 1;
      v.pv.root.visible = !e.hidden && fade > 0;
      v.pv.root.position.set(x, y + (e.kind === "platform" ? -12 : 0), 0);
      const speed = (e.x - e.px) / w.dt;
      const st: PuppetState = {
        pose: e.pose, poseT: e.poseT, t: t + e.id * 0.37, facing: e.facing, aim: 0, speed, vy: (e.y - e.py) / w.dt,
        wobble: e.wobble, scale: e.scale, squash: e.squash, alpha: e.alpha * fade, flash: e.hitFlash > 0 ? this.tk.hitFlash : 0,
        parry: e.parryable && !(e.vars.parryCd > 0) ? 1 : 0, flipY: e.flipY, rot: e.rot, grounded: true,
      };
      v.pv.update(st, this.tk);
      // reflection (mirror maze: only the real one has one)
      if (e.reflect) {
        if (!v.refl) { v.refl = this.puppets.make(e.puppet); v.refl.setOrder(40); v.refl.tint(...this.tokens.color("--sky"), 0.35); this.scene.add(v.refl.root); }
        v.refl.root.visible = !e.hidden;
        v.refl.root.position.set(x, w.floor - 6, 0);
        v.refl.update({ ...st, alpha: 0.45 * st.alpha }, this.tk);
        v.refl.root.scale.y = -0.28;
      } else if (v.refl) { v.refl.root.visible = false; }
    }
    for (const [id, v] of this.views) if (!seen.has(id)) { this.scene.remove(v.pv.root); v.pv.dispose(); if (v.refl) { this.scene.remove(v.refl.root); v.refl.dispose(); } this.views.delete(id); }

    // ── player ──
    const p = w.player;
    const want = p.flying ? "rickshaw" : "slummonkey";
    if (this.player.def.id !== want && this.content.puppets[want]) { this.scene.remove(this.player.root); this.player = this.puppets.make(want); this.player.setOrder(400); this.scene.add(this.player.root); }
    const px = p.px + (p.x - p.px) * alpha, py = p.py + (p.y - p.py) * alpha;
    this.player.root.position.set(px, py, 0);
    const flicker = p.iframes > 0 && Math.floor(t * 12) % 2 === 0;
    const localAim = Math.atan2(p.aimY, p.aimX * p.facing);
    this.player.update({
      pose: p.pose, poseT: p.poseT, t, facing: p.facing, aim: localAim, speed: p.vx, vy: p.vy, wobble: 0, scale: 1,
      squash: p.grounded ? 0 : Math.max(-0.15, Math.min(0.15, p.vy / 5000)), alpha: p.blinkT > 0 ? 0.3 : 1, flash: p.hurtT > 0.25 ? 1 : flicker ? 0.35 : 0,
      parry: 0, flipY: false, rot: p.pose === "spin" ? -t * 18 * p.facing : 0, grounded: p.grounded,
    }, this.tk);
    if (p.invulnT > 0) this.player.tint(...this.tokens.color("--sky"), 0.3 + Math.sin(t * 20) * 0.2); else this.player.tint(1, 1, 1, 0);
    for (const g of this.ghosts) {
      g.t += realDt;
      g.pv.root.visible = g.t < 0.25;
      if (!g.pv.root.visible) continue;
      const jit = (Math.floor(g.t * 30) % 2 ? 14 : -14) * (1 - g.t / 0.25);
      g.pv.root.position.set(g.x + jit, g.y, 0);
      g.pv.update({ pose: "run", poseT: 0, t: 0, facing: g.facing, aim: 0, speed: 0, vy: 0, wobble: 0, scale: 1, squash: 0, alpha: 0.75 * (1 - g.t / 0.25), flash: 0, parry: 0, flipY: false, rot: 0, grounded: true }, this.tk);
    }

    // ── lights: additive pools of stage light, glows behind the player and bullets ──
    const lb = this.lights;
    lb.begin();
    const st = this.content.stages[this.stageId];
    const flick = 1 + Math.sin(t * 7.3) * 0.03 + Math.sin(t * 13.1) * 0.02;
    for (const L of st?.lights ?? []) {
      const lx = L.x + camX * (1 - 1 / L.depth), ly = L.y + camY * (1 - 1 / L.depth);
      lb.add(L.kind === "cone" ? "cone" : L.kind === "pool" ? "glow" : "glow", lx, ly, L.h, (L.angle * Math.PI) / 180, L.alpha * flick, false, this.tokens.color(L.color), L.w);
    }
    if (!p.dead) {
      lb.add("glow", px, py + 55, 190, 0, this.tk.playerGlow, false, this.tokens.color("--rim-color"), 190);
      if (!p.flying && w.camY === 0) lb.add("cone", px, w.floor + 300, 620, 0, this.tk.playerGlow * 0.6, false, this.tokens.color("--rim-color"), 300); // follow-spot
    }
    for (const q of w.projs.live) if (!q.hostile && q.len === 0) lb.add("glow", q.x, q.y, q.r * 5, 0, 0.3, false, this.tokens.color("--shot-glow"));
    lb.end();

    // ── under layer: shadows, decals, telegraphs ──
    const ub = this.under;
    ub.begin();
    if (!p.flying) ub.add("shadow", px, w.groundUnder(px, py + 1, py - 2000) + 2, 18, 0, this.tk.shadowA * Math.max(0.3, 1 - (py - w.floor) / 600), false, undefined, 80);
    for (const e of w.all) {
      if (e.hidden || e.kind === "platform" || e.kind === "director" || e.kind === "target" || e.y > w.floor + 400) continue;
      if (e.alpha < 0.1 && !e.keepVisible) continue;
      const sw = e.w * e.scale * 1.05;
      ub.add("shadow", e.x, w.floor + 2, sw * 0.18, 0, this.tk.shadowA * e.alpha * Math.max(0.2, 1 - (e.y - w.floor) / 500), false, undefined, sw);
    }
    for (const e of w.all) if ((e.kind === "decoy" || e.reflect) && e.alive && !e.hidden) ub.add("mirror-frame", e.x, w.floor + 170, 340, 0, 0.95, false, undefined, 220);
    for (let i = this.decals.length - 1; i >= 0; i--) {
      const d = this.decals[i];
      d.t += realDt;
      if (d.t > 5) { this.decals.splice(i, 1); continue; }
      ub.add("footprint", d.x, d.y + 3, 26 * d.scale + 10, 0, Math.min(1, (5 - d.t) / 1.5), false, undefined, 70 * d.scale + 26);
    }
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.t += realDt;
      if (f.t > f.dur + 0.2) { this.fx.splice(i, 1); continue; }
      const blink = Math.floor(f.t * 10) % 2 ? 1 : 0.55;
      if (f.kind === "warn-mark") ub.add("warn-mark", f.x, f.y + 4, 40, 0, blink, false, undefined, 150 * Math.min(1, f.t / 0.15));
      else if (f.kind === "warn-line-x") ub.add("warn-line", f.x, w.camY + 280, 600, 0, blink * 0.7, false, undefined, 50);
      else if (f.kind === "warn-line-y") ub.add("warn-line", w.camX, f.y, 50, 0, blink * 0.7, false, undefined, this.viewW);
      else if (f.kind === "warn-beam") ub.add("warn-line", f.x + Math.cos((f.n * Math.PI) / 180) * 900, f.y + Math.sin((f.n * Math.PI) / 180) * 900, 10, (f.n * Math.PI) / 180, blink, false, undefined, 1800);
      else if (f.kind === "warn-seg") {
        const [x2, y2] = f.s.slice(4).split(",").map(Number);
        const len = Math.hypot(x2 - f.x, y2 - f.y);
        ub.add("warn-line", (f.x + x2) / 2, (f.y + y2) / 2, 14, Math.atan2(y2 - f.y, x2 - f.x), blink * Math.min(1, (f.dur - f.t) * 2), false, undefined, len);
      }
      else if (f.kind === "warn-graph") ub.add("warn-line", w.camX, w.floor + 300, 520, 0, blink * 0.35, false, [0.2, 1, 0.5], this.viewW);
    }
    ub.end();

    // ── bullets (one draw call) ──
    const bb = this.bullets;
    bb.begin();
    for (const q of w.projs.live) {
      const x = q.px + (q.x - q.px) * alpha, y = q.py + (q.y - q.py) * alpha;
      if (q.len > 0) {
        const wob = 1 + Math.sin(t * 50) * 0.08;
        bb.add(q.def.sprite, x + Math.cos(q.angle) * q.len / 2, y + Math.sin(q.angle) * q.len / 2, q.r * 2 * wob, q.angle, 1, false, undefined, q.len);
        continue;
      }
      const sprite = q.parryable ? "marigold" : q.def.sprite;
      const rot = q.def.spin ? Math.floor(q.rot * 4) / 4 : q.vx || q.vy ? Math.atan2(q.vy, q.vx) * (q.def.sprite === "shockwave" || q.def.sprite === "bomb" || q.def.sprite === "laddoo" ? 0 : 1) : 0;
      const sz = q.r * 2.6 * (q.def.sprite === "shockwave" ? 1.6 : 1);
      const spd = Math.hypot(q.vx, q.vy);
      const smear = !q.def.spin && !q.parryable && spd > 700 ? 1 + Math.min(0.8, (spd - 700) / 1200) : 1;
      bb.add(sprite, x, y + (q.ground ? sz * 0.3 : 0), sz / Math.sqrt(smear), q.parryable ? t * 3 : rot, 1, q.parryable, undefined, sz * (this.atlas.aspect[sprite] ?? 1) * smear);
    }
    bb.end();

    // ── over layer: particles + spotlights + sheet/mirror flashes + rotor ──
    this.particles.step(realDt);
    const ob = this.over;
    ob.begin();
    for (const f of this.fx) {
      const e = w.ent(f.id);
      if (f.kind === "spotlight") ob.add("spotlight", e?.x ?? f.x, w.floor + 330, 700, 0, 0.35 * Math.min(1, (f.dur - f.t) * 3), false, undefined, 380);
      if (f.kind === "sheet-drop" || f.kind === "sheet-lift") {
        const k = Math.min(1, f.t / 0.5);
        const drop = f.kind === "sheet-drop";
        const y = drop ? w.floor + 600 - k * 600 : w.floor + k * 700;
        const a = drop ? 1 : 1 - k;
        ob.add("sheet", f.x, y + 160, 340, Math.sin(f.t * 12) * 0.05, a, false, undefined, 380);
      }
      if (f.kind === "impact") { const fr = Math.floor(f.t * 24); ob.add("impact", f.x, f.y, fr === 0 ? 34 : 52, fr * 0.6, fr > 1 ? 0.6 : 1); }
      if (f.kind === "muzzle") ob.add("muzzle", f.x + p.aimX * 16, f.y + p.aimY * 16, 30 * f.n, Math.atan2(p.aimY, p.aimX), 1 - f.t / f.dur);
      if (f.kind === "mirror-flash" || f.kind === "mirror-spawn") ob.add("sparkle", f.x, f.y + 120, 200, t * 2, 1 - f.t / f.dur);
      if (f.kind === "drumroll") {
        const k = f.t / f.dur;
        if (Math.floor(t * 12) % 2 === 0) ob.add("sparkle", f.x + Math.sin(t * 9) * 80, f.y + 200 + Math.cos(t * 7) * 60, 30 + k * 20, t * 4, 0.8);
      }
    }
    this.particles.draw(ob, t);
    ob.end();
    this.bullets.mesh.material instanceof THREE.ShaderMaterial && (this.bullets.mesh.material.uniforms.uTime.value = t);
    (this.over.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = t;

    // ── post ──
    this.tracking = Math.max(0, this.tracking - realDt * this.tk.trackingDecay * 0.5);
    this.flash = Math.max(0, this.flash - realDt * 3);
    const pu = this.post.uniforms;
    pu.uTime.value = t;
    pu.uTracking.value = this.tracking * this.tk.tracking * 4;
    pu.uFlash.value = this.flash * 0.5;
    this.renderer.setRenderTarget(this.rt);
    this.renderer.render(this.scene, this.camera);
    this.sceneCalls = this.renderer.info.render.calls;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.postCam);
  }
  sceneCalls = 0;

  /** Render any scene through the same film/VHS post stack (overworld uses this). */
  composite(scene: THREE.Scene, camera: THREE.Camera, realDt: number) {
    this.t += realDt;
    this.tracking = Math.max(0, this.tracking - realDt * this.tk.trackingDecay * 0.5);
    const pu = this.post.uniforms;
    pu.uTime.value = this.t;
    pu.uTracking.value = this.tracking * this.tk.tracking * 4;
    pu.uFlash.value = 0;
    this.renderer.setRenderTarget(this.rt);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.postCam);
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
  get bulletCount() { return this.bullets.n; }
  get playerPuppetId() { return this.player.def.id; }
  playerPartVisible(id: string) { const n = this.player.parts.find((p) => p.def.id === id); return !!n && n.pivot.visible && this.player.root.visible; }
  ghostVisible() { return this.ghosts.some((g) => g.pv.root.visible); }
  entityVisible(id: number) { const v = this.views.get(id); return !!v && v.pv.root.visible; }
  entityPuppet(id: number) { return this.views.get(id)?.puppet ?? ""; }
  reflectionVisible(id: number) { const v = this.views.get(id); return !!v?.refl && v.refl.root.visible; }
  get stageLayerCount() { return this.layers.length; }

  clearWorld() {
    for (const [, v] of this.views) { this.scene.remove(v.pv.root); v.pv.dispose(); if (v.refl) this.scene.remove(v.refl.root); }
    this.views.clear();
    this.decals = []; this.fx = [];
  }

  dispose() { this.renderer.dispose(); }
}

export type { Ent };
