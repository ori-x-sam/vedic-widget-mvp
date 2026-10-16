// HUD: diyas (lives), cowries, records n / 37 (§2.2, §3).
import { RECORDS_BEFORE_TWIST } from '../data/records';

const $ = (id: string) => document.getElementById(id)!;

export const DIYA_SVG = `<svg class="diya" viewBox="0 0 40 34" aria-hidden="true">
  <circle class="smoke" cx="20" cy="7" r="4.5"/>
  <path class="flame" d="M20 2.5C24.6 9 25.6 13.6 20 18.2 14.4 13.6 15.4 9 20 2.5Z"/>
  <path class="core" d="M20 8.6C22.3 11.8 22.4 14.5 20 16.8 17.6 14.5 17.7 11.8 20 8.6Z"/>
  <path class="body" d="M3 19.5C8 31.5 32 31.5 37 19.5 30 22.4 10 22.4 3 19.5Z M33.5 20.6 39.4 17.4 36.4 22.6Z"/>
  <ellipse class="oil" cx="20" cy="20.3" rx="14.6" ry="1.9"/>
</svg>`;

const COWRIE_SVG = `<svg viewBox="0 0 24 18" width="1.3em" height="1em" aria-hidden="true">
  <ellipse cx="12" cy="9" rx="10.6" ry="7.6" style="fill:var(--cowrie-shell);stroke:var(--cowrie-shade);stroke-width:1.4"/>
  <path d="M4.4 9.4C8 7.6 15 11 19.6 8.8" style="fill:none;stroke:var(--cowrie-mouth);stroke-width:1.6;stroke-linecap:round"/>
  <path d="M7 7.4v3.6M9.5 7.6v3.6M12 7.9v3.6M14.5 7.9v3.6M17 7.6v3.4" style="stroke:var(--cowrie-mouth);stroke-width:0.9"/>
</svg>`;

const LEAF_SVG = `<svg viewBox="0 0 30 18" width="1.6em" height="1em" aria-hidden="true">
  <path d="M2 4.4Q15 2 28 4.2 29.6 8.6 28 13.4 15 15.6 2 13.6 0.6 9 2 4.4Z" style="fill:var(--leaf);stroke:var(--leaf-script);stroke-width:1"/>
  <path d="M9 7.2h16M9 10.4h14" style="stroke:var(--leaf-script);stroke-width:0.9;stroke-dasharray:2 1.4"/>
  <circle cx="5.4" cy="9" r="1.3" style="fill:var(--leaf-script)"/>
  <path d="M5.4 9.6Q3 15 6.6 17.2" style="fill:none;stroke:var(--leaf-string);stroke-width:1.4;stroke-linecap:round"/>
</svg>`;

let lives = 0;

export function initHud(maxLives: number): void {
  const d = $('hud-diyas');
  d.innerHTML = Array.from({ length: maxLives }, () => DIYA_SVG).join('');
  lives = maxLives;
  $('hud-cowries').querySelector('.ico')!.innerHTML = COWRIE_SVG;
  $('hud-records').querySelector('.ico')!.innerHTML = LEAF_SVG;
  setCowries(0, false);
}

export function setLives(n: number): void {
  const diyas = [...$('hud-diyas').querySelectorAll('.diya')];
  diyas.forEach((el, i) => el.classList.toggle('out', i >= n));
  lives = n;
  $('hud-diyas').setAttribute('aria-label', `${n} diya${n === 1 ? '' : 's'} left`);
}

export function getLives(): number {
  return lives;
}

export function setCowries(n: number, bump = true): void {
  const el = $('hud-cowries');
  el.querySelector('b')!.textContent = String(n);
  if (bump) {
    el.classList.remove('bump');
    void (el as HTMLElement).offsetWidth;
    el.classList.add('bump');
  }
}

export function setRecords(n: number, total = RECORDS_BEFORE_TWIST): void {
  const el = $('hud-records');
  el.querySelector('b')!.textContent = String(n);
  el.querySelector('.of')!.textContent = `/ ${total}`;
  el.classList.remove('bump');
  void (el as HTMLElement).offsetWidth;
  el.classList.add('bump');
}
