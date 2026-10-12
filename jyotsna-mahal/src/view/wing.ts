// A night's wing, built from its content: each room's floor, walls (cut for doors, jaalis and transoms), ceiling,
// props and lamps; each door's leaf; each spot's model at its current pose; Bhima and his lantern; and the moon,
// which shines through every jaali that faces it as a patterned shaft. sync() reconciles it against the game state by
// id each frame: doors swing, the trunk walks to the door, Bhima walks his round. Nothing here decides anything.
import * as THREE from 'three';
import { C, get, nightOf, roomsOf, spotsIn, doorsOf, type Cond, type Room, type Door } from '../content';
import { doorPlace, holds, roomAt, spotPose, type GameState } from '../game';
import { token } from '../tokens';
import { LOOK } from './look';
import { jaaliPattern, surface } from './surfaces';
import { place, type Instance } from './models';
import { mulberry } from './noise';

const D2R = Math.PI / 180;
const WALL_INSET_U = 0.002;

/** Towards the moon, as a unit vector (bearing from north, clockwise; altitude above the horizon). */
export function moonDir(n: number): THREE.Vector3 {
  const nt = nightOf(n), az = nt['moon-az'] * D2R, alt = nt['moon-alt'] * D2R;
  return new THREE.Vector3(Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt));
}

type Opening = { at: number; w: number; y: number; h: number; arch: boolean };
type WallSide = 'north' | 'south' | 'east' | 'west';
const NORMAL: Record<WallSide, THREE.Vector3> = { north: new THREE.Vector3(0, 0, -1), south: new THREE.Vector3(0, 0, 1), east: new THREE.Vector3(1, 0, 0), west: new THREE.Vector3(-1, 0, 0) };

/** The openings in one wall of a room, in metres along it from its left end as seen from inside. */
function openings(room: Room, side: WallSide): Opening[] {
  const len = side === 'north' || side === 'south' ? room.w : room.d;
  // Seen from inside: north runs west->east, south east->west, east north->south, west south->north.
  const along = (offset: number) => (side === 'north' || side === 'east' ? len / 2 + offset : len / 2 - offset);
  const out: Opening[] = [];
  for (const c of room.children) if ((c.word === 'jaali' || c.word === 'transom') && c.wall === side) out.push({ at: along(c.at), w: c.w, y: c.y, h: c.h, arch: c.word === 'jaali' });
  for (const d of Object.values(C.door)) {
    if (d.from === room.id && d.wall === side) out.push({ at: along(d.at), w: d.w, y: 0, h: d.h, arch: d.arch });
    if (d.to === room.id) {
      const p = doorPlace(d), opp: WallSide = d.wall === 'north' ? 'south' : d.wall === 'south' ? 'north' : d.wall === 'east' ? 'west' : 'east';
      if (opp !== side) continue;
      const offset = side === 'north' || side === 'south' ? p.x - room.x : p.z - room.z;
      out.push({ at: along(offset), w: d.w, y: 0, h: d.h, arch: d.arch });
    }
  }
  return out;
}

/** A hole's outline: a rectangle, or a pointed (cusped) arch for jaalis and archways. */
function hole(o: Opening): THREE.Path {
  const p = new THREE.Path(), x0 = o.at - o.w / 2, x1 = o.at + o.w / 2, y0 = Math.max(0.001, o.y), y1 = o.y + o.h;
  if (!o.arch) { p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.closePath(); return p; }
  const spring = y1 - o.w * 0.45;
  p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, spring);
  p.quadraticCurveTo(x1, spring + o.w * 0.32, o.at, y1);
  p.quadraticCurveTo(x0, spring + o.w * 0.32, x0, spring);
  p.closePath();
  return p;
}

/** A wall as seen from inside, cut for its openings, placed on the room's edge facing in. */
function wall(room: Room, side: WallSide): THREE.Mesh {
  const len = side === 'north' || side === 'south' ? room.w : room.d;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.lineTo(len, 0); shape.lineTo(len, room.h); shape.lineTo(0, room.h); shape.closePath();
  for (const o of openings(room, side)) shape.holes.push(hole(o));
  const m = new THREE.Mesh(new THREE.ShapeGeometry(shape, 8), surface(room.walls, 1, 1));
  const hw = room.w / 2 - WALL_INSET_U, hd = room.d / 2 - WALL_INSET_U;
  // Each wall's local +X runs along it left to right as seen from inside, +Y up, +Z into the room.
  if (side === 'north') { m.position.set(room.x - hw, room.y, room.z - hd); }
  if (side === 'south') { m.position.set(room.x + hw, room.y, room.z + hd); m.rotation.y = Math.PI; }
  if (side === 'east') { m.position.set(room.x + hw, room.y, room.z - hd); m.rotation.y = -Math.PI / 2; }
  if (side === 'west') { m.position.set(room.x - hw, room.y, room.z + hd); m.rotation.y = Math.PI / 2; }
  m.receiveShadow = m.castShadow = true;
  // Walls stop light from either side: a moonbeam must not run on through the wall behind it.
  (m.material as THREE.Material).shadowSide = THREE.DoubleSide;
  m.userData.occluder = true;
  return m;
}

/** A jaali's stone screen in an opening: the lattice cut out of sandstone. */
function jaaliPane(room: Room, side: WallSide, at: number, y: number, w: number, h: number): THREE.Mesh {
  const tex = jaaliPattern().clone();
  tex.repeat.set(w / 0.5, h / 0.5); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.needsUpdate = true;
  const mat = surface('sandstone', w, h);
  mat.alphaMap = tex; mat.alphaTest = 0.5; mat.side = THREE.DoubleSide;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  const p = wallPoint(room, side, at, y + h / 2);
  m.position.copy(p);
  m.rotation.y = side === 'north' ? 0 : side === 'south' ? Math.PI : side === 'east' ? -Math.PI / 2 : Math.PI / 2;
  m.castShadow = true; m.receiveShadow = true;
  m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaMap: tex, alphaTest: 0.5 });
  return m;
}

/** A point on a wall's plane: `at` along it from the wall's middle (room coordinates), at height y. */
function wallPoint(room: Room, side: WallSide, at: number, yIn: number): THREE.Vector3 {
  const y = room.y + yIn;
  if (side === 'north') return new THREE.Vector3(room.x + at, y, room.z - room.d / 2);
  if (side === 'south') return new THREE.Vector3(room.x + at, y, room.z + room.d / 2);
  if (side === 'east') return new THREE.Vector3(room.x + room.w / 2, y, room.z + at);
  return new THREE.Vector3(room.x - room.w / 2, y, room.z + at);
}

/** The moon through one jaali: a spotlight that projects the lattice, and a faint shaft in the haze. */
function moonThrough(room: Room, side: WallSide, at: number, y: number, w: number, h: number, dir: THREE.Vector3, rooms: Room[]): THREE.Object3D | null {
  if (NORMAL[side].dot(dir) <= 0.05) return null;
  const centre = wallPoint(room, side, at, y + h / 2);
  // The rest of the palace may stand between this jaali and the moon (a taller room next door): then no moon.
  for (let t = 0.3; t < 30; t += 0.25) {
    const p = centre.clone().addScaledVector(dir, t);
    if (rooms.some((r) => r.id !== room.id && p.y > r.y && p.y < r.y + r.h && Math.abs(p.x - r.x) < r.w / 2 && Math.abs(p.z - r.z) < r.d / 2)) return null;
  }
  const g = new THREE.Group();
  // Where the ray through the jaali's middle meets the floor or leaves the room, whichever comes first: the shaft
  // ends there, so it never shows through a wall into the room beyond.
  let t = 0.1;
  for (const p = new THREE.Vector3(); t < 40; t += 0.05) {
    p.copy(centre).addScaledVector(dir, -t);
    if (p.y <= room.y || Math.abs(p.x - room.x) > room.w / 2 || Math.abs(p.z - room.z) > room.d / 2) break;
  }
  const target = centre.clone().addScaledVector(dir, -t);
  const light = new THREE.SpotLight(token('--moon'), LOOK.MOON_LIGHT, 0, Math.atan2(Math.max(w, h) * 0.75, 7), 0.15, 0);
  light.position.copy(centre).addScaledVector(dir, 7);
  light.target.position.copy(target);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.bias = -0.0004;
  light.shadow.normalBias = 0.02;
  light.shadow.camera.near = 1;
  // Far enough to cover the whole wing: past the far plane a surface counts as unshadowed, and would be lit through walls.
  light.shadow.camera.far = 60;
  g.add(light, light.target);
  // The shaft: a long thin box from the jaali along the ray, additive, barely there.
  const len = t;
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, h * 0.9, len), new THREE.MeshBasicMaterial({ color: token('--moon'), transparent: true, opacity: LOOK.MOON_SHAFT, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  shaft.position.copy(centre).addScaledVector(dir, -len / 2);
  shaft.lookAt(centre);
  shaft.userData.noPick = true;
  g.add(shaft);
  return g;
}

/** A flame's pool of amber: a point light and a small unlit glow. */
function flame(x: number, y: number, z: number, kind: string, shadow: boolean): { group: THREE.Group; light: THREE.PointLight } {
  const g = new THREE.Group();
  const light = new THREE.PointLight(token('--flame'), LOOK.FLAME_LIGHT, LOOK.FLAME_REACH_U, 1.6);
  light.position.set(x, y + 0.12, z);
  light.castShadow = shadow;
  light.shadow.mapSize.set(256, 256);
  light.shadow.camera.near = 0.1;
  light.shadow.normalBias = 0.03;
  const glow = new THREE.Mesh(new THREE.SphereGeometry(kind === 'hanging' ? 0.05 : 0.025, 8, 6), new THREE.MeshBasicMaterial({ color: token('--flame'), toneMapped: false }));
  glow.position.set(x, y + 0.05, z);
  glow.userData.noPick = true;
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.03, 10), new THREE.MeshStandardMaterial({ color: token('--brass'), roughness: 0.4, metalness: 0.5 }));
  dish.position.set(x, y, z);
  g.add(light, glow, dish);
  return { group: g, light };
}

/** Sky, moon and the jungle around the palace: what every jaali looks out on. */
function outside(n: number, dir: THREE.Vector3): THREE.Group {
  const g = new THREE.Group();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(150, 24, 12), new THREE.MeshBasicMaterial({ color: token('--night-sky'), side: THREE.BackSide, fog: false }));
  g.add(sky);
  // Stars, a few hundred, faint.
  const rnd = mulberry(7), pts: number[] = [];
  for (let i = 0; i < 500; i++) { const a = rnd() * Math.PI * 2, e = Math.asin(0.05 + rnd() * 0.95); pts.push(Math.cos(a) * Math.cos(e) * 140, Math.sin(e) * 140, Math.sin(a) * Math.cos(e) * 140); }
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)), new THREE.PointsMaterial({ color: token('--moon'), size: 0.6, sizeAttenuation: true, fog: false, transparent: true, opacity: 0.7 }));
  g.add(stars);
  // The moon: a disc drawn at its fullness, with the dark limb faintly showing.
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d')!, full = nightOf(n).moon;
  x.fillStyle = 'rgba(185,205,242,0.08)'; x.beginPath(); x.arc(64, 64, 60, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#eef3ff'; x.beginPath(); x.arc(64, 64, 60, -Math.PI / 2, Math.PI / 2);
  x.ellipse(64, 64, Math.abs(1 - 2 * full) * 60, 60, 0, Math.PI / 2, -Math.PI / 2, full > 0.5); x.fill();
  const moonTex = new THREE.CanvasTexture(c); moonTex.colorSpace = THREE.SRGBColorSpace;
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, fog: false, toneMapped: false }));
  moon.position.copy(dir).multiplyScalar(120); moon.scale.setScalar(9);
  g.add(moon);
  // The jungle: a ring of black-green canopy below the ridge, its top edge silvered.
  const t = document.createElement('canvas'); t.width = 1024; t.height = 128;
  const tg = t.getContext('2d')!;
  tg.fillStyle = '#' + token('--jungle').toString(16).padStart(6, '0');
  tg.beginPath(); tg.moveTo(0, 128);
  for (let i = 0; i <= 1024; i += 8) tg.lineTo(i, 40 + Math.sin(i * 0.05) * 8 + rnd() * 26);
  tg.lineTo(1024, 128); tg.closePath(); tg.fill();
  tg.globalCompositeOperation = 'source-atop'; tg.strokeStyle = 'rgba(185,205,242,0.35)'; tg.lineWidth = 3; tg.stroke();
  const ringTex = new THREE.CanvasTexture(t); ringTex.wrapS = THREE.RepeatWrapping; ringTex.repeat.x = 6; ringTex.colorSpace = THREE.SRGBColorSpace;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(90, 90, 40, 48, 1, true), new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.BackSide, transparent: true, fog: false }));
  ring.position.y = -14;
  g.add(ring);
  g.traverse((o) => { o.userData.noPick = true; });
  return g;
}

export type Wing = ReturnType<typeof buildWing>;

export function buildWing(n: number) {
  const mixers: Instance[] = [];
  /** Lamps and props that are there only while a condition holds (the dynamo's bulbs, a lit chandelier). */
  const shown: { obj: THREE.Object3D; cond: Cond[] }[] = [];
  const root = new THREE.Group();
  const dir = moonDir(n);
  const pickables: THREE.Object3D[] = [];
  const flames: THREE.PointLight[] = [];
  root.add(outside(n, dir));

  for (const room of roomsOf(n)) {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(room.w, room.d), surface(room.floor, room.w, room.d));
    floor.rotation.x = -Math.PI / 2; floor.position.set(room.x, room.y, room.z); floor.receiveShadow = floor.castShadow = true;
    // The floor ends a moonbeam: light that reaches it goes no further.
    (floor.material as THREE.Material).shadowSide = THREE.DoubleSide;
    floor.userData.occluder = true;
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(room.w, room.d), surface(room.walls, room.w, room.d));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(room.x, room.y + room.h, room.z); ceil.receiveShadow = true; ceil.castShadow = true;
    (ceil.material as THREE.Material).shadowSide = THREE.DoubleSide;
    (ceil.material as THREE.MeshStandardMaterial).color.multiplyScalar(0.6);
    root.add(floor);
    if (!room.open) root.add(ceil);
    for (const side of ['north', 'south', 'east', 'west'] as WallSide[]) root.add(wall(room, side));
    for (const c of room.children) {
      if (c.word === 'jaali' || c.word === 'transom') {
        root.add(jaaliPane(room, c.wall, c.at, c.y, c.w, c.h));
        if (c.word === 'jaali' && c.moon) { const m = moonThrough(room, c.wall, c.at, c.y, c.w, c.h, dir, roomsOf(n)); if (m) root.add(m); }
      }
      if (c.word === 'prop') { const p = place(c.model); p.root.position.set(room.x + c.at[0], room.y + c.y, room.z + c.at[1]); p.root.rotation.y = -c.turn * D2R; root.add(p.root); mixers.push(p); if (c.if.length) shown.push({ obj: p.root, cond: c.if }); }
      if (c.word === 'lamp') {
        const f = flame(room.x + c.at[0], room.y + c.y, room.z + c.at[1], c.kind, c.kind !== 'bulb');
        if (c.kind === 'bulb') { f.light.color.setHex(token('--dynamo')); f.light.intensity = LOOK.BULB_LIGHT; f.light.distance = LOOK.BULB_REACH_U; (f.group.children[1] as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: token('--dynamo'), toneMapped: false }); }
        root.add(f.group); flames.push(f.light);
        if (c.if.length) shown.push({ obj: f.group, cond: c.if });
      }
    }
  }

  // Doors: a teak leaf hinged at one side; an archway has none.
  const leaves = new Map<string, { pivot: THREE.Group; open: number }>();
  for (const d of doorsOf(n)) {
    if (d.arch) continue;
    root.add(doorLeaf(d, leaves));
  }

  // Spots: their models at their current pose, and an invisible ball the eye can pick.
  const spots = new Map<string, { inst: Instance | null; proxy: THREE.Mesh; at: THREE.Vector3; turn: number }>();
  for (const room of roomsOf(n)) for (const sp of spotsIn(room.id)) {
    const inst = sp.model ? place(sp.model) : null;
    if (inst) { root.add(inst.root); mixers.push(inst); }
    const proxy = new THREE.Mesh(new THREE.SphereGeometry(sp.r, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    proxy.userData.spot = sp.id;
    root.add(proxy);
    pickables.push(proxy);
    spots.set(sp.id, { inst, proxy, at: new THREE.Vector3(room.x + sp.at[0], room.y, room.z + sp.at[1]), turn: sp.turn });
  }

  // Bhima, with his lantern: its light casts shadows, so it shows under a closed door and not through a wall.
  const watchmen = new Map<string, { inst: Instance; lantern: THREE.PointLight }>();
  for (const p of Object.values(C.patrol).filter((x) => x.night === n)) {
    const inst = place(p.who);
    const lantern = new THREE.PointLight(token('--flame'), LOOK.LANTERN_LIGHT, LOOK.LANTERN_REACH_U, 1.4);
    lantern.position.set(0.35, 0.75, -0.25);
    lantern.castShadow = true; lantern.shadow.mapSize.set(512, 512); lantern.shadow.camera.near = 0.05; lantern.shadow.bias = -0.002; lantern.shadow.normalBias = 0.03;
    inst.root.add(lantern);
    root.add(inst.root);
    mixers.push(inst);
    watchmen.set(p.id, { inst, lantern });
    flames.push(lantern);
  }

  const occluders: THREE.Object3D[] = [];
  root.traverse((o) => { if (o.userData.occluder) occluders.push(o); });
  const base = flames.map((f) => f.intensity);
  let t = 0;

  /** The floor's height under a point (a stepwell's landings, a roof). */
  const floorAt = (x: number, z: number) => { const id = roomAt(n, x, z); return id ? get('room', id).y : 0; };

  return {
    root, pickables, occluders, floorAt,
    /** Match the wing to the state: doors, poses, the watchmen. */
    sync(s: GameState) {
      const nr = s.night;
      for (const [id, leaf] of leaves) leaf.open = nr?.doors.includes(id) ? 1 : 0;
      for (const [id, sp] of spots) {
        const def = get('spot', id), p = spotPose(s, def), room = get('room', def.room);
        sp.at.set(room.x + p.at[0], room.y, room.z + p.at[1]); sp.turn = p.turn;
        sp.proxy.position.set(sp.at.x, room.y + p.y, sp.at.z);
      }
      for (const [id, m] of watchmen) {
        const w = nr?.watch.find((x) => x.id === id);
        m.inst.root.visible = m.lantern.visible = !!w;
        if (!w) continue;
        m.inst.root.position.set(w.x, floorAt(w.x, w.z), w.z);
        m.inst.root.rotation.y = -w.face;
      }
      for (const x of shown) x.obj.visible = holds(s, x.cond);
    },
    /** Animate: doors swing towards open or shut, the trunk slides to its pose, flames flicker. */
    tick(dtS: number) {
      t += dtS;
      let busy = false;
      for (const leaf of leaves.values()) {
        const target = leaf.open * 1.75, cur = leaf.pivot.rotation.y;
        if (Math.abs(target - cur) > 0.002) { leaf.pivot.rotation.y = cur + Math.sign(target - cur) * Math.min(Math.abs(target - cur), dtS * 2.2); busy = true; }
      }
      for (const sp of spots.values()) {
        if (!sp.inst) continue;
        const r = sp.inst.root, d = sp.at.clone().sub(r.position), dist = d.length();
        if (dist > 0.002 && r.userData.placed) { r.position.addScaledVector(d, Math.min(1, (dtS * 1.2) / dist)); busy = true; }
        else r.position.copy(sp.at);
        r.userData.placed = true;
        r.rotation.y = -sp.turn * D2R;
      }
      flames.forEach((f, i) => { f.intensity = base[i]! * (1 - LOOK.FLICKER * 0.5 + LOOK.FLICKER * (0.5 * Math.sin(t * 13 + i * 3) + 0.3 * Math.sin(t * 29 + i) + 0.2 * Math.sin(t * 7.3 + i * 5)) * 0.5 + LOOK.FLICKER * 0.25); });
      for (const m of mixers) m.mixer?.update(dtS);
      return busy;
    },
  };

  function doorLeaf(d: Door, out: Map<string, { pivot: THREE.Group; open: number }>) {
    // Hinged at one edge, swinging into the `to` room. The pivot sits on the hinge facing along the wall; the swing
    // group turns about it.
    const p = doorPlace(d), leafH = d.h - 0.03;
    const pivot = new THREE.Group(), swing = new THREE.Group();
    const board = new THREE.Mesh(new THREE.BoxGeometry(d.w, leafH, 0.06), new THREE.MeshStandardMaterial({ color: token('--teak'), roughness: 0.7 }));
    board.position.set(d.w / 2, leafH / 2 + 0.03, 0);
    board.castShadow = board.receiveShadow = true;
    board.userData.occluder = true;
    const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.04), new THREE.MeshStandardMaterial({ color: token('--brass'), metalness: 0.6, roughness: 0.35 }));
    bolt.position.set(d.w - 0.12, 1.1, 0.05);
    swing.add(board, bolt);
    pivot.add(swing);
    const fy = get('room', d.from).y;
    if (d.wall === 'north') pivot.position.set(p.x - d.w / 2, fy, p.z);
    if (d.wall === 'south') { pivot.position.set(p.x + d.w / 2, fy, p.z); pivot.rotation.y = Math.PI; }
    if (d.wall === 'east') { pivot.position.set(p.x, fy, p.z - d.w / 2); pivot.rotation.y = -Math.PI / 2; }
    if (d.wall === 'west') { pivot.position.set(p.x, fy, p.z + d.w / 2); pivot.rotation.y = Math.PI / 2; }
    out.set(d.id, { pivot: swing, open: 0 });
    return pivot;
  }
}
