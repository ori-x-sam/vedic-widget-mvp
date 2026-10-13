// Set builders: the words a `place` names with set= (content/day*.kdl). Each builds the scenery around a day scene;
// the place's own content puts the people, props and the eye in it. Catalog: ## Sets.
//   jungle-road  the drive in: a laterite road through sal, rolling past while the jeep moves, a hill for the doe
//   verandah     the palace verandah on its ridge at dusk: marble, cusped arches, the jungle going violet below
//   wing         tonight's wing (the night's own builder, view/wing.ts), for scenes set inside it
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { token } from '../tokens';
import { place } from './models';
import { mulberry } from './noise';
import { surface } from './surfaces';
import { QUALITY } from './quality';

export type Set = { root: THREE.Group; tick(dtS: number, moving: boolean): void; light?(sunDir: THREE.Vector3): void };

/** An atmospheric sky (Rayleigh and Mie scattering) that follows the set's sun: hazy white noon, a violet dusk. */
function atmosphere(dusk: boolean): { mesh: THREE.Mesh; aim(sunDir: THREE.Vector3): void } {
  const sky = new Sky();
  sky.scale.setScalar(450);
  const u = sky.material.uniforms;
  u.turbidity!.value = dusk ? 4 : 5;
  u.rayleigh!.value = dusk ? 2.6 : 1.2;
  u.mieCoefficient!.value = dusk ? 0.003 : 0.004;
  u.mieDirectionalG!.value = dusk ? 0.72 : 0.8;
  // The scattering model is physically bright; the game's exposure is tuned for its own lights, so the sky is scaled
  // to sit under them. Clouds drift.
  u.skyGain = { value: dusk ? 0.3 : 0.32 };
  u.cloudCoverage!.value = dusk ? 0.35 : 0.45;
  u.showSunDisc!.value = 0;
  sky.material.fragmentShader = 'uniform float skyGain;\n' + sky.material.fragmentShader.replace('gl_FragColor = vec4( texColor, 1.0 );', 'gl_FragColor = vec4( min( texColor * skyGain, vec3( 1.6 ) ), 1.0 );');
  sky.onBeforeRender = () => { u.time!.value = performance.now() / 1000; };
  sky.userData.noPick = true;
  sky.name = 'sky';
  return { mesh: sky, aim: (d) => u.sunPosition!.value.copy(d) };
}

/** Low far hills all round, so the jungle meets a horizon; the haze fades them. */
function hills(radius: number, y: number, seed: number): THREE.Mesh {
  const rnd = mulberry(seed), n = 160, geo = new THREE.CylinderGeometry(radius, radius, 1, n, 1, true);
  const pos = geo.attributes.position!;
  const peaks = Array.from({ length: 7 }, () => [rnd() * Math.PI * 2, 6 + rnd() * 16, 0.2 + rnd() * 0.5] as const);
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) < 0) { pos.setY(i, y - 2); continue; }
    const a = Math.atan2(pos.getZ(i), pos.getX(i));
    let h = 4 + Math.sin(a * 5 + seed) * 1.5 + Math.sin(a * 13) * 0.7;
    for (const [pa, ph, pw] of peaks) { const d = Math.atan2(Math.sin(a - pa), Math.cos(a - pa)); h += ph * Math.exp(-((d / pw) ** 2)); }
    pos.setY(i, y + h);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: token('--jungle'), roughness: 1, side: THREE.BackSide }));
  m.userData.noPick = true;
  return m;
}

/** One tree or bush of a jungle: where it stands, which way it turns, how big. */
type Planting = { x: number; z: number; turn: number; scale: number };

/** Many copies of one model drawn as a few instanced batches (a phone draws a jungle in a few dozen calls, not
    hundreds). The road is cut into sections of SECTION_U, each its own batch, so a section behind the eye (or outside
    the sun's shadow) is skipped whole, and a section further ahead than NEAR_U draws `farId`, the same plant cut
    coarsely, if there is one. What stands near the road casts shadows; the rest is drawn once. `roll(u)` moves the
    grove south by u, a section that passes the jeep going back to the far end of the road. */
const ROAD_FROM_Z = -150, ROAD_U = 200, SECTION_U = 50, NEAR_U = 30;
function partsOf(id: string): THREE.Mesh[] {
  const template = place(id).root, parts: THREE.Mesh[] = [];
  template.updateMatrixWorld(true);
  template.traverse((o) => { if ((o as THREE.Mesh).isMesh) parts.push(o as THREE.Mesh); });
  return parts;
}
function grove(id: string, plants: Planting[], farId?: string) {
  const root = new THREE.Group(), detail = { near: partsOf(id), far: farId ? partsOf(farId) : null };
  const mat = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pos = new THREE.Vector3(), sc = new THREE.Vector3();
  const sections: { group: THREE.Group; near: THREE.Group; far: THREE.Group | null }[] = [];
  for (let z0 = ROAD_FROM_Z; z0 < ROAD_FROM_Z + ROAD_U; z0 += SECTION_U) {
    const group = new THREE.Group();
    group.position.z = z0;
    const here = plants.filter((p) => p.z >= z0 && p.z < z0 + SECTION_U);
    const build = (parts: THREE.Mesh[]) => {
      const g = new THREE.Group();
      for (const [i, set] of [here.filter((p) => Math.abs(p.x) <= 9), here.filter((p) => Math.abs(p.x) > 9)].entries()) {
        if (!set.length) continue;
        for (const m of parts) {
        const inst = new THREE.InstancedMesh(m.geometry, m.material, set.length);
        inst.castShadow = i === 0; inst.receiveShadow = true;
        inst.userData.noPick = true;
        set.forEach((p, k) => { mat.compose(pos.set(p.x, 0, p.z - z0), q.setFromAxisAngle(up, p.turn), sc.setScalar(p.scale)).multiply(m.matrixWorld); inst.setMatrixAt(k, mat); });
        inst.computeBoundingSphere();
        g.add(inst);
        }
      }
      group.add(g);
      return g;
    };
    sections.push({ group, near: build(detail.near), far: detail.far ? build(detail.far) : null });
    root.add(group);
  }
  /** Near sections draw the plant itself; sections further ahead than NEAR_U, its coarse stand-in. */
  const detailFor = () => { for (const s of sections) { const close = s.group.position.z + SECTION_U > -NEAR_U; s.near.visible = close || !s.far; if (s.far) s.far.visible = !close; } };
  detailFor();
  return {
    root,
    roll(u: number) {
      for (const s of sections) { s.group.position.z += u; if (s.group.position.z > ROAD_FROM_Z + ROAD_U) s.group.position.z -= ROAD_U; }
      detailFor();
    },
  };
}

/** The drive in: the road runs north (-z); trees roll south past the jeep while it moves. */
function jungleRoad(): Set {
  const root = new THREE.Group();
  const air = atmosphere(false);
  root.add(air.mesh, hills(220, 0, 5));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), surface('grass', 400, 400));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  const road = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 400), surface('laterite', 4.2, 400));
  road.rotation.x = -Math.PI / 2; road.position.y = 0.01; road.receiveShadow = true;
  // The road's surface rolls under the jeep with the trees.
  const roadMap = (road.material as THREE.MeshStandardMaterial).map!;
  // The hill the doe stands at the foot of.
  const hill = new THREE.Mesh(new THREE.SphereGeometry(14, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), surface('grass', 30, 30));
  hill.scale.y = 0.45; hill.position.set(-9, 0, -28); hill.receiveShadow = true;
  // The bank at the hill's foot the doe stands on, a little above the road so she shows over the guests' heads.
  const bank = new THREE.Mesh(new THREE.SphereGeometry(4, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), surface('grass', 8, 8));
  bank.scale.y = 0.14; bank.position.set(0.6, 0, -12.6); bank.receiveShadow = true;
  root.add(ground, road, hill, bank);
  const rnd = mulberry(3), sal: Planting[] = [], scrub: Planting[] = [];
  for (let i = 0; i < QUALITY.trees; i++) sal.push({ x: (i % 2 ? 1 : -1) * (3.5 + rnd() * 22), z: -150 + rnd() * 200, turn: rnd() * Math.PI * 2, scale: 0.8 + rnd() * 0.6 });
  // Scrub and ferns under the sal, thick at the road's edge.
  for (let i = 0; i < QUALITY.scrub; i++) scrub.push({ x: (i % 2 ? 1 : -1) * (2.6 + rnd() ** 2 * 16), z: -150 + rnd() * 200, turn: rnd() * Math.PI * 2, scale: 0.7 + rnd() * 0.9 });
  const groves = [grove('sal-tree', sal, 'sal-tree-far'), grove('scrub', scrub, 'scrub-far')];
  for (const g of groves) root.add(g.root);
  return {
    root,
    light: air.aim,
    tick(dtS, moving) {
      if (!moving) return;
      for (const g of groves) g.roll(dtS * 7);
      roadMap.offset.y -= (dtS * 7) / 4.2;
    },
  };
}

/** The verandah: a marble floor, a row of cusped arches on sandstone piers facing out over the jungle. */
function verandah(): Set {
  const root = new THREE.Group();
  const air = atmosphere(true);
  root.add(air.mesh, hills(200, -14, 9));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), surface('marble', 14, 8));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), surface('sandstone', 14, 5));
  back.position.set(0, 2.5, 4); back.rotation.y = Math.PI; back.receiveShadow = true;
  root.add(floor, back);
  for (let i = -3; i <= 3; i++) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.6, 0.45), surface('sandstone', 0.45, 3.6));
    pier.position.set(i * 2, 1.8, -3.6); pier.castShadow = pier.receiveShadow = true;
    root.add(pier);
    if (i < 3) {
      // A cusped arch between piers: a pointed top cut from a sandstone spandrel.
      const sh = new THREE.Shape(); sh.moveTo(-1, 0); sh.lineTo(1, 0); sh.lineTo(1, 1.1); sh.lineTo(-1, 1.1); sh.closePath();
      const h = new THREE.Path(); h.moveTo(-0.78, 0); h.lineTo(0.78, 0); h.quadraticCurveTo(0.78, 0.7, 0, 0.95); h.quadraticCurveTo(-0.78, 0.7, -0.78, 0); sh.holes.push(h);
      const sp = new THREE.Mesh(new THREE.ShapeGeometry(sh, 8), surface('sandstone', 1, 1));
      sp.position.set(i * 2 + 1, 2.5, -3.6); sp.rotation.y = Math.PI; sp.castShadow = true;
      (sp.material as THREE.Material).side = THREE.DoubleSide;
      root.add(sp);
    }
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(14, 0.9, 0.2), surface('marble', 14, 0.9));
  rail.position.set(0, 0.45, -3.6); rail.castShadow = rail.receiveShadow = true;
  root.add(rail);
  // The jungle below the ridge.
  const rnd = mulberry(9);
  for (let i = 0; i < 40; i++) { const t = place('sal-tree-far'); t.root.position.set(-60 + rnd() * 120, -14, -20 - rnd() * 60); t.root.scale.setScalar(1.2 + rnd()); root.add(t.root); }
  const below = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), surface('grass', 400, 300));
  below.rotation.x = -Math.PI / 2; below.position.set(0, -14, -100);
  root.add(below);
  return { root, tick() {}, light: air.aim };
}

const SETS: Record<string, () => Set> = { 'jungle-road': jungleRoad, verandah };
/** Set words the view builds itself (`wing` is the night's own builder). */
export const SET_WORDS = [...Object.keys(SETS), 'wing'];

export function buildSet(word: string): Set {
  const make = SETS[word];
  if (!make) throw new Error(`sets: no set "${word}" (known: ${SET_WORDS.join(', ')})`);
  return make();
}
