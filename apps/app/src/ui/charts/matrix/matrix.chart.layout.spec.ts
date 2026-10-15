import { describe, expect, it } from 'vitest';
import {
  buildDividers,
  buildSelectedPointPulse,
  POINT_SIZE,
  toPointStyle,
  toQuadrantLabel,
  toToneColor,
  type MatrixPoint,
} from './matrix.chart';

const NON_PERTINENT_POINT: MatrixPoint = {
  id: 'non-pertinent',
  label: 'Non pertinent',
  description: 'Description',
  tone: 'light',
  x: 20,
  y: 30,
};

describe('point non pertinent', () => {
  it('reste un cercle creux en pointillés, de la même couleur, une fois sélectionné', () => {
    expect(
      toPointStyle({ point: NON_PERTINENT_POINT, isSelected: true })
    ).toMatchObject({
      color: 'transparent',
      borderColor: toToneColor('light'),
    });
  });

  it('découpe son contour en cinq pointillés', () => {
    const { borderType } = toPointStyle({
      point: NON_PERTINENT_POINT,
      isSelected: false,
    });
    const [dash, gap] = Array.isArray(borderType) ? borderType : [];

    expect((dash + gap) * 5).toBeCloseTo(Math.PI * POINT_SIZE);
  });

  it("n'est pas rempli par l'impulsion de sélection", () => {
    expect(
      buildSelectedPointPulse({
        points: [NON_PERTINENT_POINT],
        selectedPointId: NON_PERTINENT_POINT.id,
      })
    ).toMatchObject([{ data: [{ itemStyle: { color: 'transparent' } }] }]);
  });
});

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
