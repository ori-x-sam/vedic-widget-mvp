// The model loader: every models/<id>.glb (built from models/<id>.py by `npm run models`), tinted from the palette
// tokens content/models.kdl gives each of its four materials. Colour is value-painted into the vertices in Blender;
// the hue multiplies it here, so a designer recolours a model in shared.css. `glow` is unlit when its token is a light, else polished.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { C, get } from '../content';
import { token } from '../tokens';

const URLS = import.meta.glob<string>('../../models/*.glb', { query: '?url', import: 'default', eager: true });
const urlOf = (id: string) => URLS[`../../models/${id}.glb`];

type Loaded = { scene: THREE.Object3D; clips: THREE.AnimationClip[] };
const loaded = new Map<string, Loaded>();
/** The glow tokens that are lights (flames, bulbs, a cigar's end): unlit, and bright enough to bloom. */
const LIGHTS = new Set(['--flame', '--dynamo', '--cigar']);

/** The materials a model's surfaces are named for, and how each is drawn. */
function tinted(id: string, mat: THREE.Material): THREE.Material {
  const m = get('model', id), name = mat.name as 'body' | 'trim' | 'cloth' | 'glow';
  const tok = name === 'trim' ? m.trim : name === 'cloth' ? m.cloth : name === 'glow' ? m.glow : m.body;
  const colour = token(tok ?? m.body);
  if (name === 'glow' && LIGHTS.has(tok ?? '')) return new THREE.MeshBasicMaterial({ color: colour, vertexColors: false, toneMapped: false });
  // A glow that isn't a light (a mirror, silver, a glass eye, a jewel, zari): polished, and lit like everything else.
  if (name === 'glow') { const metal = tok === '--mirror' || tok === '--silver'; return new THREE.MeshStandardMaterial({ color: colour, roughness: metal ? 0.06 : 0.18, metalness: metal ? 1 : 0.4 }); }
  return new THREE.MeshStandardMaterial({ color: colour, vertexColors: true, roughness: name === 'trim' ? 0.55 : name === 'cloth' ? 0.95 : 0.7, metalness: name === 'trim' ? 0.2 : 0 });
}

/** Load every model the content names. Missing .glb files load as a labelled stand-in box (and a test fails). */
export async function loadModels(): Promise<void> {
  const loader = new GLTFLoader();
  await Promise.all(Object.keys(C.model).map(async (id) => {
    const url = urlOf(id);
    if (!url) { loaded.set(id, { scene: standIn(), clips: [] }); return; }
    try {
      const g = await loader.loadAsync(url);
      g.scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.material = Array.isArray(mesh.material) ? mesh.material.map((mm) => tinted(id, mm)) : tinted(id, mesh.material);
        mesh.castShadow = mesh.receiveShadow = true;
      });
      loaded.set(id, { scene: g.scene, clips: g.animations });
    } catch {
      loaded.set(id, { scene: standIn(), clips: [] });
    }
  }));
}

function standIn(): THREE.Object3D {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0xff00ff }));
  m.position.y = 0.25;
  return m;
}

export type Instance = { root: THREE.Object3D; mixer: THREE.AnimationMixer | null; play(clip: string): void };

/** A placed copy of a model, its `idle` clip playing. Blender +X forward becomes the content's heading 0 (north). */
export function place(id: string): Instance {
  const l = loaded.get(id);
  if (!l) throw new Error(`models: "${id}" isn't loaded (is it in content/models.kdl? did loadModels run?)`);
  const inner = l.scene.clone(true);
  // glTF is +Y up, +Z towards the viewer; Blender's +X forward arrives as glTF +X. Turn it to face -Z (north).
  inner.rotation.y = Math.PI / 2;
  inner.scale.setScalar(get('model', id).scale);
  const root = new THREE.Group();
  root.add(inner);
  const mixer = l.clips.length ? new THREE.AnimationMixer(inner) : null;
  const play = (name: string) => {
    if (!mixer) return;
    const clip = l.clips.find((c) => c.name === name);
    if (!clip) return;
    mixer.stopAllAction();
    mixer.clipAction(clip).play();
  };
  play('idle');
  return { root, mixer, play };
}

/** The clips a model has (for the rig test and stories). */
export const clipsOf = (id: string) => loaded.get(id)?.clips.map((c) => c.name) ?? [];
