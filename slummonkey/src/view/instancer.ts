// Instanced low-poly shapes: one InstancedMesh per shape, refilled every frame (bullets, particles, telegraphs).
// "Glow" materials keep their facets but add the instance's own color as emission so small things pop.
import * as THREE from "three";
import { unitGeo } from "./model";

export type ShapeKey = "ball" | "gem" | "tetra" | "box" | "coin" | "cone" | "ring" | "disc" | "dome" | "bird" | "plane";

function geoFor(k: ShapeKey): THREE.BufferGeometry {
  switch (k) {
    case "coin": { const g = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 10); g.rotateX(Math.PI / 2); return g; }
    case "cone": { const g = new THREE.ConeGeometry(0.5, 1, 6); g.rotateZ(-Math.PI / 2); return g; } // points along +x
    case "ring": { const g = new THREE.RingGeometry(0.4, 0.5, 24); g.rotateX(-Math.PI / 2); return g; } // flat on the floor
    case "disc": { const g = new THREE.CircleGeometry(0.5, 20); g.rotateX(-Math.PI / 2); return g; }
    case "bird": { // a little paper-plane bird pointing +x
      const g = new THREE.BufferGeometry();
      const v = [0.5, 0, 0, -0.5, 0.05, 0.45, -0.3, 0, 0, 0.5, 0, 0, -0.3, 0, 0, -0.5, 0.05, -0.45, 0.5, 0, 0, -0.3, 0, 0, -0.45, -0.25, 0];
      g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
      g.computeVertexNormals();
      return g;
    }
    case "plane": return new THREE.PlaneGeometry(1, 1);
    default: return unitGeo(k, k === "ball" ? 0 : 0);
  }
}

function glowMaterial(k: number): THREE.MeshLambertMaterial {
  const m = new THREE.MeshLambertMaterial({ flatShading: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uGlow = { value: k };
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uGlow;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uGlow;");
  };
  m.customProgramCacheKey = () => "glow" + k;
  return m;
}

const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpP = new THREE.Vector3(), tmpS = new THREE.Vector3(), tmpC = new THREE.Color();

export class Instancer {
  meshes = new Map<ShapeKey, THREE.InstancedMesh>();
  private n = new Map<ShapeKey, number>();
  group = new THREE.Group();
  constructor(shapes: ShapeKey[], public cap: number, mat: "glow" | "lit" | "fx", glow = 0.55, shadows = false) {
    for (const k of shapes) {
      const material = mat === "fx"
        ? new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide })
        : mat === "glow" ? glowMaterial(glow) : new THREE.MeshLambertMaterial({ flatShading: true });
      if (k === "bird" || k === "plane") material.side = THREE.DoubleSide;
      const m = new THREE.InstancedMesh(geoFor(k), material, cap);
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
      m.count = 0;
      m.frustumCulled = false;
      m.castShadow = shadows;
      this.meshes.set(k, m);
      this.group.add(m);
    }
  }
  begin() { for (const k of this.meshes.keys()) this.n.set(k, 0); }
  add(k: ShapeKey, x: number, y: number, z: number, sx: number, sy: number, sz: number, rx: number, ry: number, rz: number, color: THREE.Color | [number, number, number]) {
    const m = this.meshes.get(k);
    if (!m) return;
    const i = this.n.get(k)!;
    if (i >= this.cap) return;
    tmpE.set(rx, ry, rz);
    tmpQ.setFromEuler(tmpE);
    tmpM.compose(tmpP.set(x, y, z), tmpQ, tmpS.set(sx || 1e-4, sy || 1e-4, sz || 1e-4));
    m.setMatrixAt(i, tmpM);
    if (Array.isArray(color)) tmpC.setRGB(color[0], color[1], color[2]); else tmpC.copy(color);
    m.setColorAt(i, tmpC);
    this.n.set(k, i + 1);
  }
  end() {
    for (const [k, m] of this.meshes) {
      m.count = this.n.get(k) ?? 0;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }
  get total() { let s = 0; for (const v of this.n.values()) s += v; return s; }
}
