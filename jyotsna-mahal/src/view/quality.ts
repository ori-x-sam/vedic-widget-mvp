// How hard the view works, by device. A phone (a coarse pointer: a touch screen is the main input) gets a lighter
// frame: fewer device pixels, lighter antialiasing and bloom, smaller shadow maps, no shadows from Bhima's moving
// lantern, a thinner jungle. Everything else, models included, is the same game.
export const PHONE = !!globalThis.matchMedia?.('(pointer: coarse)')?.matches;

export const QUALITY = PHONE
  ? { maxRatio: 1.5, samples: 2, bloomDiv: 4, sunMap: 1024, moonMap: 512, lanternShadow: false, trees: 60, scrub: 80 }
  : { maxRatio: 2, samples: 4, bloomDiv: 2, sunMap: 2048, moonMap: 1024, lanternShadow: true, trees: 90, scrub: 90 };
