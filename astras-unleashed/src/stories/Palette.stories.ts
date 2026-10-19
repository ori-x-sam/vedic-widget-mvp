// The palette, seen: every token in the :root of screens/shared.css, grouped under its `/* ── Heading ── */`, each with
// its swatch, hex and the comment beside it; then every text/background pair with its WCAG ratio, the pairs waiting on a
// decision. The look numbers are the last group. Tune a colour in shared.css and this page follows (hot reload).
import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import sharedCss from '../screens/shared.css?raw';
import { TOKENS } from '../tokens';
import { LOOK, LOOK_KEYS, lookToken } from '../view/look';
import { aaMin, contrast, FAILING_PAIRS, TEXT_PAIRS, type TextPair } from '../view/contrast';

export default { title: 'Foundation/Palette' } satisfies Meta;

type Row = { name: string; value: string; note: string };
/** The :root's tokens in file order, under their headings. */
function groups(): { title: string; note: string; rows: Row[] }[] {
  const body = /:root\s*\{([\s\S]*?)\n\}/.exec(sharedCss)?.[1] ?? '';
  const out: { title: string; note: string; rows: Row[] }[] = [];
  for (const line of body.split('\n')) {
    const head = /\/\*\s*──\s*(.+?)\s*──\s*(.*?)\s*(\*\/)?$/.exec(line.trim());
    if (head) { out.push({ title: head[1]!, note: head[2]!, rows: [] }); continue; }
    const tok = /^\s*(--[\w-]+)\s*:\s*([^;]+);\s*(?:\/\*\s*(.*?)\s*\*\/)?/.exec(line);
    if (tok && out.length) out.at(-1)!.rows.push({ name: tok[1]!, value: tok[2]!.trim(), note: tok[3] ?? '' });
  }
  return out;
}

const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);
const css = (name: string) => TOKENS[name]!;
const el = (tag: string, style: Partial<CSSStyleDeclaration> = {}, text = '') => { const e = document.createElement(tag); Object.assign(e.style, style); e.textContent = text; return e; };

function page() {
  const root = el('div', { background: css('--hud'), color: css('--cream'), fontFamily: '"Baloo 2", sans-serif', padding: '24px 16px 48px', minHeight: '100vh', boxSizing: 'border-box' });
  root.dataset.palette = '';
  const kicker = (t: string) => el('div', { fontFamily: '"Lilita One", sans-serif', fontWeight: '400', letterSpacing: '0.28em', fontSize: '12px', color: css('--gold'), textTransform: 'uppercase', margin: '28px 0 10px' }, t);
  root.append(kicker('Astras Unleashed · Palette'));
  root.append(el('h1', { fontFamily: '"Lilita One", sans-serif', fontWeight: '400', letterSpacing: '0', fontSize: '44px', lineHeight: '0.95', margin: '0 0 6px' }, 'Every colour,'));
  root.append(el('h1', { fontFamily: '"Lilita One", sans-serif', fontWeight: '400', letterSpacing: '0', fontSize: '44px', lineHeight: '0.95', margin: '0 0 8px', color: css('--gold') }, 'in one place.'));

  for (const g of groups()) {
    root.append(kicker(g.title));
    if (g.note) root.append(el('div', { fontSize: '13px', opacity: '0.75', margin: '-4px 0 10px' }, g.note));
    const grid = el('div', { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '8px' });
    for (const r of g.rows) {
      const card = el('div', { background: css('--hud-edge'), border: `1px solid ${css('--hud-rule')}`, borderRadius: '6px', overflow: 'hidden' });
      card.dataset.token = r.name;
      if (isHex(r.value)) { const sw = el('div', { background: r.value, height: '44px' }); sw.dataset.swatch = r.name; card.append(sw); }
      const t = el('div', { padding: '6px 8px', fontSize: '12px', lineHeight: '1.3' });
      t.append(el('div', { fontFamily: '"Lilita One", sans-serif', fontWeight: '400', color: css('--cream') }, r.name));
      t.append(el('div', { color: css('--gold'), fontFamily: 'monospace' }, r.value));
      if (r.note) t.append(el('div', { opacity: '0.75' }, r.note));
      card.append(t);
      grid.append(card);
    }
    root.append(grid);
  }

  const pairs = (title: string, list: TextPair[]) => {
    root.append(kicker(title));
    for (const p of list) {
      const ratio = contrast(p.text, p.bg), ok = ratio >= aaMin(p);
      const row = el('div', { display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 6px' });
      row.dataset.pair = `${p.text} on ${p.bg}`;
      row.dataset.ok = String(ok);
      row.append(el('div', { background: css(p.bg), color: css(p.text), fontFamily: '"Lilita One", sans-serif', fontWeight: '400', fontSize: p.large ? '22px' : '15px', padding: '6px 10px', borderRadius: '4px', minWidth: '120px', border: `1px solid ${css('--hud-rule')}` }, p.large ? 'Aa ५' : 'Aa Prana ५'));
      row.append(el('div', { fontSize: '12px', lineHeight: '1.3' }, `${ratio.toFixed(2)}:1 ${ok ? 'AA' : 'FAILS'}${p.large ? ' (large)' : ''} · ${p.text} on ${p.bg} · ${p.use}`));
      root.append(row);
    }
  };
  pairs('Text pairs · WCAG AA', TEXT_PAIRS);
  pairs('Needs a decision', FAILING_PAIRS);
  return root;
}

export const Palette: StoryObj = {
  render: () => page(),
  play: async ({ canvasElement }) => {
    const hexTokens = Object.entries(TOKENS).filter(([, v]) => isHex(v)).map(([k]) => k);
    const swatches = [...canvasElement.querySelectorAll<HTMLElement>('[data-swatch]')].map((e) => e.dataset.swatch);
    await expect(swatches.sort()).toEqual(hexTokens.sort());
    const shown = [...canvasElement.querySelectorAll<HTMLElement>('[data-token]')].map((e) => e.dataset.token);
    await expect(shown.sort()).toEqual(Object.keys(TOKENS).sort());
    for (const k of LOOK_KEYS) await expect(canvasElement.querySelector(`[data-token="${lookToken(k)}"]`)?.textContent).toContain(String(LOOK[k as keyof typeof LOOK]));
    await expect([...canvasElement.querySelectorAll<HTMLElement>('[data-pair][data-ok="false"]')].length).toBe(FAILING_PAIRS.length);
  },
};
