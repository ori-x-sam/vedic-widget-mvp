import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OUTLINE, RECORDS } from '../src/data/records';

const md = readFileSync(join(import.meta.dirname, '..', 'HISTORY.md'), 'utf8');

describe('lesson cards match HISTORY.md', () => {
  for (const o of OUTLINE) {
    it(`${o.id} card text, did-you-know and sources are in HISTORY.md`, () => {
      const r = RECORDS[o.id];
      expect(md).toContain(r.fact);
      expect(md).toContain(r.didYouKnow);
      for (const k of r.sources) expect(md).toContain(`\`${k}\``);
    });
  }
  it('never uses the forbidden word', () => {
    for (const o of OUTLINE) expect(JSON.stringify(RECORDS[o.id]).toLowerCase()).not.toContain('keling');
  });
});
