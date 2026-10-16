// The title card in the page header (§1): tracked peach label, gold date
// line, huge two-line cream headline. The "sting" re-plays on each record.
import type { RecordOutline } from '../data/records';
import { applyLayout, layoutMode } from './layout';

const $ = (id: string) => document.getElementById(id)!;

/** Split a headline into two balanced lines (two lines max, §4.8). */
export function twoLines(text: string): [string, string] {
  const words = text.split(' ');
  if (words.length < 3) return [text, ''];
  let best: [string, string] = [text, ''];
  let bestScore = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    // prefer breaking after sentence punctuation, then balance
    const punct = /[.:]$/.test(words[i - 1]) ? -6 : 0;
    const score = Math.abs(a.length - b.length) + punct + (b.length > a.length ? 1 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = [a, b];
    }
  }
  return best;
}

/** Date lines are shown in caps, except the lowercase "c." for circa. */
export function dateHtml(date: string): string {
  const esc = date.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc.replace(/^c\. /i, '<span class="c">c.</span> ');
}

export function showRecordHeader(rec: RecordOutline, animate = true): void {
  const hdr = $('hdr');
  $('hdr-date').innerHTML = dateHtml(rec.dateLine);
  const [a, b] = twoLines(rec.headline);
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  $('hdr-headline').innerHTML = `<span class="ln"><span>${esc(a)}</span></span>${b ? `<span class="ln"><span>${esc(b)}</span></span>` : ''}`;
  if (animate) {
    hdr.classList.remove('sting');
    void hdr.offsetWidth; // restart the CSS animation
    hdr.classList.add('sting');
  }
  applyLayout();
  if (animate && layoutMode() === 'strip') band(rec);
}

/** In landscape the header is a slim strip, so also run a band across the game window. */
function band(rec: RecordOutline): void {
  const ov = $('overlay');
  ov.querySelector('.band')?.remove();
  const el = document.createElement('div');
  el.className = 'band';
  el.innerHTML = `<div class="d">${dateHtml(rec.dateLine)}</div><div class="h"></div>`;
  (el.querySelector('.h') as HTMLElement).textContent = rec.headline;
  ov.appendChild(el);
  setTimeout(() => el.remove(), 2700);
}
