import { describe, it, expect } from "vitest";
import { parseKdl, stringifyKdl } from "../src/core/kdl";
import { Tokens } from "../src/core/tokens";
import { Clock, onTwos } from "../src/core/clock";
import { snap8 } from "../src/core/input";
import { Pool } from "../src/core/pool";
import { Rng } from "../src/core/rng";

describe("kdl", () => {
  it("parses the boss example from the brief", () => {
    const src = `boss "gajraj" name="Gayab Gajraj" hp=1200 {
      phase "sheet-trick" until="66%" { stomp 2.4 3; trunk-spray 0.8 coins; vanish-under-sheet 6 }
      // comment
      /- phase "cut" { nope }
      phase "trick-gone-wrong" { shrink 0.3; zip 18; parryable "marigold" }
    }`;
    const [b] = parseKdl(src);
    expect(b.name).toBe("boss");
    expect(b.props).toEqual({ name: "Gayab Gajraj", hp: 1200 });
    expect(b.children.length).toBe(2);
    expect(b.children[0].children.map((c) => c.name)).toEqual(["stomp", "trunk-spray", "vanish-under-sheet"]);
    expect(b.children[0].children[1].args).toEqual([0.8, "coins"]);
    expect(b.children[1].children[2].args).toEqual(["marigold"]);
  });
  it("handles keywords, escapes, block comments and slashdash args", () => {
    const [n] = parseKdl(`n #true false #null "a\\"b" /* x /* nested */ */ k=-1.5e2 /-skip 7`);
    expect(n.args).toEqual([true, false, null, 'a"b', 7]);
    expect(n.props.k).toBe(-150);
  });
  it("round-trips through stringify", () => {
    const a = parseKdl(`btn "shoot" x=0.8 y=0.7 { child 1 }`);
    expect(parseKdl(stringifyKdl(a))[0].props).toEqual(a[0].props);
  });
  it("reports line numbers on errors", () => {
    expect(() => parseKdl(`a\nb {\n`, "f.kdl")).toThrow(/f\.kdl:3/);
  });
});

describe("tokens", () => {
  const t = Tokens.fromCss(`:root { --parry: #ff3d8b; --a: 2; --b: var(--a); --d: 120ms; --v: 1 2 3; } .x { --no: 1 }`);
  it("reads numbers, vars, durations, colors and vectors", () => {
    expect(t.num("--b")).toBe(2);
    expect(t.num("--d")).toBeCloseTo(0.12);
    expect(t.color("--parry")[0]).toBe(1);
    expect(t.vec("--v")).toEqual([1, 2, 3]);
    expect(t.has("--no")).toBe(false);
    expect(t.substitute(`<path fill="var(--parry)"/>`)).toContain("#ff3d8b");
  });
});

describe("clock / input / pool / rng", () => {
  it("steps fixed and freezes during hit-stop", () => {
    const c = new Clock();
    expect(c.advance(1 / 30)).toBe(2);
    c.freeze(0.05);
    expect(c.advance(1 / 60)).toBe(0);
    expect(onTwos(0.5)).toBe(6);
  });
  it("snaps 8 ways with a dead zone", () => {
    expect(snap8(0.1, 0.1)).toEqual([0, 0]);
    expect(snap8(0.7, 0.68)).toEqual([1, 1]);
    expect(snap8(-0.9, 0.2)).toEqual([-1, 0]);
  });
  it("pools without losing items", () => {
    const p = new Pool(() => ({ v: 0 }), (o) => (o.v = 0));
    for (let i = 0; i < 10; i++) p.get().v = i;
    p.sweep((o) => o.v % 2 === 0);
    expect(p.size).toBe(5);
  });
  it("rng is deterministic", () => {
    expect(new Rng(5).next()).toBe(new Rng(5).next());
  });
});
