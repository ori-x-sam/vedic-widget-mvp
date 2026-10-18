import { beforeEach, describe, expect, it } from 'vitest';
import { actStart, advance, backToCheckpoint, isCheckpointRecord, journey, newJourney, recordCaught } from '../src/systems/journey';
import { OUTLINE } from '../src/data/records';
import { load } from '../src/systems/save';

// A tiny localStorage so save/load run under node.
const mem = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) },
};

describe('journey and checkpoints', () => {
  beforeEach(() => {
    mem.clear();
    (load() as { run: unknown }).run = null;
  });

  it('checkpoints every record in Acts I–VI, every second in Act VII, none in F8', () => {
    for (const o of OUTLINE.filter((r) => r.act < 7)) expect(isCheckpointRecord(o)).toBe(true);
    expect(OUTLINE.filter((r) => r.act === 7).filter(isCheckpointRecord).map((r) => r.id)).toEqual(['f2', 'f4', 'f6']);
  });

  it('catching a record moves the checkpoint to the next record', () => {
    newJourney('r01');
    journey().cowries = 12;
    recordCaught('r01');
    expect(load().run?.checkpoint).toBe('r02');
    expect(load().lessons.r01.caught).toBe(true);
  });

  it('losing all diyas returns to the checkpoint with diyas refilled and later cowries dropped', () => {
    newJourney('r01');
    recordCaught('r01');
    advance();
    const j = journey();
    j.recordId = 'r03';
    j.lives = 0;
    j.cowries = 99;
    expect(backToCheckpoint()).toBe('r02');
    expect(j.lives).toBe(j.maxLives);
    expect(j.cowries).toBeLessThan(99);
  });

  it('can start again from the very beginning or from an act', () => {
    newJourney('r01');
    expect(journey().recordId).toBe('r01');
    newJourney(actStart(4));
    expect(journey().recordId).toBe('r20');
    expect(load().run?.checkpoint).toBe('r20');
  });
});
