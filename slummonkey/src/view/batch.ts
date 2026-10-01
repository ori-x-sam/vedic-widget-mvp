// One InstancedMesh = one draw call for hundreds of bullets / particles / decals.
import * as THREE from "three";
import type { Atlas } from "./textures";

export class SpriteBatch {
  mesh: THREE.InstancedMesh;
  private xf: Float32Array; private size: Float32Array; private uv: Float32Array; private color: Float32Array; private parry: Float32Array;
  private attrs: THREE.InstancedBufferAttribute[];
  n = 0;

  constructor(public atlas: Atlas, material: THREE.ShaderMaterial, public max = 1024, order = 0) {
    const geo = new THREE.InstancedBufferGeometry();
    const base = new THREE.PlaneGeometry(1, 1);
    geo.index = base.index;
    geo.setAttribute("position", base.getAttribute("position"));
    geo.setAttribute("uv", base.getAttribute("uv"));
    this.xf = new Float32Array(max * 4); this.size = new Float32Array(max * 2); this.uv = new Float32Array(max * 4);
    this.color = new Float32Array(max * 4); this.parry = new Float32Array(max);
    this.attrs = [
      new THREE.InstancedBufferAttribute(this.xf, 4), new THREE.InstancedBufferAttribute(this.size, 2),
      new THREE.InstancedBufferAttribute(this.uv, 4), new THREE.InstancedBufferAttribute(this.color, 4),
      new THREE.InstancedBufferAttribute(this.parry, 1),
    ];
    ["iXform", "iSize", "iUv", "iColor", "iParry"].forEach((n, i) => { this.attrs[i].setUsage(THREE.DynamicDrawUsage); geo.setAttribute(n, this.attrs[i]); });
    this.mesh = new THREE.InstancedMesh(geo, material, max);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = order;
  }

  begin() { this.n = 0; }

  /** Add one sprite. h is world height; width follows the sprite's aspect unless w given. */
  add(sprite: string, x: number, y: number, h: number, rot = 0, alpha = 1, parry = false, tint?: [number, number, number], w?: number) {
    if (this.n >= this.max) return;
    const uv = this.atlas.uv[sprite] ?? this.atlas.uv["pellet"];
    if (!uv) return;
    const i = this.n++;
    const a = this.atlas.aspect[sprite] ?? 1;
    this.xf[i * 4] = x; this.xf[i * 4 + 1] = y; this.xf[i * 4 + 2] = rot; this.xf[i * 4 + 3] = 1;
    this.size[i * 2] = w ?? h * a; this.size[i * 2 + 1] = h;
    this.uv.set(uv, i * 4);
    this.color[i * 4] = tint?.[0] ?? 1; this.color[i * 4 + 1] = tint?.[1] ?? 1; this.color[i * 4 + 2] = tint?.[2] ?? 1; this.color[i * 4 + 3] = alpha;
    this.parry[i] = parry ? 1 : 0;
  }

  end() {
    this.mesh.count = this.n;
    for (const a of this.attrs) { a.needsUpdate = true; a.clearUpdateRanges(); a.addUpdateRange(0, this.n * a.itemSize); }
  }
}
