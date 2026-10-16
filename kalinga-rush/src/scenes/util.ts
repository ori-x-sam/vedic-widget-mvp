import { load } from '../systems/save';

export function isReducedMotion(): boolean {
  let media = false;
  try {
    media = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    media = false;
  }
  return media || load().settings.reducedMotion;
}

export function isTouch(): boolean {
  try {
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}
