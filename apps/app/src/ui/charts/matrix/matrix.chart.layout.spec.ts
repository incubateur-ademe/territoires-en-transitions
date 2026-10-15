import { describe, expect, it } from 'vitest';
import { buildDividers, toQuadrantLabel } from './matrix.chart';

describe('toQuadrantLabel', () => {
  it('place le badge en majuscules avant le titre, qui garde sa casse', () => {
    expect(
      toQuadrantLabel({
        badge: 'Levier à prioriser',
        title: 'Fort impact, peu mobilisé',
      })
    ).toBe('{badge|⚐ LEVIER À PRIORISER}  Fort impact, peu mobilisé');
  });

  it("garde la casse du titre quand il n'y a pas de badge", () => {
    expect(toQuadrantLabel({ title: 'Faible impact, bien mobilisé' })).toBe(
      'Faible impact, bien mobilisé'
    );
  });
});

describe('buildDividers', () => {
  it('trace une ligne par frontière intérieure partagée entre quadrants, sans bordure sur les axes', () => {
    const quadrants = [
      { from: { x: 0, y: 50 }, to: { x: 50, y: 100 } },
      { from: { x: 50, y: 50 }, to: { x: 100, y: 100 } },
      { from: { x: 0, y: 0 }, to: { x: 50, y: 50 } },
      { from: { x: 50, y: 0 }, to: { x: 100, y: 50 } },
    ];

    expect(buildDividers({ quadrants, bounds: { x: 100, y: 100 } })).toEqual([
      { xAxis: 50 },
      { yAxis: 50 },
    ]);
  });
});
