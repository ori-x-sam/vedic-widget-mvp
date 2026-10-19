// Foundation guards: vocabulary is defined in one home, colours in one palette.
import { describe, expect, it } from 'vitest';
import { CARDS, CLASSES, KSHETRAS, TEAMS, TOKENS_ON_FIELD, YUGAS } from '../content';
import { TOKENS } from '../tokens';

const SRC = import.meta.glob<string>(['../**/*.ts', '!../**/*.test.ts', '!../stories/**'], { query: '?raw', import: 'default', eager: true });
const CSS = import.meta.glob<string>('./*.css', { query: '?raw', import: 'default', eager: true });
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '');

describe('foundation guards', () => {
  it('only screens/shared.ts calls defineProp or defineElement', () => {
    const callers = Object.entries(SRC).filter(([p, s]) => !p.startsWith('../decl/') && /\bdefine(Prop|Element)\(/.test(s)).map(([p]) => p);
    expect(callers).toEqual(['./shared.ts']);
  });
  it('only shared.css has a :root', () => {
    expect(Object.entries(CSS).filter(([p, s]) => p !== './shared.css' && /:root/.test(strip(s))).map(([p]) => p)).toEqual([]);
  });
  it('no hex colour is repeated across screen stylesheets (put it in the palette)', () => {
    const seen = new Map<string, string>(), dupes: string[] = [];
    for (const [p, s] of Object.entries(CSS)) {
      if (p === './shared.css') continue;
      for (const hex of new Set(strip(s).match(/#[0-9a-f]{3,6}\b/gi) ?? [])) {
        const k = hex.toLowerCase(), other = seen.get(k);
        if (other && other !== p) dupes.push(`${k} in ${other} and ${p}`);
        seen.set(k, p);
      }
    }
    expect(dupes).toEqual([]);
  });
  it('every palette token the content names is in the palette', () => {
    const named: [string, string][] = [
      ...Object.values(CLASSES).map((c): [string, string] => [`class ${c.id}`, c.paint]),
      ...[...Object.values(CARDS), ...Object.values(TOKENS_ON_FIELD)].map((c): [string, string] => [`card ${c.id} skin`, c.skin]),
      ...Object.values(KSHETRAS).flatMap((k) => [k.lead, ...k.support].map((t): [string, string] => [`kshetra ${k.id}`, t])),
      ...Object.values(TEAMS).flatMap((t) => [t.paint, t.trim].map((x): [string, string] => [`team ${t.id}`, x])),
      ...YUGAS.flatMap((y) => [y.grade, y.sky].map((x): [string, string] => [`yuga ${y.id}`, x])),
    ];
    expect(named.filter(([, t]) => !(t in TOKENS)).map(([who, t]) => `${who}: ${t}`)).toEqual([]);
  });
});
