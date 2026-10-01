// Isometric overworld island. The ground is painted once from the plain-text map in
// content/overworld.kdl (watercolor diamonds, ink coastline, cliff faces); props/NPCs/player are
// billboards depth-sorted by screen y. Rendered through the same film post stack.
import * as THREE from "three";
import type { Content } from "../core/content";
import type { Tokens } from "../core/tokens";
import type { Overworld } from "../rules/overworld";
import type { TextureBank } from "./textures";
import type { PuppetFactory, PuppetView } from "./puppet";
import { paperMaterial } from "./shaders";
import type { GameView } from "./gameview";

const TW = 160, TH = 80;
const iso = (gx: number, gy: number): [number, number] => [(gx - gy) * TW / 2, -(gx + gy) * TH / 2];

interface Bill { obj: THREE.Object3D; gx: number; gy: number; pv?: PuppetView; mat?: THREE.MeshBasicMaterial }

export class OverworldView {
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-640, 640, 360, -360, -100, 100);
  private bills: Bill[] = [];
  private player!: PuppetView;
  private bubble: HTMLDivElement | null = null;
  private bubbleT = 0;
  private bubbleAt: [number, number] = [0, 0];
  gameView: GameView | null = null;
  private viewH = 720; private viewW = 1280;
  private t = 0;

  constructor(private renderer: THREE.WebGLRenderer, private tokens: Tokens, private content: Content, private bank: TextureBank, private puppets: PuppetFactory) {}

  async load() {
    const def = this.content.overworld;
    // the sea beyond the painted ground is the same flat sea colour, so tall screens show no seam
    this.scene.background = new THREE.Color().setRGB(...this.tokens.color("--water"));
    // painted ground
    const { canvas, ox, oy } = this.paintGround();
    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(canvas.width, canvas.height), paperMaterial(this.tokens, tex, 0));
    ground.position.set(canvas.width / 2 - ox, -(canvas.height / 2 - oy), 0);
    ground.renderOrder = -500;
    this.scene.add(ground);
    // billboards: trees from the map, tents/shop nodes, NPCs, props
    const sprite = async (art: string, h: number, gx: number, gy: number) => {
      const r = await this.bank.get(art, h);
      const geo = new THREE.PlaneGeometry(h * r.aspect, h);
      geo.translate(0, h / 2 - 10, 0);
      const mat = new THREE.MeshBasicMaterial({ map: r.tex, transparent: true, depthWrite: false });
      const m = new THREE.Mesh(geo, mat);
      const [x, y] = iso(gx + 0.5, gy + 0.5);
      m.position.set(x, y, 0);
      this.scene.add(m);
      this.bills.push({ obj: m, gx: gx + 0.5, gy: gy + 0.5, mat });
    };
    const jobs: Promise<void>[] = [];
    def.map.forEach((row, gy) => [...row].forEach((ch, gx) => {
      if (ch === "T") jobs.push(sprite((gx * 7 + gy * 3) % 3 === 0 ? "overworld/banyan" : "overworld/palm", 190 + ((gx * 13 + gy * 7) % 40), gx, gy));
      if (ch === "^") jobs.push(sprite("overworld/rock", 70, gx, gy));
    }));
    for (const n of def.nodes) jobs.push(sprite(`overworld/${n.kind}`, n.kind === "shop" ? 190 : n.kind === "stage" ? 260 : 200, n.x, n.y));
    for (const p of def.props) jobs.push(sprite(`overworld/${p.kind}`, 120 * p.s, p.x, p.y));
    await Promise.all(jobs);
    for (const n of def.npcs) {
      const pv = this.puppets.make(n.puppet);
      const [x, y] = iso(n.x + 0.5, n.y + 0.5);
      pv.root.position.set(x, y, 0);
      this.scene.add(pv.root);
      this.bills.push({ obj: pv.root, gx: n.x + 0.5, gy: n.y + 0.5, pv });
    }
    this.player = this.puppets.make("slummonkey");
    this.scene.add(this.player.root);
  }

  private paintGround() {
    const def = this.content.overworld;
    const H = def.map.length, W = Math.max(...def.map.map((r) => r.length));
    const margin = 200;
    const cw = (W + H) * TW / 2 + margin * 2, ch = (W + H) * TH / 2 + margin * 2 + 80;
    const c = document.createElement("canvas");
    c.width = cw; c.height = ch;
    const g = c.getContext("2d")!;
    const hex = (n: string) => this.tokens.hex(n);
    const ox = H * TW / 2 + margin, oy = margin;
    const P = (gx: number, gy: number): [number, number] => [ox + (gx - gy) * TW / 2, oy + (gx + gy) * TH / 2];
    const at = (x: number, y: number) => def.map[y]?.[x] ?? "~";
    const land = (ch: string) => ch !== "~";
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    // sea strokes
    g.fillStyle = hex("--water"); g.fillRect(0, 0, cw, ch);
    g.strokeStyle = hex("--white"); g.globalAlpha = 0.35; g.lineWidth = 4; g.lineCap = "round";
    for (let i = 0; i < 160; i++) { const x = rnd() * cw, y = rnd() * ch; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 20, y - 8, x + 40, y); g.stroke(); }
    g.globalAlpha = 1;
    const diamond = (gx: number, gy: number, grow = 0) => {
      const [x, y] = P(gx, gy);
      g.beginPath();
      g.moveTo(x, y - grow); g.lineTo(x + TW / 2 + grow, y + TH / 2); g.lineTo(x, y + TH + grow); g.lineTo(x - TW / 2 - grow, y + TH / 2); g.closePath();
    };
    // shallow-water halo
    g.fillStyle = hex("--teal"); g.globalAlpha = 0.5;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (land(at(x, y))) { diamond(x, y, 26); g.fill(); }
    g.globalAlpha = 1;
    // cliff faces (south-facing edges drop toward the viewer)
    const cliff = 46;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!land(at(x, y))) continue;
      const [px, py] = P(x, y);
      if (!land(at(x, y + 1))) { g.fillStyle = hex("--clay-dark"); g.beginPath(); g.moveTo(px - TW / 2, py + TH / 2); g.lineTo(px, py + TH); g.lineTo(px, py + TH + cliff); g.lineTo(px - TW / 2, py + TH / 2 + cliff); g.closePath(); g.fill(); g.strokeStyle = hex("--ink"); g.lineWidth = 5; g.stroke(); }
      if (!land(at(x + 1, y))) { g.fillStyle = hex("--clay"); g.beginPath(); g.moveTo(px + TW / 2, py + TH / 2); g.lineTo(px, py + TH); g.lineTo(px, py + TH + cliff); g.lineTo(px + TW / 2, py + TH / 2 + cliff); g.closePath(); g.fill(); g.strokeStyle = hex("--ink"); g.lineWidth = 5; g.stroke(); }
    }
    // tops
    const col: Record<string, string> = { ".": "--leaf", T: "--leaf", ",": "--paper-dark", "#": "--sky-warm", "=": "--wood", "^": "--leaf-dark", o: "--leaf" };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = at(x, y);
      if (!land(t)) continue;
      g.fillStyle = hex(col[t] ?? "--leaf");
      diamond(x, y, 1); g.fill();
      // painterly dabs
      const [px, py] = P(x, y);
      for (let k = 0; k < 6; k++) {
        g.globalAlpha = 0.18; g.fillStyle = rnd() < 0.5 ? hex("--leaf-dark") : hex("--turmeric");
        if (t === "," || t === "#") g.fillStyle = rnd() < 0.5 ? hex("--clay") : hex("--white");
        if (t === "=") g.fillStyle = hex("--wood-dark");
        g.beginPath(); g.ellipse(px + (rnd() - 0.5) * TW * 0.6, py + TH / 2 + (rnd() - 0.5) * TH * 0.5, 10 + rnd() * 18, 5 + rnd() * 8, 0, 0, 7); g.fill();
      }
      g.globalAlpha = 1;
      if (t === "=") { g.strokeStyle = hex("--wood-dark"); g.lineWidth = 4; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(px - TW / 2 + k * TW / 8, py + TH / 2 - k * TH / 8); g.lineTo(px + k * TW / 8, py + TH - k * TH / 8); g.stroke(); } }
    }
    // ink coastline
    g.strokeStyle = hex("--ink"); g.lineWidth = 6; g.lineJoin = "round";
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!land(at(x, y))) continue;
      const [px, py] = P(x, y);
      const seg = (ax: number, ay: number, bx: number, by: number) => { g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); };
      if (!land(at(x, y - 1))) seg(px, py, px + TW / 2, py + TH / 2);
      if (!land(at(x - 1, y))) seg(px, py, px - TW / 2, py + TH / 2);
    }
    return { canvas: c, ox: ox - 0, oy: oy - 0 };
  }

  resize(w: number, h: number) {
    const aspect = w / Math.max(1, h);
    // keep at least ~1100 world px of island across, so tall phone screens zoom out instead of in
    this.viewH = Math.max(760, 1100 / aspect); this.viewW = this.viewH * aspect;
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
    const [px, py] = iso(ow.x, ow.y);
    const c = this.camera;
    c.left = -this.viewW / 2; c.right = this.viewW / 2; c.top = this.viewH / 2; c.bottom = -this.viewH / 2;
    c.position.set(px, py + 40, 10);
    c.updateProjectionMatrix();
    this.player.root.position.set(px, py, 0);
    this.player.update({ pose: ow.moving ? "run" : "idle", poseT: 0, t: this.t, facing: ow.facing, aim: 0, speed: 0, vy: 0, wobble: 0, scale: 0.75, squash: 0, alpha: 1, flash: 0, parry: 0, flipY: false, rot: 0, grounded: true }, { fps: 12, squashK: 1, smearSpeed: 1e9 });
    // depth sort by grid x+y (further back = lower order)
    const all: Bill[] = [...this.bills, { obj: this.player.root, gx: ow.x, gy: ow.y, pv: this.player }];
    for (const b of all) {
      const order = Math.round((b.gx + b.gy) * 10);
      if (b.pv) { b.pv.setOrder(order * 20); if (b !== all[all.length - 1]) b.pv.update({ pose: "idle", poseT: 0, t: this.t + b.gx, facing: -1, aim: 0, speed: 0, vy: 0, wobble: 0, scale: 0.75, squash: 0, alpha: 1, flash: 0, parry: 0, flipY: false, rot: 0, grounded: true }, { fps: 12, squashK: 1, smearSpeed: 1e9 }); }
      else (b.obj as THREE.Mesh).renderOrder = order * 20;
    }
    if (this.bubble) {
      this.bubbleT -= dt;
      const [bx, by] = Number.isNaN(this.bubbleAt[0]) ? [ow.x, ow.y] : this.bubbleAt;
      const [wx, wy] = iso(bx, by);
      const el = this.renderer.domElement;
      const sx = ((wx - (c.position.x + c.left)) / (c.right - c.left)) * el.clientWidth;
      const sy = (1 - (wy + 150 - (c.position.y + c.bottom)) / (c.top - c.bottom)) * el.clientHeight;
      this.bubble.style.left = `${sx}px`; this.bubble.style.top = `${sy}px`;
      if (this.bubbleT <= 0) { this.bubble.remove(); this.bubble = null; }
    }
    if (this.gameView) this.gameView.composite(this.scene, this.camera, dt);
    else this.renderer.render(this.scene, this.camera);
  }
}
