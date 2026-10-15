import { describe, expect, it } from 'vitest';
import {
  buildDividers,
  buildSelectedPointOutline,
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
  it('est un cercle creux de la couleur du ton non pertinent', () => {
    expect(toPointStyle(NON_PERTINENT_POINT)).toMatchObject({
      color: 'transparent',
      borderColor: toToneColor('light'),
    });
  });

  it('découpe son contour en cinq pointillés', () => {
    const { borderType } = toPointStyle(NON_PERTINENT_POINT);
    const [dash, gap] = Array.isArray(borderType) ? borderType : [];

    expect((dash + gap) * 5).toBeCloseTo(Math.PI * POINT_SIZE);
  });
});

describe('buildSelectedPointOutline', () => {
  it('trace un contour primary vide autour du point sélectionné, sans le remplir', () => {
    expect(
      buildSelectedPointOutline({
        points: [NON_PERTINENT_POINT],
        selectedPointId: NON_PERTINENT_POINT.id,
      })
    ).toMatchObject([
      {
        data: [
          {
            value: [NON_PERTINENT_POINT.x, NON_PERTINENT_POINT.y],
            itemStyle: {
              color: 'transparent',
              borderColor: toToneColor('default'),
            },
          },
        ],
      },
    ]);
  });

  it("ne trace rien quand aucun point n'est sélectionné", () => {
    expect(
      buildSelectedPointOutline({
        points: [NON_PERTINENT_POINT],
        selectedPointId: undefined,
      })
    ).toEqual([]);
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
