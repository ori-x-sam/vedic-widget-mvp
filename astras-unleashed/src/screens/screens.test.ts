// Every screen compiles against the registries and renders from real store states (static KDL/CSS mistakes throw at
// import, binding mistakes at draw). Text is measured by a fixed-size stub: there is no canvas under node.
import 'pixi.js/events';
import { CanvasTextMetrics } from 'pixi.js';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { initialUi, ui } from '../store';
import { drawTitle } from './title';
import { bannerScore, card, cardRules, emote, hud, kathaPage, kshetraToast, longDie, pranaBar, reportCard, screenUi } from './shared';
import { use } from '../decl/engine';
import { CARDS, KATHA, KSHETRAS } from '../content';
import { layers } from '../stage';

const drawAll = () => { drawTitle(); };
const texts = () => { const out: string[] = []; const walk = (n: { children?: unknown[]; text?: unknown; visible?: boolean }) => { if (n.visible === false) return; if (typeof n.text === 'string') out.push(n.text); (n.children ?? []).forEach((c) => walk(c as never)); }; walk(layers.ui as never); return out; };

beforeAll(() => {
  vi.spyOn(CanvasTextMetrics, 'measureText').mockReturnValue({ width: 10, height: 10, lines: [''], lineWidths: [10], lineHeight: 10, maxLineWidth: 10, fontProperties: { ascent: 8, descent: 2, fontSize: 10 } } as never);
});

describe('screens render from the stores', () => {
  it('title', () => {
    ui.setState(initialUi); drawAll();
    expect(texts()).toContain('Astras');
    expect(texts()).toContain('20 GODS · 12 KSHETRAS · 4 AGES');
  });
});

describe('every shared prefab renders from real content', () => {
  const page = screenUi('prefab "page" {\n    panel class="page" slot="items"\n}', '');
  const show = (...items: ReturnType<typeof use>[]) => page.show(use('page', {}, { items }));
  it('HUD, Kshetra toast, Prana bar, score, die', () => {
    show(hud('1:42', 'TRETA YUGA · ×1.5', { score: [bannerScore(1, 2)], die: [longDie(3, () => {})] }), kshetraToast(1, 'kishkindha'), pranaBar(6.4, 10));
    expect(texts()).toEqual(expect.arrayContaining(['1:42', 'TRETA YUGA · ×1.5', 'Kishkindha', 'Units here move 25% faster', '6']));
  });
  it('every card at every size, and every Kshetra toast', () => {
    for (const id of Object.keys(CARDS)) show(card(id, 'hand'), card(id, 'next'), card(id, 'face'), card(id, 'detail'));
    for (const [i, id] of Object.keys(KSHETRAS).entries()) show(kshetraToast((i % 3) + 1, id));
  });
  it('every card has at least one rule line, and Astras say CAST', () => {
    for (const id of Object.keys(CARDS)) {
      const rules = cardRules(id);
      if (!['agni'].includes(id)) expect(rules.length, id).toBeGreaterThan(0); // Agni is a plain fire-thrower: no rules
      if (CARDS[id]!.class === 'astra') expect(rules.map((r) => r.when), id).toContain('CAST');
    }
  });
  it('every Katha page, the report and the four blessings', () => {
    for (const id of Object.keys(KATHA)) show(kathaPage(id, true));
    show(reportCard({ kicker: 'K', rows: [['A', 'b']], remark: 'Sādhu!', stamp: 'sama', assisted: false }), ...['namaskar', 'sadhu', 'shubham', 'lotus'].map(emote));
    expect(texts()).toContain('SAMA');
    expect(() => emote('taunt')).toThrow();
  });
});
