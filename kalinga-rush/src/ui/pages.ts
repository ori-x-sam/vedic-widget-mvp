// Textbook pages for the journey: act complete (continue, or start again from
// the very beginning), game over (checkpoint or the very start), pause,
// settings, the lesson book, chapter select and the Progress Report.
import { ACT_NAMES, ACT_ROMAN, OUTLINE, RECORDS, odiaNumeral, type RecordOutline } from '../data/records';
import { load, save, type Settings } from '../systems/save';
import { closeCard, showLesson, showPage } from './cards';
import { dateHtml } from './header';

const $ = (id: string) => document.getElementById(id)!;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function open(html: string): HTMLElement {
  const layer = $('card-layer');
  layer.innerHTML = html;
  layer.classList.add('open');
  return layer.querySelector('.card') as HTMLElement;
}

function wire(card: HTMLElement): Promise<string> {
  const first = card.querySelector<HTMLButtonElement>('.btn-gold') ?? card.querySelector<HTMLButtonElement>('[data-v]');
  setTimeout(() => first?.focus({ preventScroll: true }), 50);
  return new Promise((resolve) => {
    card.querySelectorAll<HTMLButtonElement>('[data-v]').forEach((b) =>
      b.addEventListener('click', () => closeCard().then(() => resolve(b.dataset.v!)), { once: true }),
    );
  });
}

export interface RunStats { cowries: number; diyasLost: number; time: number; caught: number; total: number; assisted: boolean }

export function statsLine(s: RunStats): string {
  return `Records <b>${s.caught} / ${s.total}</b> · Cowries <b>${s.cowries}</b> · Diyas lost <b>${s.diyasLost}</b> · Time <b>${fmtTime(s.time)}</b>`;
}

export function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Act complete: the player chooses to carry on, or to start again from the very start. */
export function showActComplete(act: number, next: RecordOutline, s: RunStats): Promise<'continue' | 'restart' | 'book'> {
  return showPage({
    label: `Act ${ACT_ROMAN[act - 1]} · ${ACT_NAMES[act as 1]} · complete`,
    title: `Act ${ACT_ROMAN[act - 1]} is in your reader.`,
    lines: [
      statsLine(s),
      `Your place is saved at <b>Act ${ACT_ROMAN[next.act - 1]} · ${esc(ACT_NAMES[next.act])}</b>. Carry on from this checkpoint, or begin the reader again from the very first page.`,
    ],
    choices: [
      { label: `Continue to Act ${ACT_ROMAN[next.act - 1]} ▸`, value: 'continue', primary: true },
      { label: 'Start from the very beginning', value: 'restart' },
      { label: 'Lesson book', value: 'book' },
    ],
  }) as Promise<'continue' | 'restart' | 'book'>;
}

/** Out of diyas: back to the checkpoint, the start of this act, or the very start. */
export function showGameOver(cp: RecordOutline, shelter: boolean): Promise<'checkpoint' | 'act' | 'restart' | 'title'> {
  const actFirst = OUTLINE.find((r) => r.act === cp.act)!;
  const choices = [{ label: shelter ? 'Try again from the shelter ▸' : `Try again from ${cp.dateLine} ▸`, value: 'checkpoint', primary: true }];
  if (!shelter && actFirst.id !== cp.id) choices.push({ label: `Start of Act ${ACT_ROMAN[cp.act - 1]}`, value: 'act', primary: false });
  choices.push({ label: 'From the very beginning', value: 'restart', primary: false });
  choices.push({ label: 'Title', value: 'title', primary: false });
  return showPage({
    label: 'The diyas went out',
    title: shelter ? 'Rest in the shelter, then go again.' : `Back to ${cp.dateLine}.`,
    lines: [shelter ? 'You reached a cyclone shelter: it kept your place.' : `Your checkpoint is <b>Lesson ${cp.num}</b> — ${esc(cp.headline)} Your diyas are lit again.`],
    choices,
  }) as Promise<'checkpoint' | 'act' | 'restart' | 'title'>;
}

export function showPause(): Promise<'resume' | 'book' | 'settings' | 'checkpoint' | 'title'> {
  return showPage({
    label: 'Paused',
    title: 'A short break.',
    lines: ['Space, tap or click to jump · hold to jump higher.'],
    choices: [
      { label: 'Resume ▸', value: 'resume', primary: true },
      { label: 'Lesson book', value: 'book' },
      { label: 'Settings', value: 'settings' },
      { label: 'Restart from checkpoint', value: 'checkpoint' },
      { label: 'Title', value: 'title' },
    ],
  }) as Promise<'resume' | 'book' | 'settings' | 'checkpoint' | 'title'>;
}

/** Settings: Assist Mode, reduced motion, music, sound effects, lesson text size. */
export function showSettings(onChange: (s: Settings) => void = () => {}): Promise<void> {
  const s = load().settings;
  const tog = (k: keyof Settings, label: string, hint: string) =>
    `<button type="button" class="set-row" role="switch" aria-checked="${s[k] ? 'true' : 'false'}" data-k="${k}"><span><b>${label}</b><small>${hint}</small></span><i class="sw"></i></button>`;
  const card = open(`
    <article class="card settings" role="dialog" aria-label="Settings">
      <div class="card-top"><span>Settings</span></div>
      <h2 style="margin-top:12px">Settings</h2>
      ${tog('assist', 'Assist Mode', '0.75× speed and 5 diyas. Your report card says “Assisted”.')}
      ${tog('reducedMotion', 'Reduced motion', 'No screen shake, no print-glitch effects.')}
      ${tog('music', 'Music', 'Mardala, gini, bansuri and harmonium.')}
      ${tog('sfx', 'Sound effects', 'Jumps, cowries, the conch.')}
      <div class="set-row static"><span><b>Lesson text size</b><small>For the lesson cards and pages.</small></span>
        <span class="seg">${[0.9, 1, 1.15, 1.3].map((v) => `<button type="button" class="opt${Math.abs(s.textScale - v) < 0.01 ? ' right' : ''}" data-scale="${v}">${v === 0.9 ? 'A−' : v === 1 ? 'A' : v === 1.15 ? 'A+' : 'A++'}</button>`).join('')}</span></div>
      <div class="foot"><button type="button" class="btn btn-gold" data-v="done">Done</button></div>
    </article>`);
  card.querySelectorAll<HTMLButtonElement>('.set-row[data-k]').forEach((b) =>
    b.addEventListener('click', () => {
      const k = b.dataset.k as keyof Settings;
      const d = save((d) => { (d.settings[k] as boolean) = !d.settings[k]; });
      b.setAttribute('aria-checked', d.settings[k] ? 'true' : 'false');
      onChange(d.settings);
    }),
  );
  card.querySelectorAll<HTMLButtonElement>('[data-scale]').forEach((b) =>
    b.addEventListener('click', () => {
      const v = Number(b.dataset.scale);
      const d = save((d) => { d.settings.textScale = v; });
      card.querySelectorAll('[data-scale]').forEach((o) => o.classList.toggle('right', o === b));
      applyTextScale();
      onChange(d.settings);
    }),
  );
  return wire(card).then(() => undefined);
}

export function applyTextScale(): void {
  document.getElementById('app')?.style.setProperty('--lesson-scale', String(load().settings.textScale));
}

/** The lesson book: every lesson as a tab; caught ones open, the rest wait. */
export async function showLessonBook(): Promise<void> {
  for (;;) {
    const d = load();
    const list = OUTLINE.filter((o) => o.act < 7 || d.seenTwist);
    const caught = list.filter((o) => d.lessons[o.id]?.caught).length;
    const card = open(`
      <article class="card book" role="dialog" aria-label="Lesson book">
        <div class="card-top"><span>Ama Kalinga · A Picture Reader</span><span class="page" lang="or">ଆମ କଳିଙ୍ଗ</span></div>
        <h2 style="margin-top:12px">Lesson book</h2>
        <p>${caught} of ${list.length} lessons stamped. Catch a record to stamp its lesson.</p>
        <div class="tabs">${list.map((o) => {
          const ok = !!d.lessons[o.id]?.caught;
          return `<button type="button" class="tab${ok ? ' ok' : ''}${o.act === 7 ? ' future' : ''}" ${ok ? `data-v="${o.id}"` : 'disabled'} aria-label="Lesson ${o.num}${ok ? '' : ' (not yet stamped)'}"><span class="n" lang="or">${odiaNumeral(o.num)}</span><span class="d">${dateHtml(o.dateLine)}</span><span class="h">${ok ? esc(o.headline) : '· · ·'}</span></button>`;
        }).join('')}</div>
        <div class="foot"><button type="button" class="btn btn-gold" data-v="close">Close</button></div>
      </article>`);
    const v = await wire(card);
    if (v === 'close') return;
    await showLesson(RECORDS[v], true);
  }
}

/** Title → Chapters: start at any act the player has reached. */
export function showChapters(): Promise<string> {
  const d = load();
  const acts = [1, 2, 3, 4, 5, 6, 7].filter((a) => a <= d.actReached && (a < 7 || d.seenTwist));
  return showPage({
    label: 'Chapters',
    title: 'Start from a chapter.',
    lines: ['Chapters unlock as you reach them. Diyas and cowries start fresh.'],
    choices: [
      ...acts.map((a, i) => ({ label: `Act ${ACT_ROMAN[a - 1]} · ${ACT_NAMES[a as 1]}`, value: String(a), primary: i === acts.length - 1 })),
      { label: 'Back', value: 'back' },
    ],
  });
}

export function grade(s: RunStats): { grade: string; remark: string } {
  const frac = s.caught / Math.max(1, s.total);
  const lostPer = s.diyasLost / Math.max(1, s.caught);
  const score = frac * 100 - lostPer * 18;
  if (score > 92) return { grade: 'A+', remark: 'Very good. Keep sailing.' };
  if (score > 80) return { grade: 'A', remark: 'Excellent work. The sea is yours.' };
  if (score > 65) return { grade: 'B+', remark: 'Good effort. Mind the waves.' };
  if (score > 50) return { grade: 'B', remark: 'Steady progress. Read Lesson 3 again.' };
  return { grade: 'C', remark: 'Keep practising. Every boita starts small.' };
}

/** The school Progress Report on cream card stock (§2.4). */
export function showReportCard(s: RunStats, o: { title?: string; choices?: { label: string; value: string; primary?: boolean }[]; note?: string } = {}): Promise<string> {
  const g = grade(s);
  const choices = o.choices ?? [{ label: 'Play again', value: 'again', primary: true }, { label: 'Title', value: 'title' }];
  const card = open(`
    <article class="card report" role="dialog" aria-label="Progress report">
      <div class="card-top"><span>${esc(o.title ?? 'Progress Report')}</span><span class="page" lang="or">ଆମ କଳିଙ୍ଗ</span></div>
      <div class="rep-head">Ama Kalinga School · Cuttack</div>
      <table class="rep">
        <tr><th>Name</th><td>Taapoi</td><th>Class</th><td>Kalinga</td></tr>
        <tr><th>Records caught</th><td>${s.caught} / ${s.total}</td><th>Cowries</th><td>${s.cowries}</td></tr>
        <tr><th>Diyas lost</th><td>${s.diyasLost}</td><th>Time</th><td>${fmtTime(s.time)}</td></tr>
      </table>
      <div class="rep-grade"><span class="g">${g.grade}</span><span class="remark">${esc(g.remark)}</span></div>
      ${s.assisted ? '<div class="rep-assist">Assisted</div>' : ''}
      <div class="stamp" aria-hidden="true">Ama Kalinga<br/>✦ Passed ✦</div>
      ${o.note ? `<p class="rep-note">${o.note}</p>` : ''}
      <div class="foot">${choices.map((c) => `<button type="button" class="btn ${c.primary ? 'btn-gold' : 'btn-ghost'}" data-v="${esc(c.value)}">${esc(c.label)}</button>`).join('')}</div>
    </article>`);
  return wire(card);
}
