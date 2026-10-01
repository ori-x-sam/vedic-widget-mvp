// DOM HUD: hearts, SPECIAL meter, boss bar with phase ticks (or level progress), coins, banners
// (look/hud.css @keyframes), speech bubbles.
import type { World } from "../rules/world";

export class Hud {
  el: HTMLDivElement;
  private hp: HTMLDivElement; private cards: HTMLDivElement; private weapon: HTMLDivElement; private coins: HTMLDivElement;
  private bubbles: { el: HTMLDivElement; id: number; t: number; dur: number; x: number; y: number }[] = [];
  private last = "";
  private bossBar: HTMLDivElement;
  private barKey = "";

  constructor(parent: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "layer";
    this.el.innerHTML = `<div class="hud"><div class="hp-phone"><div class="cells"></div></div><div class="meter"><div class="cards"></div><div class="weapon-tag"></div></div></div>
      <div class="boss-bar"><div class="name"></div><div class="track"><div class="fill"></div><div class="ticks"></div></div></div><div class="coins-tag"></div>`;
    parent.appendChild(this.el);
    this.bossBar = this.el.querySelector(".boss-bar")!;
    this.hp = this.el.querySelector(".hp-phone")!;
    this.cards = this.el.querySelector(".cards")!;
    this.weapon = this.el.querySelector(".weapon-tag")!;
    this.coins = this.el.querySelector(".coins-tag")!;
  }

  update(w: World, weaponName: string, project: (x: number, y: number) => [number, number], dt: number) {
    const p = w.player;
    // boss health (with phase ticks) or level progress
    const b = w.boss, def = w.bossDef, lvl = w.level;
    let frac = -1, name = "";
    if (b && def) { frac = Math.max(0, b.hp / b.maxHp); name = def.name; }
    else if (lvl && w.mode === "run") { frac = Math.min(1, Math.max(0, w.camX / Math.max(1, lvl.length))); name = lvl.name; }
    const bk = `${name}|${frac.toFixed(3)}`;
    if (bk !== this.barKey) {
      if (name !== this.barKey.split("|")[0]) {
        this.bossBar.querySelector(".name")!.textContent = name;
        this.bossBar.querySelector(".ticks")!.innerHTML = (def?.phases ?? []).filter((ph) => ph.until != null).map((ph) => `<i style="left:${(ph.until! * 100).toFixed(1)}%"></i>`).join("");
        this.bossBar.classList.toggle("level", !def);
      }
      this.barKey = bk;
      this.bossBar.style.display = frac < 0 ? "none" : "";
      (this.bossBar.querySelector(".fill") as HTMLDivElement).style.width = `${Math.max(0, frac) * 100}%`;
    }
    const key = `${p.hp}|${p.cards.toFixed(2)}|${weaponName}|${w.coins}`;
    if (key !== this.last) {
      this.last = key;
      // HP is a phone battery: one cell per hit point, cracked screen when it's the last one
      this.hp.querySelector(".cells")!.innerHTML = Array.from({ length: p.maxHp }, (_, i) => `<i class="${i < p.hp ? "on" : ""}">♥</i>`).join("");
      this.hp.classList.toggle("low", p.hp === 1);
      this.hp.classList.toggle("dead", p.hp <= 0);
      let html = "";
      for (let i = 0; i < p.maxCards; i++) {
        const fill = Math.max(0, Math.min(1, p.cards - i));
        html += `<div class="card ${fill >= 1 ? "full" : ""}"><div class="fill" style="width:${fill * 100}%"></div></div>`;
      }
      this.cards.innerHTML = html;
      this.cards.classList.toggle("super", p.cards >= p.maxCards);
      this.weapon.textContent = weaponName;
      this.coins.textContent = w.coins ? `◎ ${w.coins}` : "";
    }
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.t += dt;
      const e = w.ent(b.id);
      if (e) { b.x = e.x; b.y = e.y + e.h * e.scale + 20; }
      const [sx, sy] = project(b.x, b.y);
      b.el.style.left = `${sx}px`; b.el.style.top = `${sy}px`;
      if (b.t > b.dur) { b.el.remove(); this.bubbles.splice(i, 1); }
    }
  }

  banner(kind: "intro" | "phase" | "ko" | "lose" | "card", big: string, sub = "", dur = 1.8) {
    const d = document.createElement("div");
    d.className = `banner ${kind}`;
    d.innerHTML = `<div class="big"></div>${sub ? `<div class="sub"></div>` : ""}`;
    d.querySelector(".big")!.textContent = big;
    if (sub) d.querySelector(".sub")!.textContent = sub;
    this.el.appendChild(d);
    setTimeout(() => d.remove(), dur * 1000 + 600);
  }

  say(who: string, text: string, x: number, y: number, dur: number, id = 0) {
    const el = document.createElement("div");
    el.className = "bubble";
    el.innerHTML = `<span class="who"></span><span class="txt"></span>`;
    el.querySelector(".who")!.textContent = who;
    el.querySelector(".txt")!.textContent = text;
    this.el.appendChild(el);
    this.bubbles.push({ el, id, t: 0, dur, x, y });
  }

  clear() { for (const b of this.bubbles) b.el.remove(); this.bubbles = []; this.el.querySelectorAll(".banner").forEach((n) => n.remove()); }
  show(on: boolean) { this.el.style.display = on ? "" : "none"; }
}
