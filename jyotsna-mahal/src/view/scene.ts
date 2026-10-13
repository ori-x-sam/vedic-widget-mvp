// The 3D view: one Three scene under the Pixi canvas, showing whatever the state is in: a day scene's set (jeep,
// verandah) with its people, or a night's wing, seen through Thistlewood's eyes with his hands at the bottom of the
// frame. It reconciles against the game state every frame and decides nothing: where the eye looks comes from the
// input module's scratch, hues from the palette (tokens.ts), light and feel from the look tokens (look.ts).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { C, get, nightOf } from '../content';
import { holds, type GameState } from '../game';
import { token } from '../tokens';
import { LOOK, SUN_DIR_XYZ } from './look';
import { place, type Instance } from './models';
import { createPost } from './post';
import { QUALITY } from './quality';
import { buildSet, type Set } from './sets';
import { buildWing, type Wing } from './wing';

export type Scene = ReturnType<typeof createScene>;
/** Where the eye looks: written by the input module (yaw rad, 0 north; pitch rad, up positive) and by stories. */
export type Look = { yaw: number; pitch: number; walked: number; zoom: number };

const D2R = Math.PI / 180;

export function createScene(el: HTMLElement, w: number, h: number, look: Look) {
  // Antialiasing is the post chain's multisampled target (view/post.ts), not the canvas's.
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0' });
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(LOOK.CAMERA_FOV_DEG, w / h, 0.05, 500);
  scene.add(camera);
  const post = createPost(renderer, scene, camera, w, h);
  // Soft light from all round for the day's sets (the sky's bounce); nights have none, only their own lamps.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const daylight = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  let t = 0;

  // His hands: the candle stub in the left, the camera in the right; the candle's light goes where he goes.
  const hands = place('hands');
  // The hands model is built around the eye (models/hands.py): its origin is the camera.
  hands.root.position.set(0, 0, 0);
  hands.root.traverse((o) => { o.castShadow = false; o.userData.noPick = true; });
  camera.add(hands.root);
  const candle = new THREE.PointLight(token('--flame'), LOOK.CANDLE_LIGHT, LOOK.CANDLE_REACH_U, 1.5);
  candle.position.set(-0.22, -0.18, -0.45);
  camera.add(candle);
  // The flash: a white sheet in front of the eye, and a burst of light.
  const flashSheet = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false, toneMapped: false }));
  flashSheet.position.z = -0.2; flashSheet.renderOrder = 999;
  camera.add(flashSheet);
  const flashLight = new THREE.PointLight(0xffffff, 0, 12, 1.2);
  camera.add(flashLight);
  let flashT = 0;

  const hemi = new THREE.HemisphereLight(token('--moon'), token('--shadow'), LOOK.FILL_LIGHT);
  const sun = new THREE.DirectionalLight(token('--sun'), LOOK.SUN_LIGHT);
  sun.castShadow = true; sun.shadow.mapSize.set(QUALITY.sunMap, QUALITY.sunMap);
  sun.shadow.radius = 3; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 120 });
  scene.add(hemi, sun, sun.target);

  let showing = '';
  let set: Set | null = null, wing: Wing | null = null, world: THREE.Group | null = null;
  let people: { inst: Instance; who: string }[] = [];
  let props: { inst: Instance; cond: Parameters<typeof holds>[1] }[] = [];
  let eye = { x: 0, y: LOOK.EYE_HEIGHT_U, z: 0, turn: 0 };
  let moving = false;

  /** What the state shows: a place's set, or a night's wing. */
  function want(s: GameState): { key: string; set: string; light: 'day' | 'dusk' | 'night'; place: string | null } {
    const sc = s.talk ? get('scene', s.talk.scene) : null, pl = sc ? get('place', sc.place) : null;
    if (pl && pl.set !== 'wing') return { key: `place:${pl.id}`, set: pl.set, light: pl.light, place: pl.id };
    const n = s.night?.n ?? s.day;
    return { key: `wing:${n}:${pl?.light ?? 'night'}`, set: 'wing', light: pl?.light ?? 'night', place: pl?.id ?? null };
  }

  function build(s: GameState) {
    const wnt = want(s);
    if (wnt.key === showing) return;
    showing = wnt.key;
    if (world) scene.remove(world);
    world = new THREE.Group(); set = null; wing = null; people = []; props = [];
    if (wnt.set === 'wing') { wing = buildWing(s.night?.n ?? s.day); world.add(wing.root); }
    else { set = buildSet(wnt.set); world.add(set.root); }
    if (wnt.place) for (const c of get('place', wnt.place).children) {
      if (c.word === 'eye') eye = { x: c.at[0], y: c.y, z: c.at[1], turn: c.turn };
      if (c.word === 'sits' && C.model[c.model]) { const p = place(c.model); p.root.position.set(c.at[0], c.y, c.at[1]); p.root.rotation.y = -c.turn * D2R; world.add(p.root); people.push({ inst: p, who: c.who }); }
      if (c.word === 'prop') { const p = place(c.model); p.root.position.set(c.at[0], c.y, c.at[1]); p.root.rotation.y = -c.turn * D2R; world.add(p.root); props.push({ inst: p, cond: c.if }); }
    }
    scene.add(world);
    // Light.
    const night = wnt.light === 'night';
    renderer.toneMappingExposure = night ? LOOK.EXPOSURE : wnt.light === 'dusk' ? LOOK.DUSK_EXPOSURE : LOOK.DAY_EXPOSURE;
    hemi.color.setHex(token(night ? '--moon' : wnt.light === 'dusk' ? '--dusk-sky' : '--day-sky'));
    hemi.groundColor.setHex(token(night ? '--shadow' : '--sandstone-dark'));
    const dark = night && s.night ? 1 - Math.min(...Object.values(C.room).filter((r) => r.night === s.night!.n).map((r) => r.dark)) : 0;
    hemi.intensity = night ? LOOK.FILL_LIGHT * (0.4 + dark) : wnt.set === 'wing' ? LOOK.SUN_LIGHT * 0.6 : LOOK.FILL_LIGHT * 1.2;
    sun.visible = !night && wnt.set !== 'wing';
    sun.intensity = wnt.light === 'dusk' ? LOOK.DUSK_LIGHT : LOOK.SUN_LIGHT;
    sun.color.setHex(token(wnt.light === 'dusk' ? '--dusk-sun' : '--sun'));
    if (wnt.light === 'dusk') sun.position.set(-8, 3, -10); else sun.position.set(...SUN_DIR_XYZ);
    scene.fog = night ? new THREE.FogExp2(token('--shadow'), LOOK.HAZE) : new THREE.FogExp2(token(wnt.light === 'dusk' ? '--dusk-sky' : '--day-haze'), wnt.set === 'wing' ? 0 : 0.006);
    scene.background = new THREE.Color(token(night ? '--night-sky' : '--day-sky'));
    scene.environment = night ? null : daylight;
    if (night) post.bloom(LOOK.BLOOM, LOOK.BLOOM_THRESHOLD); else post.bloom(LOOK.BLOOM * 0.4, LOOK.BLOOM_THRESHOLD * 4);
    scene.environmentIntensity = wnt.light === 'dusk' ? 0.25 : 0.45;
    set?.light?.(sun.position.clone().normalize());
    const dome = set?.root.getObjectByName('sky');
    if (dome) dome.visible = !night;
  }

  /** Put the eye where he stands and turn it where he looks (render and pick both start here). */
  function aimCamera() {
    const bob = Math.sin(look.walked * Math.PI * LOOK.BOB_HZ) * LOOK.BOB_U;
    camera.position.set(eye.x, eye.y + bob, eye.z);
    camera.rotation.set(0, 0, 0);
    camera.rotateY(-(eye.turn * D2R + look.yaw));
    camera.rotateX(look.pitch);
    const fov = LOOK.CAMERA_FOV_DEG / (1 + look.zoom);
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld();
  }

  /** Does the scene under way put the eye somewhere of its own (a place with an `eye`)? */
  const wantsEye = (s: GameState) => { const sc = s.talk && get('scene', s.talk.scene); return !!sc && get('place', sc.place).children.some((c) => c.word === 'eye'); };

  return {
    camera, renderer,
    /** Match the view to the state (cheap when nothing changed). */
    sync(s: GameState) {
      build(s);
      wing?.sync(s);
      for (const p of props) p.inst.root.visible = holds(s, p.cond);
      const pl = s.talk ? get('place', get('scene', s.talk.scene).place) : null;
      moving = !!pl?.moving && !s.flags.includes('doe-showing');
      candle.visible = !!s.night?.candle && s.phase === 'night';
      const flame = hands.root.getObjectByName('flame');
      if (flame) flame.visible = candle.visible;
      hands.root.visible = !s.talk;
      if (s.night && (!s.talk || !wantsEye(s))) eye = { x: s.night.x, y: (wing?.floorAt(s.night.x, s.night.z) ?? 0) + LOOK.EYE_HEIGHT_U, z: s.night.z, turn: 0 };
    },
    /** The spot under the eye and in reach: its mote brightens and rings. */
    mark(id: string | null) { wing?.mark(id); wing?.eyeAt(camera.position); },
    /** A flash: the camera's magnesium, for a moment. */
    flash() { flashT = LOOK.FLASH_S; },
    /** Animate the world (doors, poses, flames, the rolling jungle, the flash); true while a tween runs. */
    tick(dtS: number): boolean {
      t += dtS;
      const busy = wing?.tick(dtS) ?? false;
      set?.tick(dtS, moving);
      for (const p of people) p.inst.mixer?.update(dtS);
      if (flashT > 0) { flashT = Math.max(0, flashT - dtS); }
      const f = flashT / LOOK.FLASH_S;
      (flashSheet.material as THREE.MeshBasicMaterial).opacity = f * 0.85;
      flashLight.intensity = f * 40;
      return busy || flashT > 0;
    },
    /** The spot under the middle of the eye, if one is in reach and no wall is in the way. */
    pick(maxU = 3.2): string | null { return this.under(maxU).spot?.id ?? null; },
    /** What is under the middle of the eye, in reach, before any wall: the first spot, and a door's leaf (with how far
        each is), since a door's own lock usually sits right in front of its leaf. */
    under(maxU = 3.2): { spot: { id: string; d: number } | null; door: { id: string; d: number } | null } {
      const out: ReturnType<Scene['under']> = { spot: null, door: null };
      if (!wing) return out;
      aimCamera();
      const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(0, 0), camera); ray.far = maxU;
      for (const h of ray.intersectObjects([...wing.pickables, ...wing.occluders], false)) {
        const u = h.object.userData;
        if (u.spot) { out.spot ??= { id: u.spot as string, d: h.distance }; continue; }
        // An open doorway lets the eye through to what is beyond it; a door's leaf, like a wall, stops it.
        if (u.door) { out.door ??= { id: u.door as string, d: h.distance }; if (u.doorway) continue; break; }
        break;
      }
      return out;
    },
    render() {
      aimCamera();
      post.render(t);
    },
    resize(cw: number, ch: number) {
      renderer.setSize(cw, ch);
      post.resize(cw, ch);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
    },
    /** For stories: the night under view. */
    showingKey: () => showing,
  };
}

export const nightName = (n: number) => nightOf(n).name;
