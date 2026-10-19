import { describe, expect, it } from 'vitest';
import { CARDS, TOKENS_ON_FIELD } from '../content';
import { GLYPHS } from './glyphs';

describe('attribute glyphs', () => {
  it('every god and token names an attribute that has a glyph', () => {
    const missing = [...Object.values(CARDS), ...Object.values(TOKENS_ON_FIELD)].filter((c) => !GLYPHS[c.attribute]).map((c) => `${c.id}: ${c.attribute}`);
    expect(missing).toEqual([]);
  });
  it('no two gods share an attribute, so no two placeholders look alike', () => {
    const attrs = Object.values(CARDS).map((c) => c.attribute);
    expect(new Set(attrs).size).toBe(attrs.length);
  });
});
