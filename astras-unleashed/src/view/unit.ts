// A god on the field: its painted figure (public/art/units/<id>.png) when it exists, else a chibi placeholder in its
// own skin colour holding its attribute glyph; a team ring under its feet (the Sun's rayed disc, the Moon's crescent:
// shape as well as colour); and smooth code animation from the same few look numbers for every god: a bouncing walk,
// a breathing idle, a lunge on each strike, a descent in a column of light (avahana) and a lotus return (visarjana).
import { Container, Graphics, Sprite } from 'pixi.js';
import { lerpColor } from '../decl/css';
import { CARDS, TOKENS_ON_FIELD, TEAMS } from '../content';
import { token } from '../tokens';
import { art } from './art';
import { drawGlyph } from './glyphs';
import { LOOK } from './look';

export type Act = 'idle' | 'walk' | 'strike' | 'avahana' | 'visarjana';
export type Side = 'sun' | 'moon';

/** A god's skin token and attribute, card or token alike. */
function look(god: string) {
  const d = CARDS[god] ?? TOKENS_ON_FIELD[god];
  if (!d) throw new Error(`unit: no god "${god}"`);
  return { skin: token(d.skin), attribute: d.attribute };
}

/** The placeholder figure, feet at (0, 0), `h` px tall: big head, small body (Clash Royale proportions). */
function chibi(god: string, h: number): Graphics {
  const { skin, attribute } = look(god), g = new Graphics(), u = h / 10, ink = token('--hud-edge');
  const cloth = token('--limewhite'), sash = token('--marigold'), dark = lerpColor(skin, ink, 0.25);
  g.ellipse(-1.6 * u, -0.6 * u, 1.1 * u, 0.6 * u).ellipse(1.6 * u, -0.6 * u, 1.1 * u, 0.6 * u).fill(dark); // feet
  g.moveTo(-2.6 * u, -1 * u).lineTo(2.6 * u, -1 * u).lineTo(1.8 * u, -4 * u).lineTo(-1.8 * u, -4 * u).closePath().fill(cloth); // dhoti
  g.roundRect(-2.2 * u, -6.2 * u, 4.4 * u, 2.6 * u, 1.1 * u).fill(skin); // chest
  g.rect(-2.2 * u, -4.3 * u, 4.4 * u, 0.6 * u).fill(sash);
  g.roundRect(-3.6 * u, -6 * u, 1.4 * u, 3 * u, 0.7 * u).fill(dark).roundRect(2.2 * u, -6 * u, 1.4 * u, 3 * u, 0.7 * u).fill(dark); // arms
  g.circle(0, -8 * u, 2.4 * u).fill(skin); // head
  g.moveTo(-1.8 * u, -9.6 * u).lineTo(0, -12 * u).lineTo(1.8 * u, -9.6 * u).closePath().fill(token('--haldi')); // crown
  g.circle(0, -11.7 * u, 0.45 * u).fill(token('--sindoor'));
  g.circle(-0.8 * u, -8.1 * u, 0.32 * u).circle(0.8 * u, -8.1 * u, 0.32 * u).fill(ink); // eyes
  g.moveTo(-0.6 * u, -7.1 * u).quadraticCurveTo(0, -6.7 * u, 0.6 * u, -7.1 * u).stroke({ width: 0.25 * u, color: ink }); // a warm smile
  drawGlyph(g, attribute, 3.9 * u, -6.4 * u, 4.2 * u, token('--gold'), ink); // the attribute, held
  return g;
}

/** The team ring under a god: a rayed disc for the Sun, a crescent for the Moon. */
function ring(side: Side, w: number): Graphics {
  const t = TEAMS[side]!, g = new Graphics(), c = token(t.paint), trim = token(t.trim);
  g.ellipse(0, 0, w * 0.55, w * 0.2).fill({ color: token('--grass-shade'), alpha: 0.6 });
  if (t.emblem === 'disc') {
    g.ellipse(0, 0, w * 0.5, w * 0.17).stroke({ width: 2.5, color: c });
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; g.circle(Math.cos(a) * w * 0.5, Math.sin(a) * w * 0.17, 1.6).fill(trim); }
  } else {
    g.moveTo(-w * 0.5, 0).arc(0, 0, w * 0.5, Math.PI, 0.25 * Math.PI, true).stroke({ width: 3, color: c });
    g.scale.set(1, 0.34);
    g.ellipse(0, 0, w * 0.55, w * 0.6).fill({ color: trim, alpha: 0.15 });
  }
  return g;
}

export type UnitView = { root: Container; set(act: Act, t: number, facing: 1 | -1): void };

/** A god's view, `h` px tall at this depth. */
export function createUnit(god: string, side: Side, h: number): UnitView {
  const root = new Container(), body = new Container(), fx = new Graphics();
  root.addChild(ring(side, h * 0.8), fx, body);
  const tex = art('units', god);
  if (tex) { const s = new Sprite(tex); s.anchor.set(0.5, 1); s.scale.set(h / tex.height); body.addChild(s); }
  else body.addChild(chibi(god, h));
  const bounce = LOOK.WALK_BOUNCE_PX, lunge = LOOK.STRIKE_LUNGE_PX;
  return {
    root,
    /** Pose at `t` seconds into `act`. facing: -1 walks up the screen (the Sun), +1 down (the Moon). */
    set(act, t, facing) {
      body.position.set(0, 0); body.scale.set(1, 1); body.rotation = 0; body.alpha = 1; fx.clear();
      if (act === 'idle') body.scale.set(1, 1 + 0.025 * Math.sin(t * 2.4));
      else if (act === 'walk') {
        const step = t * LOOK.WALK_STEPS_PER_S * Math.PI;
        body.y = -Math.abs(Math.sin(step)) * bounce;
        body.scale.set(1 + 0.03 * Math.cos(step * 2), 1 - 0.03 * Math.cos(step * 2));
        body.rotation = 0.06 * Math.sin(step);
      } else if (act === 'strike') {
        const p = (t % 0.9) / 0.9, k = Math.sin(Math.min(1, p * 2.5) * Math.PI);
        body.y = facing * k * lunge; body.scale.set(1 + 0.08 * k, 1 - 0.06 * k);
        if (k > 0.6) fx.circle(0, facing * (lunge + h * 0.15), h * 0.18 * k).fill({ color: token(TEAMS[side]!.paint), alpha: 0.35 * k }); // gulal puff
      } else if (act === 'avahana') {
        const p = Math.min(1, t / 0.7);
        fx.rect(-h * 0.3, -h * 3, h * 0.6, h * 3).fill({ color: token('--haldi'), alpha: 0.45 * (1 - p) });
        fx.ellipse(0, 0, h * 0.5 * (0.5 + p), h * 0.17 * (0.5 + p)).fill({ color: token('--limewhite'), alpha: 0.6 * (1 - p) });
        body.y = -(1 - p) * (1 - p) * h * 1.4; body.alpha = 0.3 + 0.7 * p; body.scale.set(0.85 + 0.15 * p, 1.2 - 0.2 * p);
      } else {
        const p = Math.min(1, t / 1.2), petal = token('--rani');
        for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3 + p; fx.ellipse(Math.cos(a) * h * 0.25 * p, -h * 0.1 + Math.sin(a) * h * 0.08 * p, h * 0.07, h * 0.14).fill({ color: i % 2 ? petal : lerpColor(petal, token('--limewhite'), 0.4), alpha: 1 - p * 0.6 }); }
        body.y = -p * h * 0.6; body.scale.set(1 - 0.8 * p); body.alpha = 1 - p;
      }
    },
  };
}
