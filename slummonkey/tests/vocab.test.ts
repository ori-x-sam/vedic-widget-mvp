import { describe, it, expect } from "vitest";
import { loadContent } from "../src/core/content";
import { World } from "../src/rules/world";
import { idleFrame } from "../src/core/input";
import { WORDS } from "../src/rules/vocab/registry";

const base = `
projectile "pellet" r=10
projectile "coin" r=10
projectile "shockwave" r=20
projectile "bomb" r=16
projectile "beam" r=20
projectile "player-coin" r=8 hostile=#false damage=4
weapon "coin" kind="straight" projectile="player-coin" rate=10 damage=4 speed=1400 ex="player-coin"
minion "imp" hp=5 { loop { hop 50 1 } }
`;
const boss = (phases: string) => loadContent({ "t.kdl": base + `boss "b" hp=100 w=100 h=100 x=300 {\n${phases}\n}` });

function sim(c: ReturnType<typeof boss>, secs: number, onStep?: (w: World) => void) {
  const w = new World(c, { weapons: ["coin"], super: "", charm: "" }, 7);
  w.startBoss("b");
  for (let i = 0; i < secs * 60; i++) { w.step(idleFrame()); onStep?.(w); }
  return w;
}

describe("vocabulary", () => {
  it("every word has a one-line doc and a kind", () => {
    for (const w of Object.values(WORDS)) {
      expect(w.doc.length, w.name).toBeGreaterThan(8);
      expect(w.doc.includes("\n"), w.name).toBe(false);
    }
  });
  it("stomp sends shockwaves both ways", () => {
    let seen = 0;
    sim(boss(`phase "a" { stomp 0.2 1; wait 5 }`), 1, (w) => { seen = Math.max(seen, w.projs.live.filter((p) => p.def.id === "shockwave").length); });
    expect(seen).toBe(2);
  });
  it("invisible + trail + charge leaves footprints while alpha < 0.1", () => {
    const w = sim(boss(`phase "a" { invisible 0; invisible-trail "powder"; charge 600; wait 0.2 }`), 3);
    expect(w.marked("b", "footprint-invisible")).toBeGreaterThan(0);
  });
  it("phases advance on hp thresholds and reset the boss", () => {
    const c = boss(`phase "one" until="50%" { invisible 0; wait 9 }\nphase "two" { wait 9 }`);
    const w = new World(c, { weapons: ["coin"], super: "", charm: "" });
    w.startBoss("b");
    w.step(idleFrame());
    expect(w.boss!.alpha).toBe(0);
    w.damage(w.boss!, 60);
    w.step(idleFrame());
    expect(w.phase!.id).toBe("two");
    expect(w.boss!.alpha).toBe(1);
  });
  it("split parts carry their own hp and route damage to the boss", () => {
    const c = boss(`phase "a" { split { part "legs" hp=20 x=-100 { wait 1 }; part "torso" hp=20 x=100 { wait 1 } } }`);
    const w = new World(c, { weapons: ["coin"], super: "", charm: "" });
    w.startBoss("b");
    w.step(idleFrame());
    const parts = w.all.filter((e) => e.kind === "part");
    expect(parts.length).toBe(2);
    w.damage(parts[0], 25);
    expect(parts[0].hp).toBeLessThanOrEqual(0);
    expect(w.boss!.hp).toBe(75);
  });
  it("hide-under + shuffle + reveal spawns bombs and a parryable bonus", () => {
    const w = sim(boss(`phase "a" { hide-under 3 "matka"; shuffle 3 4; reveal bombs=2 bonus="laddoo"; wait 9 }`), 4);
    expect(w.marked("b", "shuffle")).toBe(1);
    expect(w.marked("b", "reveal-bonus")).toBe(1);
  });
  it("summon brings in minions that run their own words", () => {
    const w = sim(boss(`phase "a" { summon "imp" 2 gap=0; wait 9 }`), 1);
    expect(w.all.filter((e) => e.kind === "minion").length).toBe(2);
    expect(w.marked("imp", "hop")).toBeGreaterThan(0);
  });
  it("unknown words are reported, not crashed on", () => {
    const w = sim(boss(`phase "a" { frobnicate 3; wait 1 }`), 0.2);
    expect(w.errors.join()).toMatch(/unknown word 'frobnicate'/);
  });
  it("player can shoot and damage the boss", () => {
    const c = boss(`phase "a" { wait 99 }`);
    const w = new World(c, { weapons: ["coin"], super: "", charm: "" });
    w.startBoss("b");
    for (let i = 0; i < 120; i++) { const f = idleFrame(); f.held.shoot = true; w.step(f); }
    expect(w.boss!.hp).toBeLessThan(100);
    expect(w.player.cards).toBeGreaterThan(0);
  });
});
