// Node-side file sources (balance bot, catalog, tests that run outside Vite).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir: string, ext: string, out: Record<string, string> = {}) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, ext, out);
    else if (f.endsWith(ext)) out[relative(ROOT, p).replace(/\\/g, "/")] = readFileSync(p, "utf8");
  }
  return out;
}

export const nodeKdlFiles = () => walk(join(ROOT, "content"), ".kdl");
export const nodeCssFiles = () => walk(join(ROOT, "look"), ".css");
export const nodeSvgFiles = () => walk(join(ROOT, "art"), ".svg");
