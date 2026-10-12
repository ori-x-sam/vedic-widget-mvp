// Surface words: what a room's `floor=` and `walls=` name (marble, sandstone, plaster, brick, teak). Each is a small
// procedural texture painted on a canvas from palette tokens, so the designer recolours stone in shared.css. The jaali
// is here too: one pierced-lattice pattern, used as the stone screen's cut-outs and as the moonlight's projected shadow.
// Catalog: ## Surfaces.
import * as THREE from 'three';
import { token } from '../tokens';
import { mulberry } from './noise';

const SIZE_PX = 256;
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;
const mix = (a: number, b: number, t: number) => {
  const ch = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

function canvas(paint: (g: CanvasRenderingContext2D, rnd: () => number) => void, seed: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = SIZE_PX;
  const g = c.getContext('2d')!;
  paint(g, mulberry(seed));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Speckle and blotch: the grain every stone shares. */
function grain(g: CanvasRenderingContext2D, rnd: () => number, base: number, dark: number, n: number, max: number) {
  g.fillStyle = hex(base); g.fillRect(0, 0, SIZE_PX, SIZE_PX);
  for (let i = 0; i < n; i++) {
    g.fillStyle = hex(mix(base, dark, rnd() * 0.5));
    g.globalAlpha = 0.08 + rnd() * 0.14;
    const r = 1 + rnd() * max;
    g.beginPath(); g.arc(rnd() * SIZE_PX, rnd() * SIZE_PX, r, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
}

type Surface = { map: THREE.Texture; roughness: number; repeatU: number };

/** Each surface word: its texture, how rough it is, and how many metres one tile of it covers. */
const SURFACES: Record<string, () => Surface> = {
  /** White marble with grey veins and inlaid flagstone joints. */
  marble: () => ({ roughness: 0.28, repeatU: 1.2, map: canvas((g, rnd) => {
    grain(g, rnd, token('--marble'), token('--marble-vein'), 260, 10);
    g.strokeStyle = hex(token('--marble-vein')); g.lineWidth = 1.2;
    for (let v = 0; v < 5; v++) {
      g.globalAlpha = 0.18 + rnd() * 0.2; g.beginPath();
      let x = rnd() * SIZE_PX, y = 0; g.moveTo(x, y);
      while (y < SIZE_PX) { x += (rnd() - 0.5) * 40; y += 12 + rnd() * 20; g.lineTo(x, y); }
      g.stroke();
    }
    g.globalAlpha = 0.5; g.strokeStyle = hex(mix(token('--marble-vein'), 0, 0.3)); g.lineWidth = 2;
    g.strokeRect(0, 0, SIZE_PX, SIZE_PX); g.globalAlpha = 1;
  }, 11) }),
  /** Pink sandstone in courses, a little weathered. */
  sandstone: () => ({ roughness: 0.85, repeatU: 1.6, map: canvas((g, rnd) => {
    grain(g, rnd, token('--sandstone'), token('--sandstone-dark'), 900, 6);
    g.strokeStyle = hex(token('--sandstone-dark')); g.globalAlpha = 0.45; g.lineWidth = 2;
    for (let row = 0; row < 4; row++) {
      const y = (row * SIZE_PX) / 4; g.beginPath(); g.moveTo(0, y); g.lineTo(SIZE_PX, y); g.stroke();
      const off = row % 2 ? SIZE_PX / 4 : 0;
      for (let x = off; x < SIZE_PX; x += SIZE_PX / 2) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + SIZE_PX / 4); g.stroke(); }
    }
    g.globalAlpha = 1;
  }, 23) }),
  /** Lime plaster gone soft with age, with damp stains low down. */
  plaster: () => ({ roughness: 0.92, repeatU: 2.4, map: canvas((g, rnd) => {
    grain(g, rnd, token('--plaster'), token('--sandstone-dark'), 500, 18);
    const damp = g.createLinearGradient(0, SIZE_PX * 0.6, 0, SIZE_PX);
    damp.addColorStop(0, 'rgba(0,0,0,0)'); damp.addColorStop(1, 'rgba(40,30,20,0.12)');
    g.fillStyle = damp; g.fillRect(0, 0, SIZE_PX, SIZE_PX);
  }, 37) }),
  /** Old red brick laid flat: the storeroom floor. */
  brick: () => ({ roughness: 0.95, repeatU: 1.0, map: canvas((g, rnd) => {
    grain(g, rnd, token('--brick'), 0x000000, 400, 5);
    g.strokeStyle = hex(mix(token('--brick'), token('--plaster'), 0.4)); g.lineWidth = 3;
    for (let row = 0; row < 8; row++) {
      const y = (row * SIZE_PX) / 8; g.beginPath(); g.moveTo(0, y); g.lineTo(SIZE_PX, y); g.stroke();
      for (let x = row % 2 ? SIZE_PX / 8 : 0; x < SIZE_PX; x += SIZE_PX / 4) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + SIZE_PX / 8); g.stroke(); }
    }
  }, 41) }),
  /** Mirror mosaic: tiny convex mirrors set in white plaster, each catching a glint (the Sheesh Mahal). */
  mirror: () => ({ roughness: 0.18, repeatU: 0.8, map: canvas((g, rnd) => {
    grain(g, rnd, token('--plaster'), token('--sandstone-dark'), 120, 6);
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) {
      const x = (i + 0.5) * (SIZE_PX / 9), y = (j + 0.5) * (SIZE_PX / 9), r = SIZE_PX / 26;
      g.fillStyle = hex(mix(token('--mirror'), token('--moon'), rnd() * 0.6)); g.globalAlpha = 0.85;
      g.beginPath();
      for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4 + (i + j) * 0.2; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      g.closePath(); g.fill();
      g.fillStyle = '#ffffff'; g.globalAlpha = 0.5 * rnd(); g.fillRect(x - r * 0.3, y - r * 0.5, r * 0.25, r * 0.25);
    }
    g.globalAlpha = 1;
  }, 61) }),
  /** Edwardian wallpaper, a stripe of lilies, foxed and peeling off the sandstone (the Durbar Wing). */
  wallpaper: () => ({ roughness: 0.85, repeatU: 1.2, map: canvas((g, rnd) => {
    grain(g, rnd, token('--wallpaper'), token('--wallpaper-stripe'), 200, 10);
    g.fillStyle = hex(token('--wallpaper-stripe')); g.globalAlpha = 0.55;
    for (let x = 0; x < SIZE_PX; x += SIZE_PX / 4) g.fillRect(x, 0, SIZE_PX / 16, SIZE_PX);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.ellipse((i + 0.6) * SIZE_PX / 4, (j + 0.5) * SIZE_PX / 4, 7, 12, 0.3, 0, Math.PI * 2); g.fill(); }
    // Where it has peeled, the sandstone shows through.
    g.globalAlpha = 1; g.fillStyle = hex(token('--sandstone'));
    g.beginPath(); g.moveTo(SIZE_PX * 0.7, SIZE_PX); g.lineTo(SIZE_PX * 0.82, SIZE_PX * 0.72); g.lineTo(SIZE_PX * 0.95, SIZE_PX * 0.78); g.lineTo(SIZE_PX, SIZE_PX); g.closePath(); g.fill();
  }, 71) }),
  /** Teak boards. */
  teak: () => ({ roughness: 0.7, repeatU: 1.4, map: canvas((g, rnd) => {
    grain(g, rnd, token('--teak'), token('--teak-dark'), 300, 3);
    g.strokeStyle = hex(token('--teak-dark')); g.globalAlpha = 0.6;
    for (let x = 0; x < SIZE_PX; x += SIZE_PX / 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, SIZE_PX); g.stroke(); }
    g.globalAlpha = 1;
  }, 53) }),
};

export const SURFACE_WORDS = Object.keys(SURFACES);
const made = new Map<string, Surface>();

/** A material for a surface word covering a `w` x `h` metre face. */
export function surface(word: string, w: number, h: number): THREE.MeshStandardMaterial {
  const make = SURFACES[word];
  if (!make) throw new Error(`surfaces: no surface "${word}" (known: ${SURFACE_WORDS.join(', ')})`);
  if (!made.has(word)) made.set(word, make());
  const s = made.get(word)!;
  const map = s.map.clone();
  map.repeat.set(w / s.repeatU, h / s.repeatU);
  map.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ map, roughness: s.roughness, metalness: 0 });
}

let jaali: THREE.CanvasTexture | null = null;
/** The jaali: an eight-pointed-star lattice. White is open stone, black is stone. */
export function jaaliPattern(): THREE.CanvasTexture {
  if (jaali) return jaali;
  jaali = canvas((g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, SIZE_PX, SIZE_PX);
    g.fillStyle = '#fff';
    const cell = SIZE_PX / 4;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const cx = i * cell + cell / 2, cy = j * cell + cell / 2;
      // An eight-pointed star cut from each cell, and a small diamond at each corner.
      g.beginPath();
      for (let k = 0; k < 16; k++) { const a = (k * Math.PI) / 8, r = k % 2 ? cell * 0.2 : cell * 0.4; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
      g.closePath(); g.fill();
      g.beginPath(); const d = cell * 0.09;
      g.moveTo(i * cell, j * cell - d); g.lineTo(i * cell + d, j * cell); g.lineTo(i * cell, j * cell + d); g.lineTo(i * cell - d, j * cell); g.closePath(); g.fill();
    }
  }, 1);
  jaali.colorSpace = THREE.NoColorSpace;
  return jaali;
}
