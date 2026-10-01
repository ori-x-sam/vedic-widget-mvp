// A fight or level in progress: rules world + input + view + HUD + audio + haptics.
// The session is the only place that connects rule events to sound, haptics and hit-stop.
import type { Content } from "../core/content";
import { InputMerger } from "../core/input";
import type { Scene } from "../core/engine";
import type { Clock } from "../core/clock";
import { World, Loadout } from "../rules/world";
import type { WorldEvent } from "../rules/types";
import type { GameView } from "../view/gameview";
import type { Hud } from "../view/hud";
import type { Audio } from "./audio";
import type { Haptics } from "./haptics";
import type { TouchControls } from "./touch";

export interface SessionResult {
  result: "win" | "lose" | "quit";
  time: number; hpLeft: number; parries: number; supers: number; coins: number; reward: number; id: string; kind: "boss" | "level";
  progress: number; // how far into the boss/level (0..1) when it ended
}

export interface SessionDeps { content: Content; view: GameView; hud: Hud; audio: Audio; haptics: Haptics; touch: TouchControls | null; merger: InputMerger; clock: Clock }

export function applyCharm(content: Content, charm: string): Content {
  const c = content.charms[charm];
  if (!c) return content;
  const player = { ...content.player };
  if (c.effect === "hp") player.hp = (player.hp ?? 3) + c.value;
  if (c.effect === "parry-window") player["parry-window"] = (player["parry-window"] ?? 0.22) + c.value;
  if (c.effect === "blink-cd") player["blink-cd"] = Math.max(0.2, (player["blink-cd"] ?? 0.55) + c.value);
  if (c.effect === "meter") player["meter-per-card"] = Math.max(40, (player["meter-per-card"] ?? 110) + c.value);
  return { ...content, player };
}

export class Session implements Scene {
  world: World;
  paused = false;
  ended = false;
  private lastBossHitSfx = 0;
  private lastShotSfx = 0;
  private slowT = 0;

  constructor(private d: SessionDeps, public kind: "boss" | "level", public id: string, loadout: Loadout, private onEnd: (r: SessionResult) => void, seed = (Math.random() * 1e9) | 0) {
    this.world = new World(applyCharm(d.content, loadout.charm), loadout, seed);
  }

  async start() {
    const { content, view, hud } = this.d;
    const stage = this.kind === "boss" ? content.bosses[this.id]?.stage : content.levels[this.id]?.stage;
    view.clearWorld();
    hud.clear();
    await view.setStage(stage ?? "gajraj");
    if (this.kind === "boss") this.world.startBoss(this.id); else this.world.startLevel(this.id);
    this.drain();
    const b = content.bosses[this.id];
    const l = content.levels[this.id];
    hud.banner("intro", b ? b.name.toUpperCase() : (l?.name ?? "").toUpperCase(), b ? `${b.title} — "${b.intro}"` : l?.intro ?? "", 2.2);
    this.d.audio.play("ta-da");
  }

  step(_dt: number) {
    if (this.paused || this.ended) return;
    const input = this.d.merger.frame();
    if (input.pressed.pause) { this.paused = true; this.onPause(); return; }
    this.world.step(input);
    this.drain();
    if (this.slowT > 0) { this.slowT -= _dt; if (this.slowT <= 0) this.d.clock.scale = 1; }
    if (this.world.result && this.world.resultT > (this.world.result === "win" ? 3.2 : 2.4) && !this.ended) this.finish(this.world.result);
  }

  onPause: () => void = () => {};

  finish(result: "win" | "lose" | "quit") {
    this.ended = true;
    this.d.clock.scale = 1;
    this.d.audio.glideLoop(false);
    const w = this.world;
    const b = this.d.content.bosses[this.id], l = this.d.content.levels[this.id];
    const progress = b ? 1 - Math.max(0, w.boss?.hp ?? 0) / b.hp : Math.min(1, Math.max(0, w.player.x / Math.max(1, w.levelLength)));
    this.onEnd({
      result, time: w.t, hpLeft: w.player.hp, parries: w.player.stats.parries, supers: w.player.stats.supers, coins: w.coins,
      reward: result === "win" ? (b?.reward ?? l?.reward ?? 0) + w.coins : w.coins, id: this.id, kind: this.kind, progress,
    });
  }

  private drain() {
    const ev = this.world.events;
    for (const e of ev) this.dispatch(e);
    ev.length = 0;
  }

  private dispatch(e: WorldEvent) {
    const { view, hud, audio, haptics, clock, content } = this.d;
    const w = this.world;
    audio.camX = w.camX;
    view.onEvent(e);
    switch (e.type) {
      case "sfx": audio.play(e.s ?? "", e.x); break;
      case "shoot": if (w.t - this.lastShotSfx > 0.07) { this.lastShotSfx = w.t; audio.play(e.s === "coin" ? "shoot" : `shoot-${e.s}`, e.x); } break;
      case "boss-hit": if (w.t - this.lastBossHitSfx > 0.09) { this.lastBossHitSfx = w.t; audio.play("boss-hit", e.x); } break;
      case "hit": audio.play(e.s === "glass" ? "glass" : "hit", e.x); break;
      case "parry": audio.play("parry"); clock.freeze(0.1); break;
      case "player-hurt": audio.play("player-hurt"); clock.freeze(0.07); break;
      case "haptic": haptics.pulse(e.s ?? "", e.n); break;
      case "blink": audio.play("blink", e.x); break;
      case "jump": audio.play(e.s === "2" ? "jump2" : "jump", e.x); break;
      case "land": if ((e.n ?? 0) > 0.3) audio.play("land", e.x); break;
      case "glide": audio.glideLoop(e.s === "start"); break;
      case "drumroll": audio.drumroll(e.n ?? 1); break;
      case "theme": audio.playTheme(e.s ?? ""); break;
      case "card": { const [a, b] = (e.s ?? "").split("|"); hud.banner("card", a, b, e.n ?? 1.6); break; }
      case "say": { const [who, text] = (e.s ?? "").split("|"); hud.say(who, text, e.x, e.y, e.n ?? 2, e.id ?? 0); break; }
      case "phase": hud.banner("phase", (e.s ?? "").toUpperCase(), "", 1.4); audio.play("ta-da"); break;
      case "knockout": hud.banner("ko", e.s ?? "KHEL KHATAM!", "", 2.6); audio.play("knockout"); clock.scale = 0.35; this.slowT = 0.5; audio.stopTheme(); break;
      case "player-dead": hud.banner("lose", content.strings["lose"] ?? "GAME OVER", content.strings["lose-sub"] ?? "", 2.2); audio.play("lose"); audio.stopTheme(); audio.glideLoop(false); break;
      case "win": if (this.kind === "level") { hud.banner("ko", content.strings["level-clear"] ?? "CLEAR!", "", 2.4); audio.play("knockout"); } break;
      case "pickup": audio.play("coin", e.x); break;
      case "super": audio.play("super"); break;
      case "ex": audio.play("ex", e.x); break;
      case "decal": break;
    }
  }

  render(alpha: number, dt: number) {
    const { view, hud, touch, content } = this.d;
    const w = this.world;
    view.render(w, alpha, dt);
    const p = w.player;
    const wp = content.weapons[p.weapons[p.weaponIdx]];
    const cw = view.canvas.clientWidth, ch = view.canvas.clientHeight;
    hud.update(w, wp?.name ?? "", (x, y) => view.project(x, y, cw, ch), dt);
    if (touch) {
      touch.setReady("ex", p.cards >= 1);
      touch.setCooldown("blink", p.blinkCd > 0);
    }
  }
}
