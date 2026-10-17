// Views for level entities: hazards (any era), cowries, the record (palm leaf,
// drum or oar), the dolphin, friends to jump over, Odia-letter platforms and
// in-world prompts. Created as they scroll in, recycled after.
import Phaser from 'phaser';
import { GAME_W, PLAYER_X } from '../../config';
import { FRAME } from '../../data/palettes';
import { ARCH } from '../../data/hazards';
import { DEPTH } from '../../art/layers';
import { ORIGIN } from '../../art/sprites/props';
import { hazardKey, originOf } from '../../art/bake';
import { paintLetterPlatform } from '../../art/sprites/platform';
import { dolphinPos, entityX, entityY, recordY, type Entity, type Level, type SimState } from '../../systems/sim';

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
  /** Dark stretches: hazards get a faint lamplit rim so they stay readable. */
  dark = 0;

  constructor(scene: Phaser.Scene, level: Level) {
    this.scene = scene;
    this.level = level;
  }

  private create(e: Entity): View | null {
    const s = this.scene;
    switch (e.kind) {
      case 'hazard': {
        const key = hazardKey(e.vis ?? 'stone', e.variant);
        const [ox, oy] = originOf(key);
        const img = s.add.image(0, 0, key).setOrigin(ox, oy).setScale(0.5).setDepth(DEPTH.entities);
        return { main: img };
      }
      case 'cowrie':
        return { main: s.add.image(0, 0, 'cowrie').setScale(0.5).setDepth(DEPTH.entities + 0.2) };
      case 'record': {
        const glow = s.add.image(0, 0, 'fx:glow').setScale(2.2).setAlpha(0.6).setDepth(DEPTH.entities + 0.3);
        if (e.vis && e.vis !== 'leaf') {
          const key = `rec:${e.vis}`;
          const [ox, oy] = originOf(key);
          return { main: s.add.image(0, 0, key).setOrigin(ox, oy).setScale(LEAF_SCALE).setDepth(DEPTH.entities + 0.4), glow };
        }
        const o = ORIGIN.leaf();
        return { main: s.add.image(0, 0, 'leaf').setOrigin(o.x, o.y).setScale(LEAF_SCALE).setDepth(DEPTH.entities + 0.4), glow };
      }
      case 'dolphin': {
        const o = ORIGIN.dolphin();
        return { main: s.add.image(0, 0, 'dolphin').setOrigin(o.x, o.y).setScale(0.5).setDepth(DEPTH.dolphin).setVisible(false) };
      }
      case 'friend': {
        const key = `friend:${e.vis}:${e.variant % 3}`;
        if (!s.textures.exists(key)) return null;
        const [ox, oy] = originOf(key);
        return { main: s.add.image(0, 0, key).setOrigin(ox, oy).setScale(0.5).setDepth(DEPTH.entities - 0.2) };
      }
      case 'platform': {
        const pl = e.plat!;
        const key = `plat:${pl.glyph}:${Math.round(pl.x1 - pl.x0)}`;
        if (!s.textures.exists(key)) s.textures.addCanvas(key, paintLetterPlatform(pl.glyph, pl.x1 - pl.x0));
        return { main: s.add.image(0, 0, key).setOrigin(0.5, 10 / 140).setScale(0.5).setDepth(DEPTH.entities - 0.3) };
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

  /** The record view, so the scene can fly it to the HUD. */
  takeRecordView(e: Entity): View | undefined {
    const v = this.views.get(e.id);
    this.views.delete(e.id);
    return v;
  }

  hit(e: Entity): void {
    const v = this.views.get(e.id);
    if (v) v.shakeT = 0.35;
  }

  cheer(e: Entity): void {
    const v = this.views.get(e.id);
    if (v) v.shakeT = -0.6; // negative = a happy hop
  }

  private remove(id: number): void {
    const v = this.views.get(id);
    if (!v) return;
    v.main.destroy();
    v.glow?.destroy();
    this.views.delete(id);
  }

  destroyAll(): void {
    for (const id of [...this.views.keys()]) this.remove(id);
  }

  update(sim: SimState, t: number, dt: number): void {
    const scroll = sim.scroll;
    const lo = scroll - 320, hi = scroll + GAME_W + 260;
    const ents = this.level.entities;
    for (let i = Math.max(0, sim.scan - 4); i < ents.length; i++) {
      const e = ents[i];
      // moving things can enter from further right
      const ex = e.kind === 'hazard' ? entityX(e, sim.t) : e.kind === 'platform' ? e.x : e.x;
      const reach = e.kind === 'platform' ? (e.plat!.x1 - e.plat!.x0) / 2 : 0;
      if (e.x > hi + 600 + reach) break;
      let v = this.views.get(e.id);
      if (ex + reach < lo || ex - reach > hi) {
        if (v && ex + reach < lo) this.remove(e.id);
        continue;
      }
      if (e.kind === 'cowrie' && e.taken) {
        if (v) this.remove(e.id);
        continue;
      }
      if (e.kind === 'record' && e.taken) continue;
      if (!v) {
        const nv = this.create(e);
        if (!nv) continue;
        this.views.set(e.id, nv);
        v = nv;
      }
      const sx = ex - scroll;
      switch (e.kind) {
        case 'hazard': {
          const img = v.main as Phaser.GameObjects.Image;
          let jx = 0;
          if (v.shakeT && v.shakeT > 0) {
            v.shakeT -= dt;
            jx = Math.sin(t * 60) * 4 * (v.shakeT / 0.35);
          }
          const y = entityY(e, sim.t);
          const arch = e.arch ?? 'small';
          let rot = 0;
          if (arch === 'roller') rot = -(ex / 26) % (Math.PI * 2);
          else if (arch === 'floater') rot = Math.sin(t * 2 + e.id) * 0.12;
          else if (arch === 'walker') rot = Math.sin(t * 7 + e.id) * 0.03;
          else if (e.vis === 'reed') rot = Math.sin(t * 1.8 + e.id) * 0.03;
          const ground = ARCH[arch].anchor === 'ground';
          img.setPosition(sx + jx, y + (ground ? 3 : 0)).setRotation(rot);
          // Dark stretches are low-contrast, not invisible: hazards dim a little.
          const lit = Math.round(255 * (1 - this.dark * 0.32));
          img.setTint(Phaser.Display.Color.GetColor(lit, lit, Math.min(255, lit + 14)));
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
        case 'friend': {
          const img = v.main as Phaser.GameObjects.Image;
          let hop = Math.abs(Math.sin(t * 5 + e.id)) * 3;
          if (v.shakeT && v.shakeT < 0) {
            v.shakeT += dt;
            hop += Math.abs(Math.sin(t * 16)) * 12;
          }
          img.setPosition(sx, e.y + 2 - hop);
          break;
        }
        case 'platform':
          (v.main as Phaser.GameObjects.Image).setPosition(sx, e.plat!.top);
          break;
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
