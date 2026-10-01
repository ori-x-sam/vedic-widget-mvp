// App shell: screens + flow. title -> intro comic -> overworld island -> (shop | boss | level) -> results.
import type { Boot } from "./boot";
import { Engine } from "../core/engine";
import { InputMerger } from "../core/input";
import { GameView } from "../view/gameview";
import { Hud } from "../view/hud";
import { Comic } from "../view/comic";
import { OverworldView } from "../view/overworld";
import { Overworld } from "../rules/overworld";
import { Audio } from "./audio";
import { Haptics } from "./haptics";
import { TouchControls } from "./touch";
import { keyboardSource } from "./keyboard";
import { gamepadSource } from "./gamepad";
import { Store } from "./store";
import { Session, SessionResult } from "./session";

export class App {
  engine = new Engine();
  merger = new InputMerger();
  store = new Store();
  audio: Audio;
  haptics = new Haptics();
  view!: GameView;
  hud!: Hud;
  touch: TouchControls | null = null;
  canvas: HTMLCanvasElement;
  ui: HTMLDivElement;
  session: Session | null = null;
  overworld: { rules: Overworld; view: OverworldView } | null = null;
  private screen: HTMLDivElement | null = null;
  private isTouch = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;

  constructor(public root: HTMLElement, public b: Boot) {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "game";
    root.appendChild(this.canvas);
    this.ui = document.createElement("div");
    this.ui.className = "layer";
    root.appendChild(this.ui);
    this.audio = new Audio(b.content.themes);
    this.merger.add(keyboardSource());
    this.merger.add(gamepadSource());
    this.applySettings();
    const unlock = () => this.audio.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock, { passive: true });
  }

  applySettings() {
    const s = this.store.data.settings;
    this.audio.setVolumes(s.music, s.sfx);
    this.audio.setMuted(s.muted);
    this.haptics.enabled = s.haptics;
    this.merger.autoFire = s.autofire;
    this.touch?.showSafeZones(s.showSafe);
  }

  async start(params: URLSearchParams) {
    this.showLoading();
    this.view = new GameView(this.canvas, this.b.tokens, this.b.content, this.b.svgs);
    await this.view.load(Object.keys(this.b.content.stages));
    this.hud = new Hud(this.ui);
    this.hud.show(false);
    if (this.isTouch || params.has("touch")) {
      this.touch = new TouchControls(this.ui, this.b.content.controls);
      this.touch.onPause = () => this.pause();
      this.merger.add(this.touch.source());
      this.touch.el.style.display = "none";
      this.applySettings();
    }
    const resize = () => {
      const w = this.root.clientWidth, h = this.root.clientHeight;
      this.view.resize(w, h);
      this.overworld?.view.resize(w, h);
    };
    window.addEventListener("resize", resize);
    resize();
    this.engine.start();
    (window as unknown as { __ready: boolean }).__ready = true;
    // dev / screenshot / story entry points
    const seed = params.has("seed") ? Number(params.get("seed")) : undefined;
    if (params.get("boss")) return this.fight("boss", params.get("boss")!, Number(params.get("phase") ?? 0), seed);
    if (params.get("level")) return this.fight("level", params.get("level")!, 0, seed);
    if (params.get("story")) return this.story(params.get("story")!, () => this.title());
    if (params.has("overworld")) return this.toOverworld();
    if (params.has("shop")) { await this.toOverworld(); return this.shop(); }
    this.title();
  }

  // ── screens ──
  private setScreen(html: string, cls = "screen dim"): HTMLDivElement {
    this.screen?.remove();
    const d = document.createElement("div");
    d.className = cls;
    d.innerHTML = html;
    this.ui.appendChild(d);
    this.screen = d;
    d.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => this.audio.play("ui")));
    return d;
  }
  private clearScreen() { this.screen?.remove(); this.screen = null; }

  private showLoading() { this.setScreen(`<div class="title-logo">Loading…<small>tabla tuning</small></div>`); }

  title() {
    this.leaveGameplay();
    this.engine.scene = { step: () => {}, render: () => this.view.renderer.clear() };
    const s = this.b.content.strings;
    const d = this.setScreen(`
      <div class="title-logo">${s.title ?? "SLUMMONKEY"}<small>${s.subtitle ?? ""}</small></div>
      <div class="row">
        <button class="btn" data-a="play">${this.store.data.seen.includes("intro") ? "Continue" : "New Game"}</button>
        <button class="btn alt" data-a="settings">Settings</button>
        ${this.isTouch ? `<button class="btn alt" data-a="layout">Controls</button>` : ""}
      </div>
      <div class="hint">Keyboard: arrows move · Z jump · X shoot · C parry · Shift blink · V EX · Ctrl aim-lock · Tab swap</div>`, "screen comic-bg-sun");
    this.audio.playTheme("title");
    d.querySelector('[data-a="play"]')!.addEventListener("click", () => {
      this.tryFullscreen();
      if (!this.store.data.seen.includes("intro")) this.story("intro", () => { this.store.update((x) => x.seen.push("intro")); void this.toOverworld(); });
      else void this.toOverworld();
    });
    d.querySelector('[data-a="settings"]')!.addEventListener("click", () => this.settings(() => this.title()));
    d.querySelector('[data-a="layout"]')?.addEventListener("click", () => this.layoutEditor(() => this.title()));
  }

  private tryFullscreen() {
    if (!this.isTouch) return;
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    try { void (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.()); } catch { /* ignore */ }
    try { void (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.("landscape").catch(() => {}); } catch { /* ignore */ }
  }

  story(id: string, then: () => void) {
    this.leaveGameplay();
    this.clearScreen();
    this.engine.scene = { step: () => {}, render: () => {} };
    this.audio.playTheme(id === "ending" ? "ending" : "title");
    const c = new Comic(this.ui, this.b.content.stories[id], this.b.svgs, this.b.tokens);
    c.onDone = () => { c.dispose(); then(); };
  }

  async toOverworld() {
    this.leaveGameplay();
    this.clearScreen();
    if (!this.overworld) {
      const rules = new Overworld(this.b.content.overworld);
      const view = new OverworldView(this.view.renderer, this.b.tokens, this.b.content, this.view.bank, this.view.puppets);
      view.gameView = this.view;
      await view.load();
      view.resize(this.root.clientWidth, this.root.clientHeight);
      this.overworld = { rules, view };
    }
    const { rules, view } = this.overworld;
    rules.beaten = new Set(this.store.data.beaten);
    if (this.touch) { this.touch.el.style.display = ""; this.touch.enabled = true; }
    this.audio.playTheme("overworld");
    const hint = this.setScreen(`<div class="coins-tag">◎ ${this.store.data.coins}</div><button class="pause-btn" data-a="menu">≡</button><div class="ow-prompt"></div>`, "layer");
    hint.querySelector('[data-a="menu"]')!.addEventListener("click", () => this.owMenu());
    (hint.querySelector('[data-a="menu"]') as HTMLElement).style.pointerEvents = "auto";
    const prompt = hint.querySelector(".ow-prompt") as HTMLDivElement;
    this.engine.scene = {
      step: () => {
        const f = this.merger.frame();
        rules.step(f, 1 / 60);
        if (f.pressed.pause) this.owMenu();
        const near = rules.near;
        if (near) {
          const label = near.kind === "npc" ? `Talk: ${near.label}` : near.locked ? `🔒 ${near.label}` : near.label;
          if (prompt.dataset.k !== near.id) { prompt.dataset.k = near.id; prompt.innerHTML = `<button class="btn small">${label} ▶</button>`; prompt.querySelector("button")!.onclick = () => this.owAction(); }
          if (f.pressed.jump || f.pressed.shoot) this.owAction();
        } else if (prompt.dataset.k) { prompt.dataset.k = ""; prompt.innerHTML = ""; }
      },
      render: (_a, dt) => view.render(rules, dt),
    };
  }

  private owAction() {
    const ow = this.overworld!.rules;
    const n = ow.near;
    if (!n) return;
    if (n.kind === "npc") {
      const npc = this.b.content.overworld.npcs.find((x) => x.id === n.id)!;
      const line = npc.lines[ow.talkCount(n.id) % npc.lines.length];
      this.overworld!.view.say(npc.id, line);
      this.audio.play("ui");
      return;
    }
    if (n.locked) { this.audio.play("denied"); this.overworld!.view.say("player", "Pehle baaki tents nipta, bhai."); return; }
    const node = this.b.content.overworld.nodes.find((x) => x.id === n.id)!;
    if (node.kind === "shop") return this.shop();
    if (node.level === "ending") return this.story("ending", () => this.title());
    const isBoss = !!this.b.content.bosses[node.level];
    this.preFight(isBoss ? "boss" : "level", node.level);
  }

  private preFight(kind: "boss" | "level", id: string) {
    const b = this.b.content.bosses[id], l = this.b.content.levels[id];
    const name = b?.name ?? l?.name ?? id;
    const sub = b ? b.title : l?.mode === "fly" ? "Udta Rickshaw" : "Run & Gun";
    const d = this.setScreen(`<div class="panel"><h2>${name}</h2><div class="stat">${sub}</div><p class="hint">“${b?.intro ?? l?.intro ?? ""}”</p>
      <div class="row"><button class="btn" data-a="go">Chalo!</button><button class="btn alt" data-a="equip">Loadout</button><button class="btn alt" data-a="back">Back</button></div></div>`);
    d.querySelector('[data-a="go"]')!.addEventListener("click", () => void this.fight(kind, id));
    d.querySelector('[data-a="equip"]')!.addEventListener("click", () => this.loadout(() => this.preFight(kind, id)));
    d.querySelector('[data-a="back"]')!.addEventListener("click", () => void this.toOverworld());
  }

  private owMenu() {
    const d = this.setScreen(`<div class="panel"><h2>Island</h2><div class="row" style="flex-direction:column">
      <button class="btn" data-a="resume">Resume</button><button class="btn alt" data-a="equip">Loadout</button>
      <button class="btn alt" data-a="settings">Settings</button>${this.touch ? `<button class="btn alt" data-a="layout">Edit controls</button>` : ""}
      <button class="btn alt" data-a="title">Title</button></div></div>`);
    d.querySelector('[data-a="resume"]')!.addEventListener("click", () => void this.toOverworld());
    d.querySelector('[data-a="equip"]')!.addEventListener("click", () => this.loadout(() => void this.toOverworld()));
    d.querySelector('[data-a="settings"]')!.addEventListener("click", () => this.settings(() => void this.toOverworld()));
    d.querySelector('[data-a="layout"]')?.addEventListener("click", () => this.layoutEditor(() => void this.toOverworld()));
    d.querySelector('[data-a="title"]')!.addEventListener("click", () => this.title());
  }

  shop() {
    const c = this.b.content;
    const render = () => {
      const save = this.store.data;
      const items = c.shop.map((it) => {
        const def = it.kind === "weapon" ? c.weapons[it.id] : it.kind === "super" ? c.supers[it.id] : c.charms[it.id];
        if (!def) return "";
        const owned = save.owned.includes(it.id);
        return `<div class="shop-item ${owned ? "owned" : ""}"><h3>${def.name}</h3><p>${def.desc}</p>
          <button class="btn small" data-buy="${it.id}" data-price="${it.price}" ${owned || save.coins < it.price ? "disabled" : ""}>${owned ? "Owned" : `◎ ${it.price}`}</button></div>`;
      }).join("");
      const d = this.setScreen(`<div class="panel"><h2>${c.strings["shop-title"] ?? "Shop"}</h2><p class="hint">${c.strings["shop-greet"] ?? ""}</p>
        <div class="stat">Wallet: ◎ ${save.coins}</div><div class="shop-grid">${items}</div>
        <div class="row" style="margin-top:10px"><button class="btn alt" data-a="equip">Loadout</button><button class="btn" data-a="back">Back</button></div></div>`);
      d.querySelectorAll<HTMLButtonElement>("[data-buy]").forEach((b) => b.addEventListener("click", () => {
        const price = Number(b.dataset.price);
        if (this.store.data.coins < price) return;
        this.store.update((s) => { s.coins -= price; s.owned.push(b.dataset.buy!); });
        this.audio.play("coin");
        render();
      }));
      d.querySelector('[data-a="equip"]')!.addEventListener("click", () => this.loadout(() => this.shop()));
      d.querySelector('[data-a="back"]')!.addEventListener("click", () => void this.toOverworld());
    };
    render();
  }

  loadout(back: () => void) {
    const c = this.b.content;
    const render = () => {
      const s = this.store.data;
      const own = (id: string) => s.owned.includes(id);
      const lo = s.loadout;
      const ws = Object.values(c.weapons).filter((w) => own(w.id)).map((w) => {
        const slot = lo.weapons.indexOf(w.id);
        return `<div class="shop-item ${slot >= 0 ? "equipped" : ""}"><h3>${w.name}</h3><p>${w.desc}</p><button class="btn small" data-w="${w.id}">${slot >= 0 ? `Slot ${slot + 1} ✓` : "Equip"}</button></div>`;
      }).join("");
      const ss = Object.values(c.supers).filter((x) => own(x.id)).map((x) => `<div class="shop-item ${lo.super === x.id ? "equipped" : ""}"><h3>${x.name}</h3><p>${x.desc}</p><button class="btn small" data-s="${x.id}">${lo.super === x.id ? "✓" : "Equip"}</button></div>`).join("");
      const cs = Object.values(c.charms).filter((x) => own(x.id)).map((x) => `<div class="shop-item ${lo.charm === x.id ? "equipped" : ""}"><h3>${x.name}</h3><p>${x.desc}</p><button class="btn small" data-c="${x.id}">${lo.charm === x.id ? "✓ (remove)" : "Equip"}</button></div>`).join("");
      const d = this.setScreen(`<div class="panel"><h2>Loadout</h2><div class="stat">Weapons (2 slots)</div><div class="shop-grid">${ws}</div>
        <div class="stat">Super</div><div class="shop-grid">${ss}</div><div class="stat">Charm</div><div class="shop-grid">${cs || `<p class="hint">Buy charms at the paan stall.</p>`}</div>
        <div class="row" style="margin-top:10px"><button class="btn" data-a="back">Done</button></div></div>`);
      d.querySelectorAll<HTMLButtonElement>("[data-w]").forEach((b) => b.addEventListener("click", () => { this.store.update((x) => {
        const id = b.dataset.w!;
        const i = x.loadout.weapons.indexOf(id);
        if (i >= 0) { if (x.loadout.weapons.length > 1) x.loadout.weapons.splice(i, 1); }
        else { x.loadout.weapons.push(id); if (x.loadout.weapons.length > 2) x.loadout.weapons.shift(); }
      }); render(); }));
      d.querySelectorAll<HTMLButtonElement>("[data-s]").forEach((b) => b.addEventListener("click", () => { this.store.update((x) => (x.loadout.super = b.dataset.s!)); render(); }));
      d.querySelectorAll<HTMLButtonElement>("[data-c]").forEach((b) => b.addEventListener("click", () => { this.store.update((x) => (x.loadout.charm = x.loadout.charm === b.dataset.c ? "" : b.dataset.c!)); render(); }));
      d.querySelector('[data-a="back"]')!.addEventListener("click", back);
    };
    render();
  }

  settings(back: () => void) {
    const s = this.store.data.settings;
    const d = this.setScreen(`<div class="panel"><h2>Settings</h2>
      <label class="stat">Music <input type="range" min="0" max="1" step="0.05" value="${s.music}" data-k="music"></label><br>
      <label class="stat">SFX <input type="range" min="0" max="1" step="0.05" value="${s.sfx}" data-k="sfx"></label><br>
      <label class="stat"><input type="checkbox" data-k="haptics" ${s.haptics ? "checked" : ""}> Haptics</label><br>
      <label class="stat"><input type="checkbox" data-k="autofire" ${s.autofire ? "checked" : ""}> Auto-fire (hold SHOOT to pause firing)</label><br>
      <label class="stat"><input type="checkbox" data-k="showSafe" ${s.showSafe ? "checked" : ""}> Show thumb safe zones</label><br>
      <label class="stat"><input type="checkbox" data-k="muted" ${s.muted ? "checked" : ""}> Mute</label>
      <div class="row" style="margin-top:10px"><button class="btn alt" data-a="reset">Reset save</button><button class="btn" data-a="back">Done</button></div></div>`);
    d.querySelectorAll<HTMLInputElement>("input").forEach((inp) => inp.addEventListener("input", () => {
      this.store.update((x) => { const k = inp.dataset.k as keyof typeof s; (x.settings as unknown as Record<string, unknown>)[k] = inp.type === "checkbox" ? inp.checked : Number(inp.value); });
      this.applySettings();
    }));
    d.querySelector('[data-a="reset"]')!.addEventListener("click", () => { if (confirm("Erase all progress?")) { this.store.reset(); this.applySettings(); } });
    d.querySelector('[data-a="back"]')!.addEventListener("click", back);
  }

  layoutEditor(back: () => void) {
    const t = this.touch;
    if (!t) return back();
    this.clearScreen();
    t.el.style.display = "";
    t.setEditing(true);
    t.showSafeZones(true);
    const bar = document.createElement("div");
    bar.className = "editor-bar";
    bar.innerHTML = `<button class="btn small" data-a="mirror">⇋ Left-handed</button><button class="btn small alt" data-a="reset">Reset</button><button class="btn small alt" data-a="export">Copy KDL</button><button class="btn small" data-a="done">Done</button>`;
    this.ui.appendChild(bar);
    bar.querySelector('[data-a="mirror"]')!.addEventListener("click", () => { t.mirror(); t.saveLayout(); t.showSafeZones(true); });
    bar.querySelector('[data-a="reset"]')!.addEventListener("click", () => t.resetLayout());
    bar.querySelector('[data-a="export"]')!.addEventListener("click", () => { void navigator.clipboard?.writeText(t.exportKdl()); this.audio.play("coin"); });
    bar.querySelector('[data-a="done"]')!.addEventListener("click", () => {
      t.setEditing(false); t.saveLayout(); t.showSafeZones(this.store.data.settings.showSafe); bar.remove(); t.el.style.display = "none"; back();
    });
  }

  // ── gameplay ──
  async fight(kind: "boss" | "level", id: string, startPhase = 0, seed?: number) {
    this.leaveGameplay();
    this.clearScreen();
    this.hud.show(true);
    if (this.touch) { this.touch.el.style.display = ""; this.touch.enabled = true; }
    const pauseBtn = document.createElement("button");
    pauseBtn.className = "pause-btn";
    pauseBtn.textContent = "II";
    pauseBtn.onclick = () => this.pause();
    this.hud.el.appendChild(pauseBtn);
    const lo = this.store.data.loadout;
    const s = new Session(
      { content: this.b.content, view: this.view, hud: this.hud, audio: this.audio, haptics: this.haptics, touch: this.touch, merger: this.merger, clock: this.engine.clock },
      kind, id, { weapons: lo.weapons.slice(), super: lo.super, charm: lo.charm }, (r) => this.results(r), seed,
    );
    s.onPause = () => this.pause();
    this.session = s;
    await s.start();
    for (let i = 0; i < startPhase; i++) { const b = s.world.boss; const ph = s.world.phase; if (b && ph?.until != null) { b.hp = b.maxHp * ph.until - 1; s.world.nextPhase(); } }
    this.engine.scene = s;
  }

  pause() {
    const s = this.session;
    if (!s || s.ended) return;
    s.paused = true;
    const d = this.setScreen(`<div class="panel"><h2>Ruko zara…</h2><div class="row" style="flex-direction:column">
      <button class="btn" data-a="resume">Resume</button><button class="btn alt" data-a="retry">Retry</button>
      <button class="btn alt" data-a="settings">Settings</button><button class="btn alt" data-a="quit">Back to island</button></div></div>`);
    d.querySelector('[data-a="resume"]')!.addEventListener("click", () => { this.clearScreen(); s.paused = false; });
    d.querySelector('[data-a="retry"]')!.addEventListener("click", () => void this.fight(s.kind, s.id));
    d.querySelector('[data-a="settings"]')!.addEventListener("click", () => this.settings(() => this.pause()));
    d.querySelector('[data-a="quit"]')!.addEventListener("click", () => { s.ended = true; void this.toOverworld(); });
  }

  private results(r: SessionResult) {
    if (r.result === "win") this.store.update((x) => { x.coins += r.reward; if (!x.beaten.includes(r.id)) x.beaten.push(r.id); });
    else if (r.coins) this.store.update((x) => { x.coins += r.coins; });
    const win = r.result === "win";
    const grade = !win ? "-" : r.hpLeft >= 3 && r.parries >= 3 ? "S" : r.hpLeft >= 2 ? "A" : r.hpLeft >= 1 ? "B" : "C";
    const d = this.setScreen(`<div class="panel"><h2>${win ? "Jeet gaye!" : "Haar gaye…"}</h2>
      <div class="stat">Time: ${r.time.toFixed(1)}s · HP left: ${r.hpLeft} · Parries: ${r.parries} · Supers: ${r.supers}</div>
      ${!win ? `<div class="stat">Progress: <progress value="${r.progress}" max="1"></progress> ${(r.progress * 100) | 0}%</div>` : `<div class="stat">Grade: ${grade} · Earned ◎ ${r.reward}</div>`}
      <div class="row" style="margin-top:10px"><button class="btn" data-a="again">${win ? "Replay" : "Retry"}</button><button class="btn alt" data-a="island">Island</button></div></div>`);
    d.querySelector('[data-a="again"]')!.addEventListener("click", () => void this.fight(r.kind, r.id));
    d.querySelector('[data-a="island"]')!.addEventListener("click", () => {
      if (win && r.id === "raj") return this.story("ending", () => void this.toOverworld());
      void this.toOverworld();
    });
  }

  private leaveGameplay() {
    if (this.session) { this.session.ended = true; this.session = null; }
    this.engine.clock.scale = 1;
    this.audio.glideLoop(false);
    this.hud?.clear();
    this.hud?.show(false);
    this.hud?.el.querySelectorAll(".pause-btn").forEach((n) => n.remove());
    if (this.touch) this.touch.el.style.display = "none";
  }
}
