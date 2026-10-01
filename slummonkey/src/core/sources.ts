// Browser/Vite file sources: every content/*.kdl, look/*.css and art/**/*.svg as raw text.
// (Node tools use tools/node-sources.ts, which reads the same folders from disk.)
const kdl = import.meta.glob("../../content/**/*.kdl", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const css = import.meta.glob("../../look/*.css", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const svg = import.meta.glob("../../art/**/*.svg", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

const strip = (rec: Record<string, string>, prefix: string) =>
  Object.fromEntries(Object.entries(rec).map(([k, v]) => [k.slice(k.indexOf(prefix)), v]));

export const kdlFiles = strip(kdl, "content/");
export const cssFiles = strip(css, "look/");
export const svgFiles = strip(svg, "art/");
