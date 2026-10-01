// CSS-token reader. look/*.css is the single source of truth for every visual number.
// Works headless (parses :root custom properties from text) and in the browser.

export type RGB = [number, number, number];

export function parseCssTokens(cssText: string): Record<string, string> {
  const out: Record<string, string> = {};
  const noComments = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const blockRe = /:root\s*\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(noComments))) {
    const body = m[1];
    const declRe = /(--[\w-]+)\s*:\s*([^;]+);?/g;
    let d: RegExpExecArray | null;
    while ((d = declRe.exec(body))) out[d[1]] = d[2].trim();
  }
  return out;
}

export class Tokens {
  constructor(public raw: Record<string, string>) {}

  static fromCss(...files: string[]) {
    const raw: Record<string, string> = {};
    for (const f of files) Object.assign(raw, parseCssTokens(f));
    return new Tokens(raw);
  }

  has(name: string) { return name in this.raw; }

  str(name: string, d = ""): string {
    let v = this.raw[name];
    if (v == null) return d;
    // resolve var(--x) references
    for (let k = 0; k < 8 && v.includes("var("); k++) {
      v = v.replace(/var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)/g, (_, n: string, fb?: string) => this.raw[n] ?? fb ?? "");
    }
    return v.trim().replace(/^"(.*)"$/, "$1");
  }

  num(name: string, d = 0): number {
    const s = this.str(name);
    if (!s) return d;
    const n = parseFloat(s);
    if (Number.isNaN(n)) return d;
    if (s.endsWith("ms")) return n / 1000;
    return n;
  }

  /** Color as linear-ish 0..1 RGB (sRGB values, not linearized). */
  color(name: string, d: RGB = [1, 0, 1]): RGB {
    const s = this.str(name);
    return s ? parseColor(s) ?? d : d;
  }

  hex(name: string, d = "#ff00ff"): string {
    const c = this.color(name, parseColor(d)!);
    return "#" + c.map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
  }

  vec(name: string, d: number[] = []): number[] {
    const s = this.str(name);
    if (!s) return d;
    return s.split(/[\s,]+/).map(parseFloat).filter((x) => !Number.isNaN(x));
  }

  /** Replace var(--token) occurrences inside arbitrary text (used to theme SVG parts). */
  substitute(text: string): string {
    return text.replace(/var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)/g, (_, n: string, fb?: string) => this.str(n, fb ?? "magenta"));
  }

  /** Merge computed values from a live document (browser), overriding parsed text. */
  mergeComputed(el: Element) {
    const cs = getComputedStyle(el);
    for (const k of Object.keys(this.raw)) {
      const v = cs.getPropertyValue(k).trim();
      if (v) this.raw[k] = v;
    }
  }
}

export function parseColor(s: string): RGB | null {
  s = s.trim();
  let m = /^#([0-9a-f]{3,8})$/i.exec(s);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  }
  m = /^rgba?\(([^)]+)\)$/i.exec(s);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    return [p[0] / 255, p[1] / 255, p[2] / 255];
  }
  m = /^hsla?\(([^)]+)\)$/i.exec(s);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
    return hsl(p[0], p[1] / 100, p[2] / 100);
  }
  return null;
}

function hsl(h: number, s: number, l: number): RGB {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}
