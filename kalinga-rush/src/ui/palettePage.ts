// ?palette=1 — frame colours, the scene palette, chapter palettes and every
// UI contrast pair, rendered from palettes.ts (§4.11).
import { CHAPTERS, DERIVED, EXTRA, FIXED, FRAME, NEON, SCENE, UI, UI_TEXT_PAIRS, TOKENS, type AnyToken } from '../data/palettes';
import { contrastRatio, hexToRgb, rgbToHsv } from '../lib/colour';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function swatch(name: string, hex: string, note = ''): string {
  const [h, s, v] = rgbToHsv(hexToRgb(hex));
  return `<div class="sw"><div class="chip" data-bg="${hex}"></div><div class="meta"><b>${esc(name)}</b><span>${hex}</span><br>HSV ${Math.round(h)}° · ${s.toFixed(2)} · ${v.toFixed(2)}${note ? `<br>${esc(note)}` : ''}</div></div>`;
}

export function renderPalettePage(): void {
  document.title = 'Kalinga Rush · palette';
  const root = document.createElement('div');
  root.className = 'palette-page';
  const vsFrame = (hex: string) => `${contrastRatio(hex, FRAME.frame).toFixed(1)}:1 on frame`;
  root.innerHTML = `
    <div class="lbl">Kalinga Rush · colour spec</div>
    <h1>Palette</h1>
    <p style="color:var(--ui-cream-muted);max-width:640px">Every colour in the game comes from <code>src/data/palettes.ts</code>. The frame keeps the reference's maroon; the painted scenes use retro Indian textbook colours.</p>

    <h2>4.1 Frame &amp; UI</h2>
    <div class="grid">${Object.entries(FRAME).map(([k, v]) => swatch(k, v, k === 'frame' || k === 'frameEdge' ? '' : vsFrame(v))).join('')}</div>

    <h2>4.2 Scene palette</h2>
    <div class="grid">${Object.entries(SCENE).map(([k, v]) => swatch(k, v)).join('')}</div>

    <h2>Act VII only</h2>
    <div class="grid">${Object.entries(NEON).map(([k, v]) => swatch(k, v, 'never before the twist')).join('')}</div>

    <h2>Extra &amp; derived</h2>
    <div class="grid">${Object.entries({ ...EXTRA, ...DERIVED }).map(([k, v]) => swatch(k, v)).join('')}</div>

    <h2>4.4 Chapter palettes (lead first)</h2>
    <div class="chapters">${Object.values(CHAPTERS).map((c) => `
      <div class="chapter"><div class="name">Act ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][c.act - 1]} · ${esc(c.name)}<small>${esc(c.note)}</small></div>
      <div class="bar">${[c.lead, ...c.supports].map((t) => `<div data-bg="${TOKENS[t as AnyToken]}" title="${t}"></div>`).join('')}</div></div>`).join('')}
    </div>

    <h2>Fixed colours</h2>
    <div class="grid">
      ${swatch('Taapoi skin', FIXED.taapoi.skin)}${swatch('frock', FIXED.taapoi.frock)}${swatch('frock border / ribbon', FIXED.taapoi.border)}${swatch('accent', FIXED.taapoi.accent)}
      ${swatch('record leaf', FIXED.record.leaf)}${swatch('record string', FIXED.record.string)}${swatch('cowrie', FIXED.cowrie.shell)}
      ${swatch('diya body', FIXED.diya.body)}${swatch('diya flame', FIXED.diya.flame)}${swatch('hazard rim', FIXED.hazardRim)}
    </div>

    <h2>UI text pairs · WCAG AA</h2>
    <table><tr><th>Pair</th><th>Sample</th><th>Ratio</th><th>AA</th></tr>
    ${UI_TEXT_PAIRS.map((p) => {
      const r = contrastRatio(p.fg, p.bg);
      const ok = r >= (p.large ? 3 : 4.5);
      return `<tr><td>${esc(p.name)}${p.large ? ' <small>(large)</small>' : ''}</td><td><span class="sample" data-fg="${p.fg}" data-bg="${p.bg}">Kalinga 1435</span></td><td>${r.toFixed(2)}:1</td><td class="${ok ? 'ok' : 'bad'}">${ok ? 'pass' : '✗ fail'}</td></tr>`;
    }).join('')}
    </table>
    <p style="margin-top:28px"><a href="./" style="color:var(--gold)">← back to the game</a></p>`;
  document.body.innerHTML = '';
  document.body.appendChild(root);
  root.querySelectorAll<HTMLElement>('[data-bg]').forEach((el) => (el.style.background = el.dataset.bg!));
  root.querySelectorAll<HTMLElement>('[data-fg]').forEach((el) => (el.style.color = el.dataset.fg!));
  void UI;
}
