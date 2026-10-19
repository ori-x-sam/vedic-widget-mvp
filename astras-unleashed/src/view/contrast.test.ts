import { describe, expect, it } from 'vitest';
import { aaMin, contrast, FAILING_PAIRS, TEXT_PAIRS } from './contrast';

describe('every UI text pair meets WCAG AA', () => {
  for (const p of TEXT_PAIRS) {
    it(`${p.text} on ${p.bg} (${p.use})`, () => expect(contrast(p.text, p.bg)).toBeGreaterThanOrEqual(aaMin(p)));
  }
  it('the pairs waiting on a decision really do fail (move one up when it is fixed)', () => {
    for (const p of FAILING_PAIRS) expect(contrast(p.text, p.bg)).toBeLessThan(aaMin(p));
  });
  it('the frame pairs match the brief (cream 11.7, peach 7.1)', () => {
    expect(contrast('--cream', '--frame')).toBeCloseTo(11.65, 1);
    expect(contrast('--peach', '--frame')).toBeCloseTo(7.08, 1);
  });
});
