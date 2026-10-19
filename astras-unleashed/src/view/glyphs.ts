// Attribute glyphs: each god's signature attribute as a bold, simple shape (Shiva's trident, Hanuman's mace, Rama's
// bow, Saraswati's veena...). They mark a god's placeholder card and its placeholder arena figure until the painted art
// arrives, so no two gods look alike, and they read at 28 px. content/cards.kdl names each god's `attribute=`.
import { Graphics } from 'pixi.js';

/** Draw `kind` centred on (cx, cy), about `s` px tall, in `c` with `ink` for details. */
type Glyph = (g: Graphics, cx: number, cy: number, s: number, c: number, ink: number) => void;

const line = (g: Graphics, pts: number[], w: number, c: number) => { g.moveTo(pts[0]!, pts[1]!); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i]!, pts[i + 1]!); g.stroke({ width: w, color: c, cap: 'round', join: 'round' }); };

export const GLYPHS: Record<string, Glyph> = {
  /** Ganesha: an elephant head, ears wide, trunk curling. */
  elephant: (g, x, y, s, c, ink) => {
    g.ellipse(x - s * 0.3, y - s * 0.05, s * 0.22, s * 0.28).ellipse(x + s * 0.3, y - s * 0.05, s * 0.22, s * 0.28).fill(c);
    g.circle(x, y - s * 0.1, s * 0.24).fill(c);
    g.moveTo(x - s * 0.07, y + s * 0.05).quadraticCurveTo(x - s * 0.1, y + s * 0.45, x + s * 0.12, y + s * 0.42).stroke({ width: s * 0.11, color: c, cap: 'round' });
    g.circle(x - s * 0.09, y - s * 0.14, s * 0.035).circle(x + s * 0.09, y - s * 0.14, s * 0.035).fill(ink);
    line(g, [x + s * 0.08, y + s * 0.05, x + s * 0.2, y + s * 0.12], s * 0.05, ink);
  },
  /** Hanuman: the gada, a mace with a round head on a long handle. */
  mace: (g, x, y, s, c, ink) => {
    line(g, [x - s * 0.25, y + s * 0.45, x + s * 0.08, y - s * 0.05], s * 0.08, c);
    g.circle(x + s * 0.14, y - s * 0.15, s * 0.22).fill(c);
    g.circle(x + s * 0.14, y - s * 0.15, s * 0.22).stroke({ width: s * 0.03, color: ink });
    g.circle(x + s * 0.14, y - s * 0.4, s * 0.05).fill(c);
  },
  /** Narasimha: the pillar he bursts from, cracked open. */
  pillar: (g, x, y, s, c, ink) => {
    g.rect(x - s * 0.18, y - s * 0.4, s * 0.36, s * 0.8).fill(c);
    g.rect(x - s * 0.26, y - s * 0.48, s * 0.52, s * 0.1).rect(x - s * 0.26, y + s * 0.38, s * 0.52, s * 0.1).fill(c);
    line(g, [x - s * 0.05, y - s * 0.38, x + s * 0.06, y - s * 0.1, x - s * 0.04, y + s * 0.08, x + s * 0.05, y + s * 0.36], s * 0.05, ink);
  },
  /** Vishnu: the Sudarshana chakra, a spinning disc with spokes and flames. */
  chakra: (g, x, y, s, c, ink) => {
    for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; g.moveTo(x + Math.cos(a) * s * 0.36, y + Math.sin(a) * s * 0.36).lineTo(x + Math.cos(a + 0.2) * s * 0.5, y + Math.sin(a + 0.2) * s * 0.5).lineTo(x + Math.cos(a + 0.35) * s * 0.36, y + Math.sin(a + 0.35) * s * 0.36).fill(c); }
    g.circle(x, y, s * 0.36).fill(c).circle(x, y, s * 0.24).fill(ink).circle(x, y, s * 0.18).fill(c);
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; line(g, [x, y, x + Math.cos(a) * s * 0.18, y + Math.sin(a) * s * 0.18], s * 0.03, ink); }
  },
  /** Kartikeya/Murugan: the Vel, a spear with a broad leaf-shaped head. */
  vel: (g, x, y, s, c) => {
    line(g, [x, y + s * 0.5, x, y - s * 0.1], s * 0.07, c);
    g.moveTo(x, y - s * 0.5).bezierCurveTo(x + s * 0.25, y - s * 0.25, x + s * 0.18, y - s * 0.05, x, y - s * 0.05).bezierCurveTo(x - s * 0.18, y - s * 0.05, x - s * 0.25, y - s * 0.25, x, y - s * 0.5).fill(c);
  },
  /** Kali: the khadga, a curved sword. */
  khadga: (g, x, y, s, c) => {
    g.moveTo(x - s * 0.15, y + s * 0.3).quadraticCurveTo(x - s * 0.05, y - s * 0.2, x + s * 0.3, y - s * 0.45).quadraticCurveTo(x + s * 0.12, y - s * 0.05, x - s * 0.05, y + s * 0.32).fill(c);
    line(g, [x - s * 0.28, y + s * 0.26, x + s * 0.04, y + s * 0.38], s * 0.07, c);
    line(g, [x - s * 0.15, y + s * 0.34, x - s * 0.24, y + s * 0.5], s * 0.07, c);
  },
  /** Durga: her lion's head, a full mane. */
  lion: (g, x, y, s, c, ink) => {
    for (let i = 0; i < 14; i++) { const a = (i * Math.PI) / 7; g.circle(x + Math.cos(a) * s * 0.3, y + Math.sin(a) * s * 0.3, s * 0.13).fill(c); }
    g.circle(x, y, s * 0.27).fill(c).circle(x, y, s * 0.27).stroke({ width: s * 0.03, color: ink });
    g.circle(x - s * 0.1, y - s * 0.06, s * 0.035).circle(x + s * 0.1, y - s * 0.06, s * 0.035).fill(ink);
    g.moveTo(x - s * 0.06, y + s * 0.06).lineTo(x + s * 0.06, y + s * 0.06).lineTo(x, y + s * 0.13).fill(ink);
  },
  /** Shiva: the trishul, a trident with a damaru tied below the prongs. */
  trishul: (g, x, y, s, c, ink) => {
    line(g, [x, y + s * 0.5, x, y - s * 0.3], s * 0.07, c);
    line(g, [x - s * 0.24, y - s * 0.42, x - s * 0.24, y - s * 0.2, x + s * 0.24, y - s * 0.2, x + s * 0.24, y - s * 0.42], s * 0.07, c);
    g.moveTo(x, y - s * 0.52).lineTo(x + s * 0.07, y - s * 0.32).lineTo(x - s * 0.07, y - s * 0.32).fill(c);
    g.moveTo(x - s * 0.1, y - s * 0.02).lineTo(x + s * 0.1, y - s * 0.02).lineTo(x - s * 0.1, y + s * 0.16).lineTo(x + s * 0.1, y + s * 0.16).closePath().fill(ink);
  },
  /** Agni: a flame. */
  flame: (g, x, y, s, c, ink) => {
    g.moveTo(x, y - s * 0.5).bezierCurveTo(x + s * 0.45, y - s * 0.1, x + s * 0.3, y + s * 0.45, x, y + s * 0.45).bezierCurveTo(x - s * 0.3, y + s * 0.45, x - s * 0.45, y - s * 0.1, x, y - s * 0.5).fill(c);
    g.moveTo(x, y - s * 0.1).bezierCurveTo(x + s * 0.2, y + s * 0.1, x + s * 0.12, y + s * 0.4, x, y + s * 0.4).bezierCurveTo(x - s * 0.12, y + s * 0.4, x - s * 0.2, y + s * 0.1, x, y - s * 0.1).fill(ink);
  },
  /** Yama: the pasha, a looped noose. */
  noose: (g, x, y, s, c) => {
    g.circle(x, y - s * 0.12, s * 0.28).stroke({ width: s * 0.08, color: c });
    g.moveTo(x, y + s * 0.16).quadraticCurveTo(x - s * 0.2, y + s * 0.35, x + s * 0.05, y + s * 0.5).stroke({ width: s * 0.08, color: c, cap: 'round' });
  },
  /** Surya: the sun disc with rays. */
  sun: (g, x, y, s, c, ink) => {
    for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; g.moveTo(x + Math.cos(a - 0.15) * s * 0.3, y + Math.sin(a - 0.15) * s * 0.3).lineTo(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5).lineTo(x + Math.cos(a + 0.15) * s * 0.3, y + Math.sin(a + 0.15) * s * 0.3).fill(c); }
    g.circle(x, y, s * 0.3).fill(c).circle(x, y, s * 0.3).stroke({ width: s * 0.03, color: ink });
  },
  /** Rama: the bow, drawn, with an arrow. */
  bow: (g, x, y, s, c, ink) => {
    g.arc(x + s * 0.35, y, s * 0.55, Math.PI * 0.68, Math.PI * 1.32).stroke({ width: s * 0.08, color: c, cap: 'round' });
    line(g, [x - s * 0.06, y - s * 0.45, x - s * 0.06, y + s * 0.45], s * 0.025, ink);
    line(g, [x - s * 0.3, y, x + s * 0.4, y], s * 0.04, c);
    g.moveTo(x + s * 0.5, y).lineTo(x + s * 0.36, y - s * 0.07).lineTo(x + s * 0.36, y + s * 0.07).fill(c);
  },
  /** Vayu: swirling wind. */
  wind: (g, x, y, s, c) => {
    for (const [dy, w] of [[-0.25, 0.4], [0, 0.48], [0.25, 0.34]] as const) {
      g.moveTo(x - s * 0.45, y + s * dy).lineTo(x + s * (w - 0.2), y + s * dy).arc(x + s * (w - 0.2), y + s * (dy - 0.09), s * 0.09, Math.PI / 2, -Math.PI, true).stroke({ width: s * 0.07, color: c, cap: 'round' });
    }
  },
  /** Ganga: three rolling waves. */
  waves: (g, x, y, s, c) => {
    for (const dy of [-0.22, 0, 0.22]) {
      g.moveTo(x - s * 0.45, y + s * dy);
      for (let i = 0; i < 3; i++) g.quadraticCurveTo(x - s * 0.45 + s * 0.3 * i + s * 0.15, y + s * (dy - 0.14), x - s * 0.45 + s * 0.3 * (i + 1), y + s * dy);
      g.stroke({ width: s * 0.07, color: c, cap: 'round' });
    }
  },
  /** Parvati: the mountain she is the daughter of, snow-capped. */
  mountain: (g, x, y, s, c, ink) => {
    g.moveTo(x - s * 0.5, y + s * 0.4).lineTo(x - s * 0.08, y - s * 0.4).lineTo(x + s * 0.18, y + s * 0.02).lineTo(x + s * 0.28, y - s * 0.14).lineTo(x + s * 0.5, y + s * 0.4).fill(c);
    g.moveTo(x - s * 0.21, y - s * 0.15).lineTo(x - s * 0.08, y - s * 0.4).lineTo(x + s * 0.05, y - s * 0.15).lineTo(x - s * 0.08, y - s * 0.2).fill(ink);
  },
  /** Indra: the vajra, a double-ended thunderbolt. */
  vajra: (g, x, y, s, c, ink) => {
    for (const d of [-1, 1]) {
      g.moveTo(x, y + d * s * 0.12).bezierCurveTo(x - s * 0.3, y + d * s * 0.2, x - s * 0.2, y + d * s * 0.45, x, y + d * s * 0.52).bezierCurveTo(x + s * 0.2, y + d * s * 0.45, x + s * 0.3, y + d * s * 0.2, x, y + d * s * 0.12).fill(c);
      line(g, [x, y + d * s * 0.14, x, y + d * s * 0.5], s * 0.03, ink);
    }
    g.circle(x, y, s * 0.12).fill(c);
  },
  /** Saraswati: the veena, two gourds on a long neck. */
  veena: (g, x, y, s, c, ink) => {
    line(g, [x - s * 0.38, y + s * 0.3, x + s * 0.38, y - s * 0.3], s * 0.09, c);
    g.circle(x - s * 0.32, y + s * 0.26, s * 0.17).fill(c).circle(x + s * 0.32, y - s * 0.26, s * 0.11).fill(c);
    line(g, [x - s * 0.3, y + s * 0.18, x + s * 0.3, y - s * 0.3], s * 0.015, ink);
  },
  /** Lakshmi: the lotus. */
  lotus: (g, x, y, s, c, ink) => {
    for (let i = -2; i <= 2; i++) { const a = (i * Math.PI) / 7; g.ellipse(x + Math.sin(a) * s * 0.25, y + s * 0.05 - Math.cos(a) * s * 0.18, s * 0.11, s * 0.28).fill(c); }
    for (let i = -2; i <= 2; i++) g.ellipse(x + i * s * 0.12, y + s * 0.02, s * 0.06, s * 0.2).stroke({ width: s * 0.015, color: ink });
    g.ellipse(x, y + s * 0.32, s * 0.4, s * 0.08).fill(c);
  },
  /** Krishna: the flute (bansuri), with a peacock feather. */
  flute: (g, x, y, s, c, ink) => {
    line(g, [x - s * 0.45, y + s * 0.25, x + s * 0.45, y - s * 0.15], s * 0.09, c);
    for (let i = 0; i < 4; i++) g.circle(x - s * 0.15 + i * s * 0.12, y + s * 0.11 - i * s * 0.054, s * 0.025).fill(ink);
    g.ellipse(x - s * 0.1, y - s * 0.3, s * 0.1, s * 0.2).fill(c).circle(x - s * 0.1, y - s * 0.33, s * 0.06).fill(ink);
  },
  /** Brahma: the Vedas, an open book of palm leaves. */
  book: (g, x, y, s, c, ink) => {
    g.moveTo(x, y - s * 0.25).lineTo(x - s * 0.45, y - s * 0.35).lineTo(x - s * 0.45, y + s * 0.3).lineTo(x, y + s * 0.38).lineTo(x + s * 0.45, y + s * 0.3).lineTo(x + s * 0.45, y - s * 0.35).closePath().fill(c);
    for (const d of [-1, 1]) for (let i = 0; i < 3; i++) line(g, [x + d * s * 0.08, y - s * 0.12 + i * s * 0.14, x + d * s * 0.37, y - s * 0.18 + i * s * 0.14], s * 0.025, ink);
  },
  /** The hamsa: a swan. */
  hamsa: (g, x, y, s, c, ink) => {
    g.ellipse(x + s * 0.05, y + s * 0.18, s * 0.35, s * 0.18).fill(c);
    g.moveTo(x - s * 0.2, y + s * 0.12).quadraticCurveTo(x - s * 0.35, y - s * 0.3, x - s * 0.15, y - s * 0.35).stroke({ width: s * 0.09, color: c, cap: 'round' });
    g.moveTo(x - s * 0.15, y - s * 0.38).lineTo(x - s * 0.02, y - s * 0.33).lineTo(x - s * 0.14, y - s * 0.3).fill(ink);
  },
};

/** Draw a god's attribute glyph; an unknown attribute draws nothing (a test checks every god has one). */
export function drawGlyph(g: Graphics, kind: string, cx: number, cy: number, s: number, c: number, ink: number) {
  GLYPHS[kind]?.(g, cx, cy, s, c, ink);
  return g;
}
