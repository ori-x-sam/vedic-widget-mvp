import { describe, expect, it } from 'vitest';
import { CHAPTERS, FRAME, NEON, SCENE, UI_TEXT_PAIRS, cssTokens } from '../src/data/palettes';
import { contrastRatio, deltaE2000, hexToRgb, mix, rgbToLab } from '../src/lib/colour';

describe('WCAG AA for every UI text/background pair (§4.11)', () => {
  for (const p of UI_TEXT_PAIRS) {
    const need = p.large ? 3 : 4.5;
    it(`${p.name} ≥ ${need}:1`, () => {
      expect(contrastRatio(p.fg, p.bg)).toBeGreaterThanOrEqual(need);
    });
  }
  it('matches the contrast figures quoted in the brief (§4.1)', () => {
    expect(contrastRatio(FRAME.cream, FRAME.frame)).toBeCloseTo(11.7, 0);
    expect(contrastRatio(FRAME.gold, FRAME.frame)).toBeCloseTo(7.7, 0);
    expect(contrastRatio(FRAME.peach, FRAME.frame)).toBeCloseTo(7.1, 0);
  });
});

describe('palette spec', () => {
  it('keeps the §4.2 hex values exactly', () => {
    expect(SCENE).toMatchObject({
      sindoor: '#E8361F', haldi: '#FFC926', marigold: '#FF9414', rani: '#E62C7E', tota: '#38A845',
      peacock: '#00909A', neel: '#26389A', seafoam: '#86D5C4', laterite: '#B4502F', khondalite: '#776A60',
      limewhite: '#F6EFE0', chandan: '#D38B55', skyCream: '#F1DDB4',
    });
    expect(NEON).toEqual({ neonRani: '#FF3D9A', neonCyan: '#29E3E3' });
    expect(FRAME.frame).toBe('#4B211A');
  });
  it('chapter leads match §4.4', () => {
    expect([1, 2, 3, 5, 6].map((a) => CHAPTERS[a as 1].lead)).toEqual(['peacock', 'laterite', 'sindoor', 'marigold', 'rani']);
  });
  it('mixing stays inside the gamut and is symmetric at the ends', () => {
    expect(mix(SCENE.peacock, SCENE.seafoam, 0)).toBe(SCENE.peacock);
    expect(mix(SCENE.peacock, SCENE.seafoam, 1)).toBe(SCENE.seafoam);
  });
  it('ΔE2000 sanity: identical = 0, frame vs frameEdge is clearly different', () => {
    const a = rgbToLab(hexToRgb(FRAME.frame));
    expect(deltaE2000(a, a)).toBe(0);
    expect(deltaE2000(a, rgbToLab(hexToRgb(FRAME.frameEdge)))).toBeGreaterThan(5);
  });
  it('exposes every token as a CSS custom property', () => {
    const t = cssTokens();
    expect(t['--frame']).toBe(FRAME.frame);
    expect(t['--sky-cream']).toBe(SCENE.skyCream);
    expect(t['--ui-card-ink']).toBe(FRAME.frame);
  });
});
