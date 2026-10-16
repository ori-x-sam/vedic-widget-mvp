// Page layout (§4.6). Portrait/tall screens: header stacked above a full-width
// 16:9 game window. Landscape phones: the game window fills the screen and
// the header shrinks to a slim strip. Chooses whichever keeps the window big,
// and keeps the window the same size on the title screen and in play.

export type LayoutMode = 'stacked' | 'strip';

const STRIP_H = 44;
let mode: LayoutMode = 'stacked';
const listeners = new Set<(m: LayoutMode) => void>();

const $ = (id: string) => document.getElementById(id)!;

function viewport(): { w: number; h: number } {
  const vv = window.visualViewport;
  return { w: Math.round(vv?.width ?? window.innerWidth), h: Math.round(vv?.height ?? window.innerHeight) };
}

function outerH(el: HTMLElement): number {
  if (getComputedStyle(el).display === 'none') return 0;
  const cs = getComputedStyle(el);
  return el.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
}

function setWindow(app: HTMLElement, gw: number): void {
  app.style.setProperty('--gw', `${Math.floor(gw)}px`);
  app.style.setProperty('--gh', `${Math.floor((gw * 9) / 16)}px`);
}

export function applyLayout(): void {
  const app = $('app');
  const { w, h } = viewport();
  const cs = getComputedStyle(app);
  const vw = w - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const vh = h - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  app.style.setProperty('--gutter', `${vw < 600 ? 16 : 20}px`);

  // Measure the in-play header and HUD (even on the title screen) in stacked form.
  const isTitle = app.classList.contains('is-title');
  app.classList.remove('layout-strip', 'is-title');
  app.classList.add('layout-stacked');
  app.style.removeProperty('--fs-title');
  setWindow(app, vw);
  let stackedW = vw;
  for (let i = 0; i < 2; i++) {
    const top = outerH($('hdr'));
    const bottom = outerH($('hud')) + 8;
    stackedW = Math.max(0, Math.min(vw, ((vh - top - bottom - 24) * 16) / 9));
    setWindow(app, stackedW);
  }
  if (isTitle) app.classList.add('is-title');

  const stripW = Math.min(vw, ((vh - STRIP_H) * 16) / 9);
  const next: LayoutMode = stackedW >= stripW * 0.72 ? 'stacked' : 'strip';
  if (next === 'strip') {
    app.classList.remove('layout-stacked');
    app.classList.add('layout-strip');
    setWindow(app, stripW);
  } else if (isTitle) {
    // Shrink the giant title (not below ~60% of its size) until title + window
    // + Play fit; if it still doesn't fit, the window gives up the difference.
    const gh = (stackedW * 9) / 16;
    const below = outerH($('below'));
    const avail = vh - gh - below - 48;
    const natural = parseFloat(getComputedStyle($('title').querySelector('.title-word')!).fontSize);
    let fs = natural;
    const minFs = Math.max(56, natural * 0.6);
    for (let i = 0; i < 12 && outerH($('title')) > avail && fs > minFs; i++) {
      fs = Math.max(minFs, fs * 0.9);
      app.style.setProperty('--fs-title', `${Math.round(fs)}px`);
    }
    const titleH = outerH($('title'));
    if (titleH > avail) setWindow(app, Math.max(0, Math.min(stackedW, ((vh - titleH - below - 48) * 16) / 9)));
  }
  if (next !== mode) {
    mode = next;
    for (const l of listeners) l(mode);
  }
  window.dispatchEvent(new Event('kr-layout'));
}

export function layoutMode(): LayoutMode {
  return mode;
}

export function onLayout(l: (m: LayoutMode) => void): void {
  listeners.add(l);
}

export function initLayout(): void {
  let raf = 0;
  const schedule = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(applyLayout);
  };
  window.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  applyLayout();
}
