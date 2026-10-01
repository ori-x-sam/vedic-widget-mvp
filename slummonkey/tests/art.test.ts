import { describe, it, expect } from "vitest";
import { nodeSvgFiles } from "../tools/node-sources";

// Every SVG part must be well-formed: a broken file silently renders as the magenta "missing" texture.
describe("art", () => {
  const svgs = nodeSvgFiles();
  it("has art", () => expect(Object.keys(svgs).length).toBeGreaterThan(40));
  for (const [path, text] of Object.entries(svgs)) {
    it(`${path} is well-formed`, () => {
      expect(text).toMatch(/<svg[^>]*viewBox="[\d.\s-]+"/);
      // duplicate attributes inside any tag
      for (const tag of text.match(/<[a-zA-Z][^>]*>/g) ?? []) {
        const names = [...tag.matchAll(/\s([a-zA-Z:-]+)=/g)].map((m) => m[1]);
        expect(new Set(names).size, `${path}: ${tag.slice(0, 80)}`).toBe(names.length);
      }
      // balanced open/close tags
      const opens = (text.match(/<[a-zA-Z][^>]*[^/]>/g) ?? []).filter((t) => !t.startsWith("<?")).length;
      const closes = (text.match(/<\/[a-zA-Z]+>/g) ?? []).length;
      expect(opens, path).toBe(closes);
    });
  }
});
