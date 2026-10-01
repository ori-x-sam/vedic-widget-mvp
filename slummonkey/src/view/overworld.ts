// The island in low-poly 3D: the plain-text map in content/overworld.kdl becomes raised tiles (one merged mesh),
// trees/rocks/tents/stalls come from the stage prop vocabulary, NPCs and SlumMonkey are the same models as in fights.
// The grid is turned 45° so the stick's screen directions still match the rules' iso movement.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Content } from "../core/content";
import type { Tokens } from "../core/tokens";
import type { Overworld } from "../rules/overworld";
import type { GameView } from "./gameview";
import { MaterialBank, Model, ModelFactory } from "./model";
import { StageBuilder } from "./stage3d";

const T = 120; // tile size in world units

interface Npc { m: Model; x: number; y: number }

export class OverworldView {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(34, 16 / 9, 50, 9000);
  private island = new THREE.Group();
  private player!: Model;
  private npcs: Npc[] = [];
  private upds: ((t: number) => void)[] = [];
  private bubble: HTMLDivElement | null = null;
  private bubbleT = 0;
  private bubbleAt: [number, number] = [0, 0];
  private sun = new THREE.DirectionalLight(0xffffff, 1.5);
  private sea!: THREE.Mesh;
  gameView: GameView | null = null;
  private aspect = 16 / 9;
  private t = 0;
  private last: [number, number] = [0, 0];
  private mats: MaterialBank;
  private builder: StageBuilder;

  constructor(private renderer: THREE.WebGLRenderer, private tokens: Tokens, private content: Content, _bank?: unknown, private models?: ModelFactory) {
    this.mats = models?.bank ?? new MaterialBank(tokens);
    this.builder = new StageBuilder(this.mats);
  }

  private c(n: string) { return this.mats.color(n); }
  /** Grid (gx, gy) -> island-local position. */
  private at(gx: number, gy: number, y = 0) { return new THREE.Vector3(gx * T, y, gy * T); }

  async load() {
    const def = this.content.overworld;
    const factory = this.models ?? new ModelFactory(this.mats, this.content.puppets);
    this.scene.background = this.c("--sky-island-top");
    this.scene.fog = new THREE.Fog(this.c("--sky-island-bottom"), 2400, 5200);
    this.scene.add(new THREE.HemisphereLight(this.c("--sky-island-top").lerp(new THREE.Color(1, 1, 1), 0.6), this.c("--leaf-dark"), 1.2));
    this.sun.position.set(-600, 1400, 900);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera; sc.left = -1300; sc.right = 1300; sc.top = 1300; sc.bottom = -1300; sc.far = 5000;
    this.sun.shadow.bias = -0.0008;
    this.scene.add(this.sun, this.sun.target);
    this.island.rotation.y = -Math.PI / 4;
    this.scene.add(this.island);

    // sea + shallow ring
    this.sea = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000, 1, 1), new THREE.MeshLambertMaterial({ color: this.c("--water") }));
    this.sea.rotation.x = -Math.PI / 2; this.sea.position.y = -40; this.sea.receiveShadow = true;
    this.scene.add(this.sea);

    // land: one merged mesh of raised tiles with vertex colors (top = terrain, sides = cliff)
    const H = def.map.length, W = Math.max(...def.map.map((r) => r.length));
    const ch = (x: number, y: number) => def.map[y]?.[x] ?? "~";
    const land = (c: string) => c !== "~";
    const top: Record<string, string> = { ".": "--leaf", T: "--leaf", ",": "--paper-dark", "#": "--sky-warm", "=": "--wood", "^": "--leaf-dark", o: "--leaf" };
    const geos: THREE.BufferGeometry[] = [];
    const tileGeo = (cx: number, cz: number, w: number, h: number, d: number, y: number, topCol: THREE.Color, side: THREE.Color) => {
      const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
      g.translate(cx, y - h / 2, cz);
      const n = g.attributes.normal, cols = new Float32Array(n.count * 3);
      for (let i = 0; i < n.count; i++) { const c = n.getY(i) > 0.5 ? topCol : side; cols.set([c.r, c.g, c.b], i * 3); }
      g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
      return g;
    };
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = ch(x, y);
      if (!land(c)) {
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => land(ch(x + dx, y + dy)));
        if (near) geos.push(tileGeo(x * T + T / 2, y * T + T / 2, T, 10, T, -32, this.c("--teal"), this.c("--teal")));
        continue;
      }
      const hgt = c === "^" ? 40 : c === "," ? -6 : c === "#" ? 2 : 0;
      const col = this.c(top[c] ?? "--leaf").offsetHSL(0, 0, (rnd() - 0.5) * 0.04);
      geos.push(tileGeo(x * T + T / 2, y * T + T / 2, T, 80 + hgt, T, hgt, col, this.c(c === "," ? "--clay" : "--clay-dark")));
    }
    const merged = mergeGeometries(geos);
    const ground = new THREE.Mesh(merged, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
    ground.receiveShadow = true;
    this.island.add(ground);

    const put = (obj: THREE.Object3D, gx: number, gy: number, y = 0, s = 1) => { obj.position.copy(this.at(gx, gy, y)); obj.scale.multiplyScalar(s); obj.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } }); this.island.add(obj); };
    let k = 0;
    def.map.forEach((row, gy) => [...row].forEach((c, gx) => {
      if (c === "T") { const pc = this.builder.piece((gx * 7 + gy * 3) % 3 === 0 ? "tree" : "palm", {}, ++k); if (pc) { pc.obj.rotation.y = rnd() * 6; put(pc.obj, gx + 0.5, gy + 0.5, 0, 0.55 + rnd() * 0.15); } }
      if (c === "^") { const pc = this.builder.piece("rock", {}, ++k); if (pc) put(pc.obj, gx + 0.5, gy + 0.5, 40, 1); }
    }));
    const tentCol: Record<string, [string, string]> = {
      "tent-mela": ["--saffron", "--white"], "tent-gajraj": ["--elephant", "--white"], "tent-tigada": ["--pattu", "--lattu"],
      "tent-sky": ["--sky", "--white"], "tent-dolly": ["--dolly-a", "--dolly-b"],
    };
    for (const n of def.nodes) {
      let pc;
      if (n.kind === "shop") pc = this.builder.piece("stall", { color: "--rani" }, 3);
      else if (n.kind === "stage") pc = this.builder.piece("tent", { s: 1.25, color: "--raj-coat", color2: "--gold" }, 5);
      else pc = this.builder.piece("tent", { s: 0.9, color: tentCol[n.kind]?.[0] ?? "--vermilion", color2: tentCol[n.kind]?.[1] ?? "--white" }, 7);
      if (!pc) continue;
      pc.obj.rotation.y = Math.PI / 4;
      put(pc.obj, n.x + 0.5, n.y + 0.5, 0, n.kind === "shop" ? 0.5 : 0.42);
      if (pc.upd) this.upds.push(pc.upd);
    }
    for (const p of def.props) {
      if (p.kind === "lamp") {
        const g = new THREE.Group();
        g.add(this.mesh("cyl", "--ink", 8, 150, 8, 0, 75, 0));
        g.add(this.mesh("cyl", "--saffron", 30, 36, 30, 0, 160, 0, 0.8));
        g.add(this.mesh("cone", "--ink", 40, 18, 40, 0, 186, 0));
        put(g, p.x + 0.5, p.y + 0.5, 0, p.s);
      } else if (p.kind === "boat") {
        const g = new THREE.Group();
        g.add(this.mesh("box", "--wood", 160, 30, 60, 0, 0, 0));
        g.add(this.mesh("box", "--wood-dark", 170, 10, 66, 0, 18, 0));
        g.add(this.mesh("cyl", "--wood-dark", 6, 140, 6, 0, 80, 0));
        g.add(this.mesh("cone", "--white", 90, 120, 6, 30, 90, 0));
        put(g, p.x + 0.5, p.y + 0.5, -30, p.s);
        this.upds.push((t) => { g.position.y = -30 + Math.sin(t * 1.4) * 4; g.rotation.z = Math.sin(t * 1.1) * 0.05; });
      }
    }
    for (const n of def.npcs) {
      const m = factory.make(n.puppet);
      m.root.position.copy(this.at(n.x + 0.5, n.y + 0.5));
      m.root.scale.setScalar(0.85);
      this.island.add(m.root);
      this.npcs.push({ m, x: n.x + 0.5, y: n.y + 0.5 });
    }
    this.player = factory.make("slummonkey");
    this.player.root.scale.setScalar(0.85);
    this.island.add(this.player.root);
  }

  private mesh(shape: string, color: string, w: number, h: number, d: number, x: number, y: number, z: number, emissive = 0) {
    const geo = shape === "cyl" ? new THREE.CylinderGeometry(0.5, 0.5, 1, 8) : shape === "cone" ? new THREE.ConeGeometry(0.5, 1, 8) : new THREE.BoxGeometry(1, 1, 1);
    const m = new THREE.Mesh(geo, this.mats.shared(color, emissive));
    m.scale.set(w, h, d); m.position.set(x, y, z);
    return m;
  }

  resize(w: number, h: number) {
    this.aspect = w / Math.max(1, h);
    this.camera.aspect = this.aspect;
    // tall phone screens pull the camera back instead of cropping the island
    this.camera.fov = this.aspect < 1 ? 52 : 34;
    this.camera.updateProjectionMatrix();
  }

  say(who: string, text: string) {
    this.bubble?.remove();
    const el = document.createElement("div");
    el.className = "bubble";
    el.innerHTML = `<span class="who"></span><span class="txt"></span>`;
    const npc = this.content.overworld.npcs.find((n) => n.id === who);
    el.querySelector(".who")!.textContent = npc ? npc.id : "SlumMonkey";
    el.querySelector(".txt")!.textContent = text;
    document.querySelector("#app .layer")?.appendChild(el);
    this.bubble = el; this.bubbleT = 3.2;
    this.bubbleAt = npc ? [npc.x + 0.5, npc.y + 0.5] : [NaN, NaN];
  }

  render(ow: Overworld, dt: number) {
    this.t += dt;
    const t = this.t;
    // player: faces the way they walk
    const dx = ow.x - this.last[0], dy = ow.y - this.last[1];
    if (Math.hypot(dx, dy) > 1e-4) this.player.faceYaw = Math.atan2(-dy, dx);
    this.last = [ow.x, ow.y];
    this.player.root.position.copy(this.at(ow.x, ow.y));
    this.player.update({ pose: ow.moving ? "run" : "idle", poseT: 0, t, facing: 1, aim: 0, speed: 0, vy: 0, wobble: 0, scale: 1, squash: 0, alpha: 1, flash: 0, parry: 0, flipY: false, rot: 0, grounded: true }, dt);
    for (const n of this.npcs) {
      // NPCs turn to face you when you come close
      const d = Math.hypot(ow.x - n.x, ow.y - n.y);
      n.m.faceYaw = d < 2.5 ? Math.atan2(-(ow.y - n.y), ow.x - n.x) : -Math.PI / 4;
      n.m.update({ pose: "idle", poseT: 0, t: t + n.x, facing: 1, aim: 0, speed: 0, vy: 0, wobble: 0, scale: 1, squash: 0, alpha: 1, flash: 0, parry: 0, flipY: false, rot: 0, grounded: true }, dt);
    }
    for (const u of this.upds) u(t);
    // camera: behind and above the player (world space, after the island's 45° turn)
    const pw = this.player.root.getWorldPosition(new THREE.Vector3());
    const back = this.aspect < 1 ? 1700 : 1350;
    this.camera.position.set(pw.x, pw.y + back * 1.05, pw.z + back * 0.72);
    this.camera.lookAt(pw.x, pw.y + 30, pw.z);
    this.sun.position.set(pw.x - 600, 1400, pw.z + 900);
    this.sun.target.position.copy(pw);
    this.sea.position.y = -40 + Math.sin(t * 0.8) * 2;
    if (this.bubble) {
      this.bubbleT -= dt;
      const [bx, by] = Number.isNaN(this.bubbleAt[0]) ? [ow.x, ow.y] : this.bubbleAt;
      const v = this.island.localToWorld(this.at(bx, by, 150)).project(this.camera);
      const el = this.renderer.domElement;
      this.bubble.style.left = `${(v.x * 0.5 + 0.5) * el.clientWidth}px`; this.bubble.style.top = `${(0.5 - v.y * 0.5) * el.clientHeight}px`;
      if (this.bubbleT <= 0) { this.bubble.remove(); this.bubble = null; }
    }
    if (this.gameView) this.gameView.composite(this.scene, this.camera, dt);
    else this.renderer.render(this.scene, this.camera);
  }
}
