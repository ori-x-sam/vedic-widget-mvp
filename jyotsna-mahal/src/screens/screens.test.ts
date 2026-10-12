// Every screen compiles against the registries and renders from real store states (static KDL/CSS mistakes throw at
// import, binding mistakes at draw). Text is measured by a fixed-size stub: there is no canvas under node.
import 'pixi.js/events';
import { CanvasTextMetrics } from 'pixi.js';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { C } from '../content';
import * as G from '../game';
import { initialUi, game, ui, type Tab } from '../store';
import { drawHud } from './hud';
import { drawTalk } from './talk';
import { drawCasebook } from './casebook';
import { drawDials } from './dials';
import { drawCard } from './card';
import { drawTitle } from './title';
import { layers } from '../stage';
import talkCss from './talk.css?raw';

const drawAll = () => { drawHud(); drawTalk(); drawCasebook(); drawDials(); drawCard(); drawTitle(); };
const texts = () => { const out: string[] = []; const walk = (n: { children?: unknown[]; text?: unknown; visible?: boolean }) => { if (n.visible === false) return; if (typeof n.text === 'string') out.push(n.text); (n.children ?? []).forEach((c) => walk(c as never)); }; walk(layers.ui as never); return out; };
const night = () => { let s = G.newGame(); while (s.phase === 'day') s = G.choices(s).length ? G.choose(s, 0) : G.next(s); return { ...s, events: [] }; };

beforeAll(() => {
  vi.spyOn(CanvasTextMetrics, 'measureText').mockReturnValue({ width: 10, height: 10, lines: [''], lineWidths: [10], lineHeight: 10, maxLineWidth: 10, fontProperties: { ascent: 8, descent: 2, fontSize: 10 } } as never);
});

describe('screens render from the stores', () => {
  it('title', () => {
    game.setState({ run: G.newGame(), save: null }); ui.setState(initialUi); drawAll();
    expect(texts()).toContain('JYOTSNA MAHAL');
    expect(texts()).toContain('Begin');
  });
  it('talk: a line, then choices', () => {
    game.setState({ run: G.newGame() }); ui.setState({ ...initialUi, screen: 'play' }); drawAll();
    expect(texts().join(' ')).toMatch(/Chandragarh/);
  });
  it('hud: the watch and the prompt', () => {
    game.setState({ run: night() }); ui.setState({ ...initialUi, screen: 'play', target: 'punkah' }); drawAll();
    expect(texts()).toContain('11:30 p.m.');
    expect(texts().join(' ')).toMatch(/punkah/);
  });
  it('the casebook, every page', () => {
    for (const tab of ['evidence', 'photograph', 'testimony', 'note', 'thoughts', 'pockets', 'deduction'] as Tab[]) {
      game.setState({ run: night() }); ui.setState({ ...initialUi, screen: 'play', casebook: true, tab }); drawAll();
      expect(texts()).toContain('CASEBOOK · A. THISTLEWOOD · CALCUTTA POLICE (S.B.)');
    }
  });
  it('dials and a card', () => {
    game.setState({ run: night() }); ui.setState({ ...initialUi, screen: 'play', dials: { spot: 'storeroom-dials', faces: ['gaur', 'gaur', 'gaur', 'gaur'] } }); drawAll();
    expect(texts()).toContain('Try the handle');
    ui.setState({ ...initialUi, screen: 'play', card: { kind: 'title', title: 'Night 1', sub: 'The Bolted Door', text: '' } }); drawAll();
    expect(texts()).toContain('Night 1');
  });
  it('every person who speaks has a colour for their name in talk.css', () => {
    const missing = Object.keys(C.person).filter((id) => id !== 'narrator' && !talkCss.includes(`.who-${id} {`));
    expect(missing).toEqual([]);
  });
});
