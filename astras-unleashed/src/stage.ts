// The canvas and the design space. One Pixi canvas carries the arena (layers.arena) under the declarative screens
// (layers.ui).
// The design space is 390 design px on the screen's short side and as long as the aspect allows on the other: a phone
// held upright is 390 wide (the Kalinga Rush layout, header over battlefield over hand); held sideways it is 390 tall.
import { Application, Container } from 'pixi.js';
import { token } from './tokens';

/** The short side of the design space, design px: a 390 px-wide phone draws at 1:1. */
export const SHORT = 390;
/** A finger-sized target in design px (about 9 mm on a phone). */
const TOUCH_PX = 44;

/** The live design viewport: written only by fit(). */
export const view = { width: SHORT, height: 844, scale: 1, touch: TOUCH_PX };

// Created at import so screen modules can attach to them before the app boots (screens draw in import order).
export const layers = { arena: new Container(), ui: new Container() };

export const pixi = new Application();

/** Fit the design space to a CSS-pixel box. */
export function fit(cssW: number, cssH: number) {
  const scale = Math.min(cssW, cssH) / SHORT;
  view.scale = scale;
  view.width = cssW / scale;
  view.height = cssH / scale;
  pixi.renderer?.resize(cssW, cssH);
  pixi.stage.scale.set(scale);
}

export async function initPixi(el: HTMLElement, cssW: number, cssH: number) {
  await pixi.init({ background: token('--hud'), antialias: true, width: cssW, height: cssH, resolution: Math.min(2, devicePixelRatio || 1), autoDensity: true, autoStart: true });
  pixi.canvas.style.position = 'absolute';
  pixi.canvas.style.inset = '0';
  pixi.canvas.style.touchAction = 'none';
  el.appendChild(pixi.canvas);
  pixi.stage.addChild(layers.arena, layers.ui);
  pixi.stage.eventMode = 'static';
  fit(cssW, cssH);
}
