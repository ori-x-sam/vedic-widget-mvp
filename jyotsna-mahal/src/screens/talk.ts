// Dialogue bindings: store data in, action handlers out. Nothing else lives here (screen-imports.test.ts).
import * as Actions from '../actions';
import { use } from '../decl/engine';
import { get } from '../content';
import * as Game from '../game';
import { game, ui } from '../store';
import { screenUi } from './shared';
import talkKdl from './talk.kdl?raw';
import talkCss from './talk.css?raw';

export const talkUi = screenUi(talkKdl, talkCss);
if (import.meta.hot) import.meta.hot.accept(['./talk.kdl?raw', './talk.css?raw'], ([k, c]) => talkUi.reload(k?.default, c?.default));

export function drawTalk() {
  const u = ui.getState(), { run } = game.getState();
  if (u.screen !== 'play' || !run.talk || u.card) return talkUi.show(null);
  const line = Game.currentLine(run), cs = Game.choices(run), b = get('beat', run.talk.beat);
  const who = line && line.key !== 'narrator' ? get('person', line.key!).short : undefined;
  talkUi.show(use('talk', {
    who, whoClass: line ? `who-${line.key}` : '',
    line: line?.text, lineClass: line?.key === 'narrator' ? 'narrator' : '',
    timed: !!b['timer-s'] && cs.length > 0, left: b['timer-s'] ? 1 - run.talk.t / b['timer-s'] : 0,
    more: cs.length ? '' : u.touch ? 'tap' : 'click, or Space',
  }, { choices: cs.map((c, i) => use('choice', { key: `${run.talk!.beat}:${i}`, label: `${i + 1}.  ${c.text}`, tap: () => Actions.choose(i) })) }));
}
