// Casebook bindings: store data in, action handlers out. Nothing else lives here (screen-imports.test.ts).
import * as Actions from '../actions';
import { use } from '../decl/engine';
import { C, get, nightOf } from '../content';
import * as Game from '../game';
import { game, ui, type Tab } from '../store';
import { btn, row, screenUi } from './shared';
import casebookKdl from './casebook.kdl?raw';
import casebookCss from './casebook.css?raw';

export const casebookUi = screenUi(casebookKdl, casebookCss);
if (import.meta.hot) import.meta.hot.accept(['./casebook.kdl?raw', './casebook.css?raw'], ([k, c]) => casebookUi.reload(k?.default, c?.default));

const TABS: [Tab, string][] = [['evidence', 'Evidence'], ['photograph', 'Plates'], ['testimony', 'Testimony'], ['note', 'Notes'], ['thoughts', 'Thoughts'], ['pockets', 'Pockets'], ['deduction', 'The case']];
const EMPTY: Record<Tab, string> = {
  evidence: 'Nothing yet. Evidence is what a thing says when you look at it closely.',
  photograph: 'No plates exposed. (F photographs what is in front of me.)',
  testimony: 'Nobody has said anything worth writing down. Yet.',
  note: 'Nothing noted.',
  thoughts: 'When I am stuck long enough I think aloud, and write it here.',
  pockets: 'Empty pockets.',
  deduction: '',
};

export function drawCasebook() {
  const ui0 = ui.getState(), { run } = game.getState();
  if (ui0.screen !== 'play' || !ui0.casebook || !run.night) return casebookUi.show(null);
  // An entry past the end of the page (the page got shorter, or a stale choice) shows the last one.
  const count = ui0.tab === 'pockets' ? run.items.length : ui0.tab === 'thoughts' ? run.thoughts.length : run.clues.filter((c) => C.clue[c]?.page === ui0.tab).length;
  const u = { ...ui0, entry: Math.max(0, Math.min(ui0.entry, count - 1)) };
  const tabs = TABS.map(([t, label]) => row(label, () => Actions.showTab(t), t === u.tab ? 'on' : '', `tab-${t}`));
  let index: ReturnType<typeof row>[] = [], head = '', body = '', asks: ReturnType<typeof use>[] = [], actions: ReturnType<typeof btn>[] = [], empty: string | undefined;

  if (u.tab === 'pockets') {
    const items = run.items;
    index = items.map((id, i) => row(get('item', id).name, () => Actions.showEntry(i), [i === u.entry ? 'on' : '', u.pick === id ? 'new' : ''].join(' '), `item-${id}`));
    const it = items[u.entry];
    if (it) {
      head = get('item', it).name; body = get('item', it).blurb;
      if (it !== 'camera' && it !== 'candle') actions.push(btn(u.held === it ? 'In hand' : 'Hold it', () => Actions.hold(it), u.held === it ? 'off' : 'primary', 'hold'));
      if (items.length > 1) actions.push(btn(u.pick === it ? 'Put together with…  (pick another)' : u.pick ? `Put together with ${get('item', u.pick).name}` : 'Put together with…', () => Actions.pickToCombine(it), u.pick === it ? 'off' : '', 'combine'));
    } else empty = EMPTY.pockets;
  } else if (u.tab === 'deduction') {
    const ded = nightOf(run.night.n).proves, d = get('deduction', ded), qs = Game.asks(run, ded), done = run.flags.includes(ded);
    head = d.title;
    const bed = Game.bedSpot(run.night.n);
    body = done ? `${d.reveal}\n\nAnd: ${d.question}${bed ? `\n\n${get('remark', 'proved-now').text.replace('{name}', get('spot', bed).name)}` : ''}` : qs.every((q) => q.open) ? 'All of it at once, or none of it.' : 'Not enough yet. Each question opens when I have what it needs.';
    if (!done) {
      asks = qs.map((q, qi) => use('ask', { key: `ask-${qi}`, q: q.open ? q.text + '…' : `${q.text}… (I don't know enough yet.)` }, {
        opts: q.open ? q.options.map((o) => row(o, () => Actions.answer(qi, o), u.answers[qi] === o ? 'on' : '', `opt-${qi}-${o}`)) : [],
      }));
      if (qs.every((q) => q.open)) actions.push(btn('Lay it down', () => Actions.confirm(), qs.every((_, i) => u.answers[i]) ? 'primary' : 'off', 'confirm'));
    }
    empty = undefined;
  } else if (u.tab === 'thoughts') {
    index = run.thoughts.map((t, i) => row(t.length > 38 ? t.slice(0, 36) + '…' : t, () => Actions.showEntry(i), i === u.entry ? 'on' : '', `thought-${i}`));
    const t = run.thoughts[u.entry];
    if (t) { head = 'A thought'; body = t; } else empty = EMPTY.thoughts;
  } else {
    const clues = run.clues.filter((c) => C.clue[c]?.page === u.tab);
    index = clues.map((c, i) => row(get('clue', c).title, () => Actions.showEntry(i), i === u.entry ? 'on' : '', `clue-${c}`));
    const c = clues[u.entry];
    if (c) { head = get('clue', c).title; body = get('clue', c).text; } else empty = EMPTY[u.tab];
  }
  const x = u.touch ? [btn('Close', () => Actions.closeCasebook(), '', 'close')] : [];
  casebookUi.show(use('casebook', { head, body, empty, closeHint: u.touch ? undefined : 'Tab or Esc to close' }, { tabs, index, asks, actions, x }));
}
