// Comic-panel cutscenes from content/story.kdl: tap to reveal the next panel; Hinglish bubbles
// in the hand-lettered font. Panels are DOM; art is SVG (themed by CSS tokens).
import type { StoryDef } from "../core/content";
import type { Tokens } from "../core/tokens";

export class Comic {
  el: HTMLDivElement;
  private page: HTMLDivElement;
  private i = 0;
  onDone: () => void = () => {};
  private onKey = (e: KeyboardEvent) => { if (["Space", "Enter", "KeyZ", "KeyX", "ArrowRight"].includes(e.code)) this.next(); if (e.code === "Escape") this.onDone(); };

  constructor(parent: HTMLElement, private story: StoryDef | undefined, private svgs: Record<string, string>, private tokens: Tokens) {
    this.el = document.createElement("div");
    this.el.className = "comic";
    this.el.innerHTML = `<div class="comic-page"></div><button class="btn small alt comic-next">Skip ⏭</button>`;
    parent.appendChild(this.el);
    this.page = this.el.querySelector(".comic-page")!;
    this.el.addEventListener("pointerdown", (e) => { if ((e.target as HTMLElement).classList.contains("comic-next")) return; this.next(); });
    this.el.querySelector(".comic-next")!.addEventListener("click", () => this.onDone());
    window.addEventListener("keydown", this.onKey);
    if (!story || !story.panels.length) { setTimeout(() => this.onDone(), 0); return; }
    this.next();
  }

  private art(id: string): string {
    const key = `art/${id}.svg`;
    const svg = this.svgs[key];
    if (!svg) return "";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(this.tokens.substitute(svg));
  }

  next() {
    const st = this.story;
    if (!st) return;
    if (this.i >= st.panels.length) return this.onDone();
    const p = st.panels[this.i];
    const prev = this.page.children.length;
    const wide = p.layout === "wide" || p.layout === "full";
    if (wide || prev >= 2 || (prev === 1 && (this.page.children[0] as HTMLElement).dataset.wide)) this.page.innerHTML = "";
    const n = this.page.children.length;
    const panel = document.createElement("div");
    panel.className = `comic-panel comic-bg-${p.bg}`;
    if (wide) panel.dataset.wide = "1";
    Object.assign(panel.style, wide ? { left: "0", top: "0", width: "100%", height: "100%" } : { left: n === 0 ? "0" : "51%", top: n === 0 ? "0" : "4%", width: "49%", height: "96%", transform: `rotate(${n === 0 ? -1 : 1.2}deg)` });
    let html = "";
    for (const a of p.art) {
      const src = this.art(a.id);
      if (src) html += `<div class="art" style="left:${a.x}%;top:${a.y}%;height:${a.s * 55}%;"><img src="${src}" style="height:100%;${a.flip ? "transform:scaleX(-1)" : ""}" draggable="false"></div>`;
    }
    if (p.caption) html += `<div class="caption"></div>`;
    for (const b of p.bubbles) html += `<div class="bubble ${b.kind} tail-${b.tail}" style="left:${b.x}%;top:${b.y}%">${b.who && b.kind !== "sfx" ? `<span class="who"></span>` : ""}<span class="txt"></span></div>`;
    panel.innerHTML = html;
    if (p.caption) panel.querySelector(".caption")!.textContent = p.caption;
    const bs = panel.querySelectorAll(".bubble");
    p.bubbles.forEach((b, k) => {
      const w = bs[k].querySelector(".who"); if (w) w.textContent = b.who;
      bs[k].querySelector(".txt")!.textContent = b.text;
      (bs[k] as HTMLElement).style.animationDelay = `${0.25 + k * 0.35}s`;
    });
    this.page.appendChild(panel);
    this.i++;
  }

  dispose() { window.removeEventListener("keydown", this.onKey); this.el.remove(); }
}
