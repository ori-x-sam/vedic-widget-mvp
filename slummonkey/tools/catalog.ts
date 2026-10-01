// Generates VOCABULARY.md from the single word registry (+ usage counts from content).
// Run: npm run catalog. The drift test fails if VOCABULARY.md is stale.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { WORDS } from "../src/rules/vocab/registry";
import { allUsages } from "../src/rules/vocab/walk";
import { loadContent } from "../src/core/content";
import { nodeKdlFiles, ROOT } from "./node-sources";

export function buildCatalog(): string {
  const c = loadContent(nodeKdlFiles());
  const uses: Record<string, Set<string>> = {};
  for (const u of allUsages(c)) (uses[u.word] ??= new Set()).add(u.where.split(" › ").slice(0, 2).join(" › "));
  const kinds = ["flow", "move", "attack", "telegraph", "state", "parry", "stage"] as const;
  const title: Record<string, string> = { flow: "Flow", move: "Movement", attack: "Attacks", telegraph: "Telegraphs", state: "State & illusions", parry: "Parry", stage: "Stage" };
  let md = `# Vocabulary catalog\n\n_Generated from \`src/rules/vocab/registry.ts\` by \`npm run catalog\`. Do not edit by hand._\n\n`;
  md += `Every behaviour in \`content/*.kdl\` is one of these ${Object.keys(WORDS).length} words. Syntax: \`word positional-args prop=value { child words }\`.\n`;
  md += `Units: px, px/s, seconds, degrees. x/y accept \`player\`, \`me\`, \`left\`, \`right\`, \`center\`, \`random\`, \`far\`, \`near\` (and y: \`floor\`, \`top\`). Numbers are relative to the camera.\n\n`;
  for (const k of kinds) {
    const ws = Object.values(WORDS).filter((w) => w.kind === k).sort((a, b) => a.name.localeCompare(b.name));
    md += `## ${title[k]}\n\n| word | arguments | what it does | used by |\n|---|---|---|---|\n`;
    for (const w of ws) {
      const u = uses[w.name] ? [...uses[w.name]].length : 0;
      const sig = w.sig ? `\`${w.sig.replace(/\|/g, "\\|")}\`` : "—";
      md += `| \`${w.name}\` | ${sig} | ${w.doc.replace(/\|/g, "\\|")} | ${u ? `${u} script${u > 1 ? "s" : ""}` : "—"} |\n`;
    }
    md += `\n`;
  }
  return md;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(join(ROOT, "VOCABULARY.md"), buildCatalog());
  console.log("wrote VOCABULARY.md");
}
