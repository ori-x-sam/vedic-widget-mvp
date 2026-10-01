// Touch controls. Left thumb: floating joystick anywhere in the left zone. Right thumb: an arc of
// buttons (positions from content/controls.kdl, overridable by the layout editor -> localStorage).
// Sliding a thumb from one button onto another presses the new one (jump -> parry roll).
import type { ControlButton, ControlsDef } from "../core/content";
import type { RawInput, Button } from "../core/input";
import { stringifyKdl, KdlNode } from "../core/kdl";

const STORE = "slummonkey.layout.v1";

export interface Layout { buttons: ControlButton[]; mirrored: boolean; joyZone: number; joyRadius: number }

const ICONS: Record<string, string> = {
  shoot: `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="9" fill="none" stroke="currentColor" stroke-width="4"/><path d="M20 3v8M20 29v8M3 20h8M29 20h8" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  jump: `<svg viewBox="0 0 40 40"><path d="M8 26 L20 12 L32 26" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 34h16" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>`,
  parry: `<svg viewBox="0 0 40 40"><path d="M20 4 C 26 14, 26 14, 36 20 C 26 26, 26 26, 20 36 C 14 26, 14 26, 4 20 C 14 14, 14 14, 20 4Z" fill="currentColor"/><circle cx="20" cy="20" r="5" fill="#fff"/></svg>`,
  blink: `<svg viewBox="0 0 40 40"><path d="M6 20h14M10 12h10M10 28h10" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.6"/><path d="M22 8 L34 20 L22 32" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  ex: `<svg viewBox="0 0 40 40"><text x="20" y="27" font-size="16" font-weight="900" text-anchor="middle" fill="currentColor" font-family="sans-serif">EX</text></svg>`,
  lock: `<svg viewBox="0 0 40 40"><rect x="9" y="18" width="22" height="16" rx="3" fill="currentColor"/><path d="M13 18 v-5 a7 7 0 0 1 14 0 v5" fill="none" stroke="currentColor" stroke-width="4"/></svg>`,
  swap: `<svg viewBox="0 0 40 40"><path d="M8 14h20l-5-5M32 26H12l5 5" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  pause: `<svg viewBox="0 0 40 40"><rect x="10" y="8" width="7" height="24" fill="currentColor"/><rect x="23" y="8" width="7" height="24" fill="currentColor"/></svg>`,
};
const COLOR_VAR: Record<string, string> = { shoot: "--btn-shoot", jump: "--btn-jump", parry: "--btn-parry", blink: "--btn-blink", ex: "--btn-ex", lock: "--paper", swap: "--paper", pause: "--paper" };

export class TouchControls {
  el: HTMLDivElement;
  layout: Layout;
  private btnEls = new Map<string, HTMLDivElement>();
  private joyBase: HTMLDivElement; private joyKnob: HTMLDivElement;
  private joyTouch: number | null = null; private joyOrigin = [0, 0]; private joy = [0, 0];
  private touchBtn = new Map<number, string>();
  private held: Partial<Record<Button, boolean>> = {};
  private toggles = { lock: false, autofire: false };
  editing = false;
  onPause: () => void = () => {};
  enabled = true;

  constructor(parent: HTMLElement, public defaults: ControlsDef) {
    this.layout = this.loadLayout();
    this.el = document.createElement("div");
    this.el.className = "touch";
    parent.appendChild(this.el);
    this.joyBase = document.createElement("div");
    this.joyBase.className = "joy-base";
    this.joyKnob = document.createElement("div");
    this.joyKnob.className = "joy-knob";
    this.joyBase.appendChild(this.joyKnob);
    this.el.appendChild(this.joyBase);
    this.build();
    const opts = { passive: false } as AddEventListenerOptions;
    this.el.addEventListener("touchstart", (e) => this.onTouch(e, "start"), opts);
    this.el.addEventListener("touchmove", (e) => this.onTouch(e, "move"), opts);
    this.el.addEventListener("touchend", (e) => this.onTouch(e, "end"), opts);
    this.el.addEventListener("touchcancel", (e) => this.onTouch(e, "end"), opts);
    window.addEventListener("resize", () => this.place());
  }

  static defaultLayout(d: ControlsDef): Layout {
    return { buttons: d.buttons.map((b) => ({ ...b })), mirrored: false, joyZone: d.joystick.zone, joyRadius: d.joystick.radius };
  }

  private loadLayout(): Layout {
    try {
      const s = localStorage.getItem(STORE);
      if (s) {
        const l = JSON.parse(s) as Layout;
        // keep any new buttons added to the KDL defaults since the save
        for (const b of this.defaults.buttons) if (!l.buttons.find((x) => x.id === b.id)) l.buttons.push({ ...b });
        return l;
      }
    } catch { /* storage blocked */ }
    return TouchControls.defaultLayout(this.defaults);
  }

  saveLayout() { try { localStorage.setItem(STORE, JSON.stringify(this.layout)); } catch { /* ignore */ } }
  resetLayout() { this.layout = TouchControls.defaultLayout(this.defaults); try { localStorage.removeItem(STORE); } catch { /* ignore */ } this.build(); }

  /** Left-handed mirror: buttons flip horizontally, joystick zone moves to the right. */
  mirror() {
    this.layout.mirrored = !this.layout.mirrored;
    for (const b of this.layout.buttons) b.x = 1 - b.x;
    this.build();
  }

  exportKdl(): string {
    const n: KdlNode = {
      name: "controls", args: [], props: {}, line: 0,
      children: [
        { name: "joystick", args: [], props: { zone: this.layout.joyZone, dead: this.defaults.joystick.dead, radius: this.layout.joyRadius, side: this.layout.mirrored ? "right" : "left" }, children: [], line: 0 },
        ...this.layout.buttons.map((b) => ({ name: "button", args: [b.id], props: { x: b.x, y: b.y, r: b.r, shape: b.shape, icon: b.icon, hit: b.hit }, children: [], line: 0 })),
        ...this.defaults.safe.map((s) => ({ name: "safe-zone", args: [s.id], props: { x: s.x, y: s.y, w: s.w, h: s.h }, children: [], line: 0 })),
      ],
    };
    return stringifyKdl([n]);
  }

  private build() {
    for (const el of this.btnEls.values()) el.remove();
    this.btnEls.clear();
    for (const b of this.layout.buttons) {
      const el = document.createElement("div");
      el.className = `tbtn shape-${b.shape}`;
      el.dataset.id = b.id;
      el.style.setProperty("--c", `var(${COLOR_VAR[b.icon] ?? "--paper"})`);
      el.innerHTML = `<div class="face">${ICONS[b.icon] ?? b.id}</div><div class="handle"></div>`;
      this.el.appendChild(el);
      this.btnEls.set(b.id, el);
      this.attachEditor(el, b);
    }
    this.place();
  }

  private place() {
    const W = this.el.clientWidth || window.innerWidth, H = this.el.clientHeight || window.innerHeight;
    for (const b of this.layout.buttons) {
      const el = this.btnEls.get(b.id)!;
      const size = b.r * 2 * H;
      el.style.left = `${b.x * W}px`; el.style.top = `${b.y * H}px`;
      el.style.width = el.style.height = `${size}px`;
    }
  }

  private hitButton(x: number, y: number): ControlButton | null {
    const W = this.el.clientWidth, H = this.el.clientHeight;
    let best: ControlButton | null = null, bd = Infinity;
    for (const b of this.layout.buttons) {
      const d = Math.hypot(x - b.x * W, y - b.y * H);
      const r = b.r * H * b.hit; // touch zone larger than the art
      if (d < r && d < bd) { bd = d; best = b; }
    }
    return best;
  }

  private inJoyZone(x: number) {
    const W = this.el.clientWidth;
    return this.layout.mirrored ? x > W * (1 - this.layout.joyZone) : x < W * this.layout.joyZone;
  }

  private onTouch(e: TouchEvent, phase: "start" | "move" | "end") {
    if (this.editing || !this.enabled) return;
    e.preventDefault();
    const rect = this.el.getBoundingClientRect();
    for (const t of Array.from(e.changedTouches)) {
      const x = t.clientX - rect.left, y = t.clientY - rect.top;
      if (phase === "start") {
        const b = this.hitButton(x, y);
        if (b) { this.pressButton(t.identifier, b.id); continue; }
        if (this.joyTouch === null && this.inJoyZone(x)) {
          this.joyTouch = t.identifier;
          this.joyOrigin = [x, y]; this.joy = [0, 0];
          this.joyBase.style.left = `${x}px`; this.joyBase.style.top = `${y}px`;
          this.joyBase.style.setProperty("--r", String(this.layout.joyRadius));
          this.joyBase.classList.add("on");
          this.joyKnob.style.transform = "";
        }
      } else if (phase === "move") {
        if (t.identifier === this.joyTouch) {
          const R = this.layout.joyRadius;
          let dx = x - this.joyOrigin[0], dy = y - this.joyOrigin[1];
          const m = Math.hypot(dx, dy);
          if (m > R) {
            // the base follows the thumb so it never "runs out" of stick
            const k = (m - R) / m;
            this.joyOrigin[0] += dx * k; this.joyOrigin[1] += dy * k;
            this.joyBase.style.left = `${this.joyOrigin[0]}px`; this.joyBase.style.top = `${this.joyOrigin[1]}px`;
            dx = x - this.joyOrigin[0]; dy = y - this.joyOrigin[1];
          }
          this.joy = [dx / R, -dy / R];
          this.joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
        } else if (this.touchBtn.has(t.identifier)) {
          const b = this.hitButton(x, y);
          const cur = this.touchBtn.get(t.identifier)!;
          if (b && b.id !== cur && b.id !== "lock" && b.id !== "pause") { this.releaseButton(t.identifier); this.pressButton(t.identifier, b.id); }
        }
      } else {
        if (t.identifier === this.joyTouch) {
          this.joyTouch = null; this.joy = [0, 0];
          this.joyBase.classList.remove("on");
        } else this.releaseButton(t.identifier);
      }
    }
  }

  private pressButton(touchId: number, id: string) {
    this.touchBtn.set(touchId, id);
    const el = this.btnEls.get(id);
    el?.classList.add("down");
    if (id === "lock") { this.toggles.lock = !this.toggles.lock; el?.classList.toggle("toggled", this.toggles.lock); this.joyKnob.classList.toggle("locked", this.toggles.lock); return; }
    if (id === "pause") { this.onPause(); return; }
    this.held[id as Button] = true;
  }

  private releaseButton(touchId: number) {
    const id = this.touchBtn.get(touchId);
    if (!id) return;
    this.touchBtn.delete(touchId);
    if ([...this.touchBtn.values()].includes(id)) return;
    const el = this.btnEls.get(id);
    el?.classList.remove("down");
    el?.classList.add("recent");
    setTimeout(() => el?.classList.remove("recent"), 600);
    if (id !== "lock" && id !== "pause") this.held[id as Button] = false;
  }

  setAutoFire(on: boolean) { this.toggles.autofire = on; }
  setReady(id: string, on: boolean) { this.btnEls.get(id)?.classList.toggle("ready", on); }
  setCooldown(id: string, on: boolean) { this.btnEls.get(id)?.classList.toggle("cooldown", on); }

  source(): () => RawInput | null {
    return () => {
      if (!this.enabled) return null;
      const held = { ...this.held };
      if (this.toggles.lock) held.lock = true;
      if (this.toggles.autofire) held.shoot = !held.shoot; // auto-fire: holding shoot pauses fire
      return { x: this.joy[0], y: this.joy[1], held };
    };
  }

  // ── layout editor: drag to move, drag the corner handle to resize ──
  setEditing(on: boolean) {
    this.editing = on;
    this.el.classList.toggle("editor-on", on);
    for (const id of [...this.touchBtn.keys()]) this.releaseButton(id);
  }

  private attachEditor(el: HTMLDivElement, b: ControlButton) {
    let mode: "move" | "size" | null = null;
    let sx = 0, sy = 0, bx = 0, by = 0, br = 0;
    const down = (e: PointerEvent) => {
      if (!this.editing) return;
      e.stopPropagation();
      mode = (e.target as HTMLElement).classList.contains("handle") ? "size" : "move";
      sx = e.clientX; sy = e.clientY; bx = b.x; by = b.y; br = b.r;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!mode) return;
      const W = this.el.clientWidth, H = this.el.clientHeight;
      if (mode === "move") { b.x = Math.min(0.98, Math.max(0.02, bx + (e.clientX - sx) / W)); b.y = Math.min(0.98, Math.max(0.02, by + (e.clientY - sy) / H)); }
      else b.r = Math.min(0.2, Math.max(0.035, br + (e.clientX - sx + e.clientY - sy) / (2 * H)));
      this.place();
    };
    const up = () => { if (mode) { mode = null; this.saveLayout(); } };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }

  /** Draw the safe zones (from KDL) so the layout editor shows where threats never go. */
  showSafeZones(on: boolean) {
    this.el.querySelectorAll(".safe-overlay").forEach((n) => n.remove());
    if (!on) return;
    for (const s of this.defaults.safe) {
      const d = document.createElement("div");
      d.className = "safe-overlay";
      const x = this.layout.mirrored ? 1 - s.x - s.w : s.x;
      Object.assign(d.style, { left: `${x * 100}%`, bottom: `${s.y * 100}%`, width: `${s.w * 100}%`, height: `${s.h * 100}%` });
      this.el.appendChild(d);
    }
  }
}
