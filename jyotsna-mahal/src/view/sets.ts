// Set builders: the words a `place` names with set= (content/day*.kdl). Each builds the scenery around a day scene;
// the place's own content puts the people, props and the eye in it. Catalog: ## Sets.
//   jungle-road  the drive in: a laterite road through sal, rolling past while the jeep moves, a hill for the doe
//   verandah     the palace verandah on its ridge at dusk: marble, cusped arches, the jungle going violet below
//   wing         tonight's wing (the night's own builder, view/wing.ts), for scenes set inside it
import * as THREE from 'three';
import { token } from '../tokens';
import { place, type Instance } from './models';
import { mulberry } from './noise';
import { surface } from './surfaces';

export type Set = { root: THREE.Group; tick(dtS: number, moving: boolean): void };

function sky(top: string, horizon: string): THREE.Mesh {
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const g = c.getContext('2d')!, grad = g.createLinearGradient(0, 0, 0, 256);
  const hex = (t: string) => '#' + token(t).toString(16).padStart(6, '0');
  grad.addColorStop(0, hex(top)); grad.addColorStop(0.55, hex(horizon)); grad.addColorStop(1, hex(horizon));
  g.fillStyle = grad; g.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.SphereGeometry(180, 24, 12), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false }));
  m.userData.noPick = true;
  return m;
}

/** The drive in: the road runs north (-z); trees roll south past the jeep while it moves. */
function jungleRoad(): Set {
  const root = new THREE.Group();
  root.add(sky('--day-sky', '--sun'));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: token('--sal-leaf'), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  const road = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 400), new THREE.MeshStandardMaterial({ color: token('--brick'), roughness: 1 }));
  road.rotation.x = -Math.PI / 2; road.position.y = 0.01; road.receiveShadow = true;
  // The hill the doe stands at the foot of.
  const hill = new THREE.Mesh(new THREE.SphereGeometry(14, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: token('--sal-leaf'), roughness: 1 }));
  hill.scale.y = 0.45; hill.position.set(-20, 0, -26); hill.receiveShadow = true;
  root.add(ground, road, hill);
  const rnd = mulberry(3), trees: Instance[] = [];
  for (let i = 0; i < 70; i++) {
    const side = i % 2 ? 1 : -1, t = place('sal-tree');
    t.root.position.set(side * (3.5 + rnd() * 14), 0, -150 + rnd() * 200);
    t.root.rotation.y = rnd() * Math.PI * 2;
    t.root.scale.setScalar(0.8 + rnd() * 0.6);
    root.add(t.root); trees.push(t);
  }
  return {
    root,
    tick(dtS, moving) {
      if (!moving) return;
      for (const t of trees) { t.root.position.z += dtS * 7; if (t.root.position.z > 50) t.root.position.z -= 200; }
    },
  };
}

/** The verandah: a marble floor, a row of cusped arches on sandstone piers facing out over the jungle. */
function verandah(): Set {
  const root = new THREE.Group();
  root.add(sky('--dusk-sky', '--dusk-sun'));
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
  for (let i = 0; i < 40; i++) { const t = place('sal-tree'); t.root.position.set(-60 + rnd() * 120, -14, -20 - rnd() * 60); t.root.scale.setScalar(1.2 + rnd()); root.add(t.root); }
  const below = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), new THREE.MeshStandardMaterial({ color: token('--jungle'), roughness: 1 }));
  below.rotation.x = -Math.PI / 2; below.position.set(0, -14, -100);
  root.add(below);
  return { root, tick() {} };
}

const SETS: Record<string, () => Set> = { 'jungle-road': jungleRoad, verandah };
/** Set words the view builds itself (`wing` is the night's own builder). */
export const SET_WORDS = [...Object.keys(SETS), 'wing'];

export function buildSet(word: string): Set {
  const make = SETS[word];
  if (!make) throw new Error(`sets: no set "${word}" (known: ${SET_WORDS.join(', ')})`);
  return make();
}
