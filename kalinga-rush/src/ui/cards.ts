// Cream textbook pages that slide up over the maroon frame (§4.7):
// lesson cards, the end-of-slice page, and small in-window messages.
import { odiaNumeral, type RecordDef } from '../data/records';
import { dateHtml } from './header';

const $ = (id: string) => document.getElementById(id)!;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const KIND_LABEL: Record<RecordDef['kind'], string> = {
  history: 'History',
  tradition: 'Tradition',
  legend: 'Legend',
  speculative: 'Speculative · not history',
};

const TICK_SVG = `<svg class="tick" viewBox="0 0 64 56" aria-label="Caught"><path d="M6 30 L24 48 L58 8"/></svg>`;

function open(html: string): HTMLElement {
  const layer = $('card-layer');
  layer.innerHTML = html;
  layer.classList.add('open');
  const card = layer.querySelector('.card') as HTMLElement;
  return card;
}

export function closeCard(): Promise<void> {
  const layer = $('card-layer');
  const card = layer.querySelector('.card');
  return new Promise((resolve) => {
    if (!card) {
      layer.classList.remove('open');
      resolve();
      return;
    }
    card.classList.add('closing');
    setTimeout(() => {
      layer.innerHTML = '';
      layer.classList.remove('open');
      resolve();
    }, 330);
  });
}

/** The lesson stamped into the reader when a palm-leaf record is caught. */
export function showLesson(rec: RecordDef, caught: boolean): Promise<void> {
  const ex = rec.exercise;
  const prompt = esc(ex.prompt).replace('____', '<span class="blank" data-blank>&nbsp;</span>');
  const card = open(`
    <article class="card lesson" role="dialog" aria-label="Lesson ${rec.num}">
      <div class="card-top"><span>Lesson ${rec.num}</span><span class="kind"><span class="kind-tag">${KIND_LABEL[rec.kind]}</span></span><span class="page" lang="or" aria-label="page ${rec.num}">${odiaNumeral(rec.num)}</span></div>
      ${caught ? TICK_SVG : ''}
      <div class="card-date">${dateHtml(rec.dateLine)}</div>
      <h2>${esc(rec.headline)}</h2>
      <p>${esc(rec.fact)}</p>
      <div class="dyk"><b>Did you know?</b>${esc(rec.didYouKnow)}</div>
      <div class="ex">
        <span class="ex-label">${ex.kind === 'fill' ? 'Fill in the blank' : 'True or false?'}</span>
        <p>${prompt}</p>
        <div class="opts">${ex.options.map((o) => `<button type="button" class="opt" data-opt="${esc(o)}">${esc(o)}</button>`).join('')}</div>
      </div>
      <div class="foot">
        <span class="src">Source · HISTORY.md › ${rec.sources.map(esc).join(', ')}</span>
        <button type="button" class="btn btn-gold" data-continue>Continue ▸</button>
      </div>
    </article>`);
  card.querySelectorAll<HTMLButtonElement>('.opt').forEach((b) => {
    b.addEventListener('click', () => {
      if (b.dataset.opt === ex.answer) {
        b.classList.add('right');
        const blank = card.querySelector('[data-blank]');
        if (blank) blank.textContent = ex.answer;
        card.querySelectorAll<HTMLButtonElement>('.opt').forEach((o) => (o.disabled = true));
      } else {
        b.classList.remove('wrong');
        void b.offsetWidth;
        b.classList.add('wrong');
      }
    });
  });
  const btn = card.querySelector<HTMLButtonElement>('[data-continue]')!;
  setTimeout(() => btn.focus({ preventScroll: true }), 50);
  return new Promise((resolve) => {
    btn.addEventListener('click', () => closeCard().then(resolve), { once: true });
  });
}

export interface EndChoice { label: string; value: string; primary?: boolean }

/** A plain textbook page with a title, a few lines and buttons. */
export function showPage(o: { label: string; title: string; lines: string[]; choices: EndChoice[] }): Promise<string> {
  const card = open(`
    <article class="card" role="dialog" aria-label="${esc(o.title)}">
      <div class="card-top"><span>${esc(o.label)}</span></div>
      <h2 style="margin-top:12px">${esc(o.title)}</h2>
      ${o.lines.map((l) => `<p>${l}</p>`).join('')}
      <div class="foot">${o.choices.map((c) => `<button type="button" class="btn ${c.primary ? 'btn-gold' : 'btn-ghost'}" data-v="${esc(c.value)}">${esc(c.label)}</button>`).join('')}</div>
    </article>`);
  const first = card.querySelector<HTMLButtonElement>('.btn-gold') ?? card.querySelector<HTMLButtonElement>('.btn');
  setTimeout(() => first?.focus({ preventScroll: true }), 50);
  return new Promise((resolve) => {
    card.querySelectorAll<HTMLButtonElement>('[data-v]').forEach((b) =>
      b.addEventListener('click', () => closeCard().then(() => resolve(b.dataset.v!)), { once: true }),
    );
  });
}

/** Pill message inside the game window. */
export function pill(text: string, where: 'bottom' | 'mid' | 'top' = 'bottom', ms = 0, pulse = false): HTMLElement {
  const el = document.createElement('div');
  el.className = `pill ${where}${pulse ? ' pulse' : ''} fade-in`;
  el.innerHTML = text;
  $('overlay').appendChild(el);
  if (ms > 0) dismiss(el, ms);
  return el;
}

export function dismiss(el: HTMLElement | null | undefined, after = 0): void {
  if (!el) return;
  setTimeout(() => {
    el.classList.add('fade-out');
    setTimeout(() => el.remove(), 420);
  }, after);
}

/** Floating "+5" style text at a game-window position (0–1 fractions). */
export function floatText(text: string, fx: number, fy: number): void {
  const el = document.createElement('div');
  el.className = 'float';
  el.textContent = text;
  el.style.left = `${fx * 100}%`;
  el.style.top = `${fy * 100}%`;
  $('overlay').appendChild(el);
  setTimeout(() => el.remove(), 1200);
}
