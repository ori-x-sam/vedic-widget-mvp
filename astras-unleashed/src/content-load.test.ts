import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { combinators, loadKdl, tunedText, word } from './content-load';

describe('loadKdl', () => {
  const load = (src: string) => loadKdl(src, { a: z.object({ id: z.string(), n: z.number() }) }).a;
  it('throws on syntax errors with a position', () => {
    expect(() => load('a "x" {')).toThrow(/syntax error at \d+:\d+/);
  });
  it('names the node and field of a malformed node', () => {
    expect(() => load('a "x" n="lots"')).toThrow(/a "x": n:/);
  });
  const two = { a: z.object({ id: z.string(), n: z.number() }), b: z.object({ id: z.string() }) };
  it('splits kinds into records, in file order', () => {
    const r = loadKdl('b "y"\na "x" n=1\nb "w"\na "z" n=2', two);
    expect(Object.keys(r.a)).toEqual(['x', 'z']);
    expect(Object.keys(r.b)).toEqual(['y', 'w']);
  });
  it('gives the schema the node id', () => {
    expect(loadKdl('a "x" n=1', two).a.x).toEqual({ id: 'x', n: 1 });
  });
  it('rejects a duplicate id across kinds', () => {
    expect(() => loadKdl('a "x" n=1\nb "x"', two)).toThrow('b "x": duplicate id');
  });
  it('carries nested children (a word\'s block)', () => {
    const r = loadKdl('a "x" n=1 { every 8 { pull 3 } }', { a: z.object({ id: z.string(), n: z.number(), children: z.array(z.unknown()) }) });
    expect(r.a.x!.children).toEqual([{ name: 'every', args: [8], props: {}, children: [{ name: 'pull', args: [3], props: {}, children: [] }] }]);
  });
  it('lists every kind for an unknown node', () => {
    expect(() => loadKdl('c "x"', two)).toThrow('expected node "a" or "b", found "c"');
  });
});

describe('combinators', () => {
  const s = combinators({ one: (n: number) => n, none: () => 0 }, 'thing');
  const run = (name: string, args: unknown[]) => s.safeParse([{ name, args, props: {}, children: [] }]);
  it('names the known ones for an unknown combinator', () => {
    expect(run('two', []).error!.issues[0]!.message).toBe('unknown thing "two" (known: one, none)');
  });
  it('checks arity', () => {
    expect(run('one', []).error!.issues[0]!.message).toBe('thing "one": expected 1 number argument(s)');
    expect(run('one', [4]).data).toEqual([4]);
  });
  it('does not reach inherited object props', () => {
    expect(run('toString', []).error!.issues[0]!.message).toBe('unknown thing "toString" (known: one, none)');
  });
});

describe('combinators with word signatures', () => {
  type W = { w: string; a?: unknown[]; o?: Record<string, unknown>; inner?: W[] };
  const s = combinators<W>({
    one: (n: number) => ({ w: 'one', a: [n] }),
    tagged: word({ args: ['s', 'n'] }, (a) => ({ w: 'tagged', a })),
    zone: word({ args: ['n'], opts: { width: 'n?', every: 1.5, pick: ['nearest', 'highest-hp'], need: 'n' }, flags: ['units-only'] }, (a, o) => ({ w: 'zone', a, o })),
    every: word({ args: ['n'], block: true }, (a, _, inner: W[]) => ({ w: 'every', a, inner })),
  }, 'word');
  const kid = (name: string, args: unknown[] = [], props: Record<string, unknown> = {}, children: unknown[] = []) => ({ name, args, props, children });
  const msg = (c: unknown) => s.safeParse([c]).error!.issues[0]!.message;
  it('takes string and number arguments in order', () => {
    expect(s.parse([kid('tagged', ['shaiva', 1])])).toEqual([{ w: 'tagged', a: ['shaiva', 1] }]);
    expect(msg(kid('tagged', [1, 1]))).toBe('word "tagged": argument 1 should be a string (an id or tag)');
    expect(msg(kid('tagged', ['shaiva']))).toBe('word "tagged": expected 2 argument(s): a string, a number');
  });
  it('fills options from defaults, choices and flags', () => {
    expect(s.parse([kid('zone', [3, 'units-only'], { need: 2 })])).toEqual([{ w: 'zone', a: [3], o: { width: undefined, every: 1.5, pick: 'nearest', need: 2, 'units-only': true } }]);
    expect(s.parse([kid('zone', [3], { need: 2, width: 6, pick: 'highest-hp' })])[0]!.o).toMatchObject({ width: 6, pick: 'highest-hp', 'units-only': false });
  });
  it('names a bad option, choice, flag or missing option', () => {
    expect(msg(kid('zone', [3], { need: 2, widht: 6 }))).toBe('word "zone": unknown option widht= (options: width, every, pick, need)');
    expect(msg(kid('zone', [3], { need: 2, pick: 'far' }))).toBe('word "zone": pick= should be one of: nearest, highest-hp');
    expect(msg(kid('zone', [3, 'unit-only'], { need: 2 }))).toBe('word "zone": unexpected argument "unit-only" (flags: units-only)');
    expect(msg(kid('zone', [3]))).toBe('word "zone": needs need=');
    expect(msg(kid('zone', [3], { need: 'x' }))).toBe('word "zone": need= should be a number');
  });
  it('parses a block with the same registry, and refuses a block where none belongs', () => {
    expect(s.parse([kid('every', [8], {}, [kid('one', [3])])])).toEqual([{ w: 'every', a: [8], inner: [{ w: 'one', a: [3] }] }]);
    expect(msg(kid('every', [8]))).toBe('word "every": needs a block { ... } of words');
    expect(msg(kid('one', [3], {}, [kid('one', [1])]))).toBe('word "one": takes only number arguments');
    expect(msg(kid('tagged', ['x', 1], {}, [kid('one', [1])]))).toBe('word "tagged": takes no block');
  });
  it('points errors inside a block at the inner word', () => {
    const issue = s.safeParse([kid('every', [8], {}, [kid('nope')])]).error!.issues[0]!;
    expect(issue.path).toEqual([0, 'children', 0]);
    expect(issue.message).toMatch(/^unknown word "nope"/);
  });
});

describe('tunedText', () => {
  const s = tunedText({ A: 3, B: { x: [1, 7] } });
  it('resolves placeholders from the table', () => {
    expect(s.parse('-{A} and +{B.x.1}')).toBe('-3 and +7');
    expect(s.parse('plain')).toBe('plain');
  });
  it('names an unknown path', () => {
    expect(s.safeParse('{B.y}').error!.issues[0]!.message).toBe('unknown tuning "{B.y}"');
  });
});
