import { describe, expect, it } from 'vitest';
import { newMeta, parseMeta, unlockKatha } from './meta';

describe('meta', () => {
  it('a fresh meta has nothing unlocked and the default settings', () => {
    expect(newMeta()).toMatchObject({ katha: [], matches: 0, settings: { music: true, assist: false } });
  });
  it('a bad save is rejected; no save is not a save', () => {
    expect(parseMeta({ matches: -1 })).toBeNull();
    expect(parseMeta(null)).toBeNull();
    expect(parseMeta({ katha: ['agni'] })!.katha).toEqual(['agni']);
  });
  it('unlocking a page twice is a no-op (same reference)', () => {
    const m = unlockKatha(newMeta(), 'agni');
    expect(m.katha).toEqual(['agni']);
    expect(unlockKatha(m, 'agni')).toBe(m);
  });
});
