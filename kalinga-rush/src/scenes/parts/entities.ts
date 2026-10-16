// Views for level entities: hazards, cowries, the palm-leaf record, the
// dolphin and in-world prompts. Created as they scroll in, recycled after.
import Phaser from 'phaser';
import { GAME_W, PLAYER_X } from '../../config';
import { FRAME } from '../../data/palettes';
import { DEPTH } from '../../art/layers';
import { ORIGIN } from '../../art/sprites/props';
import { dolphinPos, recordY, type Entity, type Level, type SimState } from '../../systems/sim';

/** The palm-leaf record is drawn large so it pops against busy scenery. */
const LEAF_SCALE = 0.7;

interface View {
  main: Phaser.GameObjects.Image | Phaser.GameObjects.Text;
  glow?: Phaser.GameObjects.Image;
  shakeT?: number;
}

export class EntityViews {
  private scene: Phaser.Scene;
  private views = new Map<number, View>();
  private level: Level;

  constructor(scene: Phaser.Scene, level: Level) {
    this.scene = scene;
    this.level = level;
  }

  private create(e: Entity): View | null {
    const s = this.scene;
    switch (e.kind) {
      case 'reed':
      case 'mud':
      case 'stakes': {
        const o = ORIGIN[e.kind](e.variant);
        return { main: s.add.image(0, 0, `${e.kind}:${e.variant}`).setOrigin(o.x, o.y).setScale(0.5).setDepth(DEPTH.entities) };
      }
      case 'cowrie':
        return { main: s.add.image(0, 0, 'cowrie').setScale(0.5).setDepth(DEPTH.entities + 0.2) };
      case 'record': {
        const glow = s.add.image(0, 0, 'fx:glow').setScale(2.2).setAlpha(0.6).setDepth(DEPTH.entities + 0.3);
        const o = ORIGIN.leaf();
        return { main: s.add.image(0, 0, 'leaf').setOrigin(o.x, o.y).setScale(LEAF_SCALE).setDepth(DEPTH.entities + 0.4), glow };
      }
      case 'dolphin': {
        const o = ORIGIN.dolphin();
        return { main: s.add.image(0, 0, 'dolphin').setOrigin(o.x, o.y).setScale(0.5).setDepth(DEPTH.dolphin).setVisible(false) };
      }
      case 'prompt': {
        // A small frame-coloured tag, like the hanging signboards.
        const txt = s.add.text(0, 0, (e.text ?? '').toUpperCase(), {
          fontFamily: '"Inter Tight", "Arial Narrow", sans-serif',
          fontSize: '19px',
          fontStyle: '800',
          color: FRAME.cream,
          backgroundColor: FRAME.frame,
          padding: { x: 14, y: 8 },
          align: 'center',
        }).setOrigin(0.5, 1).setDepth(DEPTH.prompts).setAlpha(0);
        txt.setLetterSpacing?.(2);
        return { main: txt };
      }
      default:
        return null;
    }
  }

  /** The palm-leaf record view, so the scene can fly it to the HUD. */
  takeRecordView(e: Entity): View | undefined {
    const v = this.views.get(e.id);
    this.views.delete(e.id);
    return v;
  }

  hit(e: Entity): void {
    const v = this.views.get(e.id);
    if (v) v.shakeT = 0.35;
  }

  remove(e: Entity): void {
    const v = this.views.get(e.id);
    if (!v) return;
    v.main.destroy();
    v.glow?.destroy();
    this.views.delete(e.id);
  }

  update(sim: SimState, t: number, dt: number): void {
    const scroll = sim.scroll;
    const lo = scroll - 260, hi = scroll + GAME_W + 220;
    for (let i = Math.max(0, sim.scan - 2); i < this.level.entities.length; i++) {
      const e = this.level.entities[i];
      if (e.x > hi) break;
      let v = this.views.get(e.id);
      if (e.x < lo) {
        if (v) this.remove(e);
        continue;
      }
      if (e.kind === 'cowrie' && e.taken) {
        if (v) this.remove(e);
        continue;
      }
      if (e.kind === 'record' && e.taken) continue;
      if (!v) {
        const nv = this.create(e);
        if (!nv) continue;
        this.views.set(e.id, nv);
        v = nv;
      }
      const sx = e.x - scroll;
      switch (e.kind) {
        case 'reed':
        case 'mud':
        case 'stakes': {
          let jx = 0;
          if (v.shakeT && v.shakeT > 0) {
            v.shakeT -= dt;
            jx = Math.sin(t * 60) * 4 * (v.shakeT / 0.35);
          }
          const sway = e.kind === 'reed' ? Math.sin(t * 1.8 + e.id) * 0.03 : 0;
          (v.main as Phaser.GameObjects.Image).setPosition(sx + jx, e.y + 3).setRotation(sway);
          break;
        }
        case 'cowrie': {
          const img = v.main as Phaser.GameObjects.Image;
          img.setPosition(sx, e.y + Math.sin(t * 3 + e.id) * 3);
          img.setScale(0.5 * (0.72 + 0.28 * Math.abs(Math.cos(t * 2.2 + e.id * 0.7))), 0.5);
          break;
        }
        case 'record': {
          const y = recordY(e, sim.t);
          (v.main as Phaser.GameObjects.Image).setPosition(sx, y).setRotation(Math.sin(t * 1.7) * 0.08);
          v.glow!.setPosition(sx, y).setAlpha(0.55 + Math.sin(t * 3) * 0.15).setScale(2.2 + Math.sin(t * 3) * 0.12);
          break;
        }
        case 'dolphin': {
          const img = v.main as Phaser.GameObjects.Image;
          const p = dolphinPos(e, sim.t);
          if (!p) {
            img.setVisible(false);
            break;
          }
          const d = e.dolphin!;
          const vx = d.toX - d.fromX;
          const vy = -4 * d.height * (1 - 2 * p.p);
          img.setVisible(true).setPosition(p.x - scroll, p.y - 6).setRotation(Math.atan2(-vy, -vx));
          break;
        }
        case 'prompt': {
          const txt = v.main as Phaser.GameObjects.Text;
          const fadeIn = Phaser.Math.Clamp((GAME_W - 120 - sx) / 160, 0, 1);
          const fadeOut = Phaser.Math.Clamp((sx - (PLAYER_X - 140)) / 120, 0, 1);
          txt.setPosition(sx, e.y + Math.sin(t * 2.4) * 3).setAlpha(Math.min(fadeIn, fadeOut));
          break;
        }
        default:
          break;
      }
    }
  }
}
