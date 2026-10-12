// The content holds together: every id a node names exists, every room's doors and spots stand on its floor, and
// every flag a condition tests is set somewhere. These are the mistakes a designer makes typing KDL at speed.
import { describe, expect, it } from 'vitest';
import { C, FILES, loadContent, type Effects } from './content';
import { doorPlace } from './game';

const effects: Effects[] = [];
const conds: { where: string; terms: Effects['if'] }[] = [];
for (const b of Object.values(C.beat)) for (const c of b.children) {
  if ('does' in c) { effects.push(c.does); conds.push({ where: `beat ${b.id}`, terms: c.does.if }); }
  if (c.word === 'go' || c.word === 'ends') conds.push({ where: `beat ${b.id}`, terms: c.if });
}
for (const s of Object.values(C.spot)) for (const c of s.children) {
  if ('does' in c) { effects.push(c.does); conds.push({ where: `spot ${s.id}`, terms: c.does.if }); }
  if (c.word === 'pose') conds.push({ where: `spot ${s.id}`, terms: c.if });
}
for (const n of Object.values(C.night)) for (const c of n.children) { effects.push(c.does); conds.push({ where: `night ${n.id}`, terms: c.does.if }); }
for (const h of Object.values(C.hint)) conds.push({ where: `hint ${h.id}`, terms: h.until });

const missing = (kind: keyof typeof C, ids: string[]) => ids.filter((id) => !C[kind][id]).map((id) => `${kind} "${id}"`);

describe('content', () => {
  it('loads', () => {
    expect(Object.keys(C.night).length).toBeGreaterThan(0);
  });
  it('rejects a duplicate id of one kind across files', () => {
    expect(() => loadContent({ 'a.kdl': 'item "x" name="X" blurb="b"', 'b.kdl': 'item "x" name="Y" blurb="b"' })).toThrow(/b.kdl: item "x": duplicate id \(also in content\/a.kdl\)/);
  });
  it('every item, clue, door and sound an effect names exists', () => {
    const sounds = new Set(Object.keys(C.sound));
    expect([
      ...effects.flatMap((e) => [...missing('item', [...e.gives, ...e.takes]), ...missing('clue', e.clue), ...missing('door', [...e.opens, ...e.closes])]),
      ...effects.filter((e) => e.sound && !sounds.has(e.sound)).map((e) => `sound "${e.sound}"`),
      ...Object.values(C.person).filter((p) => p.sound && !sounds.has(p.sound)).map((p) => `sound "${p.sound}" (person ${p.id})`),
      ...Object.values(C.recipe).flatMap((r) => [...missing('item', [r.makes, ...r.from]), ...(r.sound && !sounds.has(r.sound) ? [`sound "${r.sound}"`] : [])]),
    ]).toEqual([]);
  });
  it('every condition names a flag something sets, an item, or a clue', () => {
    const set = new Set(effects.flatMap((e) => e.sets));
    for (const d of Object.values(C.deduction)) set.add(d.id);
    for (const s of Object.values(C.spot)) set.add(`seen:${s.id}`);
    const bad = conds.flatMap(({ where, terms }) => terms.flatMap((t) =>
      t.kind === 'flag' && !set.has(t.name) ? [`${where}: flag "${t.name}" is never set`]
        : t.kind === 'has' && !C.item[t.item] ? [`${where}: item "${t.item}"`]
          : t.kind === 'knows' && !C.clue[t.clue] ? [`${where}: clue "${t.clue}"`] : []));
    expect(bad).toEqual([]);
  });
  it('beats, scenes and places point at each other', () => {
    const bad: string[] = [];
    for (const sc of Object.values(C.scene)) bad.push(...missing('beat', [sc.first]), ...missing('place', [sc.place]));
    for (const b of Object.values(C.beat)) {
      bad.push(...missing('scene', [b.scene]));
      if (b.timeout) bad.push(...missing('beat', [b.timeout]));
      for (const c of b.children) {
        if (c.word === 'go') bad.push(...missing('beat', [c.to]));
        if (c.word === 'choose' && c.go) bad.push(...missing('beat', [c.go]));
        if (c.word === 'line') bad.push(...missing('person', [c.key!]));
        if (c.word === 'ends' && c.how === 'ending') bad.push(...missing('ending', [c.ending ?? 'the-end']));
      }
      if (b.timeout && !b.children.some((c) => c.word === 'choose')) bad.push(`beat ${b.id}: a timer with no choices`);
      if (!b.children.some((c) => c.word === 'go' || c.word === 'ends' || c.word === 'choose')) bad.push(`beat ${b.id}: nothing comes after it`);
    }
    for (const p of Object.values(C.place)) for (const c of p.children) if (c.word === 'sits') bad.push(...missing('person', [c.who]));
    for (const n of Object.values(C.night)) bad.push(...missing('scene', [n.then, n.caught]), ...missing('deduction', [n.proves]), ...missing('room', [n.start]));
    expect(bad).toEqual([]);
  });
  it('every model a room, spot or place names is in models.kdl', () => {
    const named = [
      ...Object.values(C.spot).flatMap((s) => (s.model ? [s.model] : [])),
      ...Object.values(C.room).flatMap((r) => r.children.flatMap((c) => (c.word === 'prop' ? [c.model] : []))),
      ...Object.values(C.place).flatMap((p) => p.children.flatMap((c) => (c.word === 'prop' ? [c.model] : c.word === 'sits' ? [c.model] : []))),
    ];
    expect(missing('model', named)).toEqual([]);
  });
  it('spots and doors stand inside their rooms; doors join rooms that touch', () => {
    const bad: string[] = [];
    for (const s of Object.values(C.spot)) {
      const r = C.room[s.room];
      if (!r) { bad.push(`spot ${s.id}: room "${s.room}"`); continue; }
      if (Math.abs(s.at[0]) > r.w / 2 || Math.abs(s.at[1]) > r.d / 2) bad.push(`spot ${s.id} stands outside ${r.id}`);
    }
    for (const d of Object.values(C.door)) {
      const to = C.room[d.to];
      if (!to || !C.room[d.from]) { bad.push(`door ${d.id}: rooms`); continue; }
      const p = doorPlace(d), eps = 0.01;
      const onWall = p.ns ? Math.abs(Math.abs(p.z - to.z) - to.d / 2) < eps && Math.abs(p.x - to.x) <= to.w / 2 : Math.abs(Math.abs(p.x - to.x) - to.w / 2) < eps && Math.abs(p.z - to.z) <= to.d / 2;
      if (!onWall) bad.push(`door ${d.id}: ${d.to} doesn't share that wall with ${d.from}`);
    }
    expect(bad).toEqual([]);
  });
  it('every patrol stop is inside its room', () => {
    const bad = Object.values(C.patrol).flatMap((p) => p.children.filter((st) => { const r = C.room[st.room]; return !r || Math.abs(st.at[0]) > r.w / 2 || Math.abs(st.at[1]) > r.d / 2; }).map((st) => `${p.id}: ${st.room} ${st.at}`));
    expect(bad).toEqual([]);
  });
  it('a deduction asks only for clues that exist', () => {
    expect(Object.values(C.deduction).flatMap((d) => d.children.flatMap((a) => missing('clue', a.from)))).toEqual([]);
  });
  it('every code teaches its answer from spots that exist, with faces it has', () => {
    const bad = Object.values(C.spot).flatMap((s) => s.children.flatMap((c) => c.word !== 'code' ? [] : [
      ...missing('spot', c.learns),
      ...c.answer.filter((f) => !c.key!.split(/\s+/).includes(f)).map((f) => `${s.id}: face "${f}"`),
      ...(c.answer.length === c.dials ? [] : [`${s.id}: ${c.dials} dials but ${c.answer.length} in the answer`]),
    ]));
    expect(bad).toEqual([]);
  });
  it('content files are named in FILES', () => {
    const KDL = import.meta.glob('../content/*.kdl', { query: '?raw', import: 'default', eager: true });
    expect(Object.keys(FILES).sort()).toEqual(Object.keys(KDL).map((p) => p.split('/').pop()).sort());
  });
});
