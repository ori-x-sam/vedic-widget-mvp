// Everything whose lifetime is the game's starts here and is torn down by the disposer boot() returns: the fonts and
// painted art, the
// canvas, the clock, the store subscriptions that draw the screens, and resize handling.
import { onTick, startClock } from './clock';
import { fit, initPixi, pixi } from './stage';
import { game, ui } from './store';
import { loadFonts, tickScreens } from './screens/shared';
import { preloadArt } from './view/art';
// Screens stack in import order (each screenUi attaches to layers.ui as its module loads): later draws on top.
import { drawTitle } from './screens/title';

/** Draw every screen from the stores (each skips the render when its tree is unchanged). */
export function drawScreens() {
  drawTitle();
}

/** One synchronous frame: what a settled story shows and hit-tests against. */
export function renderNow() {
  pixi.renderer.render(pixi.stage);
}

export async function boot(el: HTMLElement): Promise<() => void> {
  const w = el.clientWidth || innerWidth, h = el.clientHeight || innerHeight;
  await Promise.all([loadFonts(), preloadArt()]);
  await initPixi(el, w, h);

  const offTick = onTick((dt) => tickScreens(dt));
  const stopClock = startClock(pixi.ticker, renderNow);
  const unsubs = [game.subscribe(drawScreens), ui.subscribe(drawScreens)];

  const resize = () => fit(el.clientWidth || innerWidth, el.clientHeight || innerHeight);
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();
  drawScreens();

  return () => {
    ro.disconnect();
    unsubs.forEach((u) => u());
    stopClock(); offTick();
  };
}
