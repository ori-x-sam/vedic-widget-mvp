import { describe, expect, it } from 'vitest';
import { CARD_WORDS, TRIGGERS } from './cards';
import { EFFECT_WORDS } from './effects';
import { STAT_WORDS, UNIT_WORDS } from './units';
import { readWord, readWords } from './words.test-helper';

const c = (kdl: string) => readWord(CARD_WORDS, kdl);

describe('triggers', () => {
  it('avahana wraps words that happen when it is played', () => {
    expect(c('avahana { leap }')).toMatchObject({ hook: 'avahana', abilities: [{ hook: 'place' }] });
  });
  it('visarjana wraps words that happen when it returns to light', () => {
    expect(c('visarjana { discount-next 1 }')).toEqual({ hook: 'visarjana', abilities: [{ hook: 'effect', effect: { do: 'discount-next', amount: 1 } }] });
  });
  it('every repeats, first at first= (default one period in)', () => {
    expect(c('every 8 first=0 { pull 3 root=1.5 range=6 }')).toMatchObject({ hook: 'every', everyS: 8, firstS: 0, abilities: [{ hook: 'effect', effect: { do: 'pull' } }] });
    expect(c('every 4.5 { prana 1 }')).toMatchObject({ everyS: 4.5, firstS: 4.5 });
  });
  it('with names an id or tag', () => {
    expect(c('with "rama" { dmg 0.25 }')).toMatchObject({ hook: 'with', match: 'rama', abilities: [{ hook: 'dmg-out' }] });
  });
  it('Shiva: meditate, then the third eye, in one avahana', () => {
    expect(c('avahana {\n meditate 3 guard=0.5\n damage 420 units-only\n}')).toMatchObject({ hook: 'avahana', abilities: [{ hook: 'meditate' }, { hook: 'effect', effect: { do: 'damage', unitsOnly: true } }] });
  });
});

describe('the card registry', () => {
  it('no word name is claimed by two homes', () => {
    const names = [STAT_WORDS, UNIT_WORDS, EFFECT_WORDS, TRIGGERS].flatMap(Object.keys);
    expect(names.length).toBe(new Set(names).size);
  });
  it('a plain number effect keeps its arity check', () => {
    expect(() => readWords(CARD_WORDS, 'prana')).toThrow('word "prana": expected 1 number argument(s)');
  });
});
