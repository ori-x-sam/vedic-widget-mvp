// Walk every script in content and yield each word usage (used by the drift guard and the catalog).
import type { Content } from "../../core/content";
import type { KdlNode } from "../../core/kdl";
import { WORDS } from "./registry";

export interface Usage { word: string; where: string; node: KdlNode }

export function* walkWords(nodes: KdlNode[], where: string): Generator<Usage> {
  for (const n of nodes) {
    yield { word: n.name, where, node: n };
    const def = WORDS[n.name];
    if (def?.children === "parts") {
      for (const p of n.children) for (const u of walkWords(p.children, `${where} › ${p.name} ${p.args[0] ?? ""}`)) yield u;
    } else if (n.children.length) yield* walkWords(n.children, where);
  }
}

export function* allUsages(c: Content): Generator<Usage> {
  for (const b of Object.values(c.bosses)) for (const ph of b.phases) yield* walkWords(ph.script, `boss ${b.id} › phase ${ph.id}`);
  for (const m of Object.values(c.minions)) yield* walkWords(m.script, `minion ${m.id}`);
  for (const l of Object.values(c.levels)) yield* walkWords(l.script, `level ${l.id}`);
}
