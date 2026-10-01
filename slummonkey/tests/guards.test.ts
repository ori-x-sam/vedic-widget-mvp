// Architecture guards. These keep the game editable: plain-text content must only use words that
// exist, every word must be documented, ids must resolve, and rule code must never touch view code.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { loadContent } from "../src/core/content";
import { parseCssTokens } from "../src/core/tokens";
import { WORDS } from "../src/rules/vocab/registry";
import { allUsages, walkWords } from "../src/rules/vocab/walk";
import { buildCatalog } from "../tools/catalog";
import { nodeKdlFiles, nodeCssFiles, nodeSvgFiles, ROOT } from "../tools/node-sources";
import { ANIMS, MaterialBank } from "../src/view/model";
import { StageBuilder } from "../src/view/stage3d";
const SHAPES = ["box", "ball", "sphere", "cyl", "cone", "torus", "dome", "gem", "tetra", "wedge", "coin", "plane", "none"];

const content = loadContent(nodeKdlFiles());
const tokens = parseCssTokens(Object.values(nodeCssFiles()).join("\n"));
const svgs = nodeSvgFiles();
const usages = [...allUsages(content)];

const walk = (dir: string, out: string[] = []): string[] => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out); else if (p.endsWith(".ts")) out.push(p);
  }
  return out;
};

describe("vocabulary drift", () => {
  it("content parses with no errors", () => expect(content.errors).toEqual([]));

  it("every word used in content exists in the registry", () => {
    const missing = usages.filter((u) => !WORDS[u.word]).map((u) => `${u.word} (${u.where}, ${u.node.file}:${u.node.line})`);
    expect(missing).toEqual([]);
  });

  it("every word in the registry is documented in one line with a signature", () => {
    for (const w of Object.values(WORDS)) {
      expect(w.doc.trim().length, w.name).toBeGreaterThan(10);
      expect(w.doc.includes("\n"), w.name).toBe(false);
      expect(["flow", "move", "attack", "telegraph", "state", "parry", "stage"]).toContain(w.kind);
    }
  });

  it("VOCABULARY.md is up to date (run: npm run catalog)", () => {
    expect(readFileSync(join(ROOT, "VOCABULARY.md"), "utf8")).toBe(buildCatalog());
  });

  it("each boss is only a stack of words: phases have scripts, thresholds descend", () => {
    for (const b of Object.values(content.bosses)) {
      expect(b.phases.length, b.id).toBeGreaterThanOrEqual(3);
      const until = b.phases.map((p) => p.until ?? 0);
      for (let i = 1; i < until.length; i++) expect(until[i], `${b.id} phase ${i}`).toBeLessThan(until[i - 1]);
      expect(b.phases.at(-1)!.until, `${b.id} last phase must run to 0`).toBeNull();
    }
  });
});

describe("rules never import view", () => {
  const rules = walk(join(ROOT, "src/rules")).concat(walk(join(ROOT, "src/core")), walk(join(ROOT, "src/bot")));
  for (const f of rules) {
    const rel = relative(ROOT, f);
    it(`${rel} stays headless`, () => {
      const src = readFileSync(f, "utf8");
      const imports = [...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
      for (const i of imports) {
        expect(i, `${rel} imports ${i}`).not.toMatch(/\/view\/|\/shell\/|^three$|^three\//);
      }
      if (!rel.startsWith("src/core/sources") && !rel.startsWith("src/core/engine")) expect(src, rel).not.toMatch(/\bdocument\.|\bwindow\./);
      if (rel.startsWith("src/rules")) expect(src, `${rel} must use the seeded Rng`).not.toMatch(/Math\.random/);
    });
  }
});

describe("ids resolve (KDL ↔ CSS ↔ SVG)", () => {
  const projUsed = new Set<string>(), puppetUsed = new Set<string>(), minionUsed = new Set<string>(), stagesUsed = new Set<string>(), themesUsed = new Set<string>();
  const PROJ_WORDS: Record<string, number> = { shoot: 0, volley: 3, spray: 2, ring: 2, spiral: 4, lob: 1, rain: 1, homing: 1, juggle: 1, "graph-shot": 2 };
  for (const u of usages) {
    const n = u.node;
    if (u.word in PROJ_WORDS) {
      const v = n.args[PROJ_WORDS[u.word]];
      if (typeof v === "string") projUsed.add(v);
      if (typeof n.props.proj === "string") projUsed.add(n.props.proj);
    }
    for (const k of ["proj", "down"]) if (typeof n.props[k] === "string") projUsed.add(n.props[k] as string);
    if (u.word === "summon") minionUsed.add(String(n.args[0]));
    if (u.word === "rider" || u.word === "puppet" || u.word === "hide-under" && n.args[1]) puppetUsed.add(String(u.word === "hide-under" ? n.args[1] : n.args[0]));
    if (u.word === "stack" && n.props.puppet) puppetUsed.add(String(n.props.puppet));
    if (u.word === "bg") stagesUsed.add(String(n.args[0]));
    if (u.word === "theme") themesUsed.add(String(n.args[0]));
    if (u.word === "split") for (const p of n.children) puppetUsed.add(String(p.props.puppet ?? p.args[0]));
    if (u.word === "ride-platform" || u.word === "target") puppetUsed.add(String(n.args[0]));
    if (u.word === "bonus") puppetUsed.add(String(n.args[0]));
  }
  for (const b of Object.values(content.bosses)) { puppetUsed.add(b.puppet); stagesUsed.add(b.stage); themesUsed.add(b.theme); }
  for (const l of Object.values(content.levels)) { stagesUsed.add(l.stage); themesUsed.add(l.theme); }
  for (const m of Object.values(content.minions)) puppetUsed.add(m.puppet);
  for (const w of Object.values(content.weapons)) { projUsed.add(w.projectile); projUsed.add(w.ex); }
  for (const n of content.overworld.npcs) puppetUsed.add(n.puppet);
  ["slummonkey", "rickshaw", "platform", "token", "laddoo", "goal", "candle-red", "candle-green", "raft", "rope-platform"].forEach((p) => puppetUsed.add(p));

  it("every projectile used exists", () => expect([...projUsed].filter((p) => !content.projectiles[p])).toEqual([]));
  it("every minion summoned exists", () => expect([...minionUsed].filter((m) => !content.minions[m])).toEqual([]));
  it("every puppet used exists", () => expect([...puppetUsed].filter((p) => !content.puppets[p])).toEqual([]));
  it("every stage used exists, with sky tokens in look/stages.css", () => {
    expect([...stagesUsed].filter((s) => !content.stages[s])).toEqual([]);
    const kinds = new StageBuilder(new MaterialBank({ color: () => [1, 1, 1] } as never)).kindNames();
    for (const st of Object.values(content.stages)) {
      for (const t of st.sky) expect(tokens[t], `${st.id} sky ${t}`).toBeDefined();
      for (const pr of st.props) {
        expect(kinds, `${st.id} prop "${pr.kind}"`).toContain(pr.kind);
        for (const c of [pr.color, pr.color2]) if (c) expect(tokens[c], `${st.id} prop ${pr.kind} color ${c}`).toBeDefined();
      }
    }
    for (const st of Object.values(content.stages)) for (const l of st.layers) {
      if (l.art.startsWith("sky:")) { expect(tokens[`--sky-${l.art.slice(4)}-top`], `${st.id} ${l.art}`).toBeDefined(); expect(tokens[`--sky-${l.art.slice(4)}-bottom`]).toBeDefined(); }
      else expect(svgs[`art/${l.art}.svg`], `${st.id} layer ${l.art}`).toBeDefined();
    }
  });
  it("every music theme used exists", () => expect([...themesUsed].filter((t) => !content.themes[t])).toEqual([]));
  it("every model part is a known shape with a defined color token and anim", () => {
    for (const p of Object.values(content.puppets)) for (const part of p.parts) {
      const where = `${p.id}.${part.id}`;
      if (part.svg) { expect(svgs[`art/${part.svg}.svg`], `${where} → art/${part.svg}.svg`).toBeDefined(); continue; }
      expect(SHAPES, `${where} shape="${part.shape}"`).toContain(part.shape);
      if (part.shape !== "none") expect(tokens[part.color], `${where} color ${part.color}`).toBeDefined();
      expect(part.color, `${where}: --parry is reserved for parryable things`).not.toBe("--parry");
      if (part.anim) expect(ANIMS[part.anim], `${where} anim="${part.anim}"`).toBeDefined();
      if (part.parent) expect(p.parts.some((q) => q.id === part.parent), `${where} parent="${part.parent}"`).toBe(true);
    }
    for (const pr of Object.values(content.projectiles)) expect(svgs[`art/sprites/${pr.sprite}.svg`], `projectile ${pr.id} sprite`).toBeDefined();
  });
  it("every var(--token) used by SVG art is defined in look/*.css", () => {
    const missing = new Set<string>();
    for (const [f, s] of Object.entries(svgs)) for (const m of s.matchAll(/var\((--[\w-]+)\)/g)) if (!(m[1] in tokens)) missing.add(`${m[1]} in ${f}`);
    expect([...missing]).toEqual([]);
  });
  it("story art and overworld nodes resolve", () => {
    for (const st of Object.values(content.stories)) for (const p of st.panels) for (const a of p.art) expect(svgs[`art/${a.id}.svg`], `story ${st.id} art ${a.id}`).toBeDefined();
    for (const n of content.overworld.nodes) {
      expect(["shop", "stage", "tent-mela", "tent-gajraj", "tent-tigada", "tent-sky", "tent-dolly"], `node ${n.id} kind`).toContain(n.kind);
      if (n.level) expect(content.bosses[n.level] ?? content.levels[n.level], `node ${n.id} → ${n.level}`).toBeDefined();
      for (const r of n.requires.split(/\s+/).filter(Boolean)) expect(content.bosses[r] ?? content.levels[r], `requires ${r}`).toBeDefined();
    }
  });
  it("shop items exist", () => {
    for (const it of content.shop) expect(it.kind === "weapon" ? content.weapons[it.id] : it.kind === "super" ? content.supers[it.id] : content.charms[it.id], it.id).toBeDefined();
  });
});

describe("the parry color is reserved", () => {
  // Only art for things that are ALWAYS parryable (or the parry feedback itself) may use --parry.
  const ALLOWED = new Set(["art/sprites/marigold.svg", "art/sprites/petal.svg", "art/parts/gajraj/mahout.svg"]);
  it("no other SVG uses var(--parry)", () => {
    const offenders = Object.entries(svgs).filter(([f, s]) => s.includes("var(--parry)") && !ALLOWED.has(f)).map(([f]) => f);
    expect(offenders).toEqual([]);
  });
  it("no other CSS token or rule uses --parry except the parry button and parry glow", () => {
    const css = Object.entries(nodeCssFiles()).map(([f, s]) => [f, s.replace(/\/\*[\s\S]*?\*\//g, "")] as const);
    const uses = css.flatMap(([f, s]) => [...s.matchAll(/^.*var\(--parry\).*$/gm)].map((m) => `${f}: ${m[0].trim()}`));
    expect(uses.every((u) => /--btn-parry|--parry-glow/.test(u)), uses.join("\n")).toBe(true);
  });
  it("no color token other than --parry is the parry color", () => {
    const parry = tokens["--parry"].toLowerCase();
    const clash = Object.entries(tokens).filter(([k, v]) => k !== "--parry" && v.toLowerCase() === parry).map(([k]) => k);
    expect(clash).toEqual([]);
  });
});

describe("touch layout + safe zones", () => {
  it("has the three action buttons (JUMP, DASH, SPECIAL) with distinct icons and generous hit zones", () => {
    const ids = content.controls.buttons.map((b) => b.id);
    for (const need of ["jump", "blink", "ex"]) expect(ids).toContain(need);
    const core = content.controls.buttons.filter((b) => ["jump", "blink", "ex"].includes(b.id));
    expect(new Set(core.map((b) => b.icon)).size).toBe(core.length);
    const jump = core.find((b) => b.id === "jump")!;
    for (const b of core) if (b !== jump) expect(b.r, `${b.id} smaller than JUMP`).toBeLessThan(jump.r);
    for (const b of core) expect(b.hit, b.id).toBeGreaterThan(1);
  });
  it("JUMP rests under the right thumb, DASH just left of it, SPECIAL above them", () => {
    const B = Object.fromEntries(content.controls.buttons.map((b) => [b.id, b]));
    for (const b of content.controls.buttons) expect(B.jump.x, b.id).toBeGreaterThanOrEqual(b.x);
    expect(B.blink.x).toBeLessThan(B.jump.x);
    expect(Math.abs(B.blink.y - B.jump.y)).toBeLessThan(0.15);
    expect(B.ex.y).toBeLessThan(Math.min(B.jump.y, B.blink.y));
  });
  it("safe zones in controls.kdl match look/camera.css", () => {
    const l = tokens["--safe-left"].split(/\s+/).map(Number), r = tokens["--safe-right"].split(/\s+/).map(Number);
    const kl = content.controls.safe.find((s) => s.id === "left-thumb")!, kr = content.controls.safe.find((s) => s.id === "right-thumb")!;
    expect([kl.x, kl.y, kl.w, kl.h]).toEqual(l);
    expect([kr.x, kr.y, kr.w, kr.h]).toEqual(r);
  });
});

describe("walker", () => {
  it("descends into split parts", () => {
    const b = content.bosses["dolly"];
    const words = [...walkWords(b.phases[0].script, "x")].map((u) => u.word);
    expect(words).toContain("charge");
    expect(words).toContain("juggle");
  });
});
