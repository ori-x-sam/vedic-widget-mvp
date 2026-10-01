// SVG part files -> canvases -> three.js textures. Colors in SVGs are var(--token) and get themed
// from look/*.css before rasterizing, so recoloring a character is a CSS edit.
import * as THREE from "three";
import type { Tokens } from "../core/tokens";

export interface Raster { tex: THREE.Texture; w: number; h: number; aspect: number; canvas: HTMLCanvasElement }
export interface Atlas { tex: THREE.Texture; uv: Record<string, [number, number, number, number]>; aspect: Record<string, number> }

const viewBoxAspect = (svg: string) => {
  const m = /viewBox\s*=\s*"([\d.\s-]+)"/.exec(svg);
  if (!m) return 1;
  const [, , w, h] = m[1].trim().split(/\s+/).map(Number);
  return w / h;
};

export class TextureBank {
  private cache = new Map<string, Promise<Raster>>();
  private rasterScale: number;
  constructor(public tokens: Tokens, public svgs: Record<string, string>, private maxTex = 2048) {
    this.rasterScale = tokens.num("--texture-scale", 2);
  }

  has(path: string) { return !!this.svgs[this.norm(path)]; }
  norm(path: string) { return path.startsWith("art/") ? path : "art/" + path.replace(/^\//, "") + (path.endsWith(".svg") ? "" : ".svg"); }

  /** Rasterize one SVG at a world height (px). */
  get(path: string, worldH: number, scale = this.rasterScale): Promise<Raster> {
    const key = `${path}@${worldH}@${scale}`;
    let p = this.cache.get(key);
    if (!p) { p = this.raster(path, worldH, scale); this.cache.set(key, p); }
    return p;
  }

  async canvasFor(path: string, hPx: number): Promise<HTMLCanvasElement> {
    const src = this.svgs[this.norm(path)] ?? MISSING;
    const aspect = viewBoxAspect(src);
    let h = Math.max(4, Math.round(hPx)), w = Math.max(4, Math.round(h * aspect));
    const k = Math.min(1, this.maxTex / Math.max(w, h));
    w = Math.round(w * k); h = Math.round(h * k);
    const svg = this.tokens.substitute(src).replace(/<svg\b([^>]*)>/, (_m, attrs: string) =>
      `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, "")} width="${w}" height="${h}">`);
    const img = await loadImage(svg);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d")!;
    g.drawImage(img, 0, 0, w, h);
    return c;
  }

  private async raster(path: string, worldH: number, scale: number): Promise<Raster> {
    const c = await this.canvasFor(path, worldH * scale);
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 2;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return { tex, w: c.width, h: c.height, aspect: c.width / c.height, canvas: c };
  }

  /** Pack many small sprites into one atlas texture (one draw call for all bullets/particles). */
  async atlas(paths: string[], cell = 128): Promise<Atlas> {
    const cols = Math.ceil(Math.sqrt(paths.length));
    const size = Math.min(this.maxTex, cols * cell);
    const cs = size / cols;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    const uv: Atlas["uv"] = {}, aspect: Atlas["aspect"] = {};
    await Promise.all(paths.map(async (p, i) => {
      const src = this.svgs[this.norm(p)] ?? MISSING;
      const a = viewBoxAspect(src);
      const pad = 3;
      const w = a >= 1 ? cs - pad * 2 : (cs - pad * 2) * a;
      const h = a >= 1 ? (cs - pad * 2) / a : cs - pad * 2;
      const canvas = await this.canvasFor(p, h);
      const x = (i % cols) * cs, y = Math.floor(i / cols) * cs;
      const ox = x + (cs - w) / 2, oy = y + (cs - h) / 2;
      g.drawImage(canvas, ox, oy, w, h);
      const name = p.split("/").pop()!.replace(".svg", "");
      uv[name] = [ox / size, 1 - (oy + h) / size, (ox + w) / size, 1 - oy / size];
      aspect[name] = a;
    }));
    const tex = new THREE.CanvasTexture(c);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return { tex, uv, aspect };
  }
}

const MISSING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" fill="#f0f" stroke="#000" stroke-width="6"/><path d="M5 5L95 95M95 5L5 95" stroke="#000" stroke-width="6"/></svg>`;

function loadImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((res) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const fb = new Image();
      fb.onload = () => res(fb);
      fb.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(MISSING);
    };
    img.src = url;
  });
}
