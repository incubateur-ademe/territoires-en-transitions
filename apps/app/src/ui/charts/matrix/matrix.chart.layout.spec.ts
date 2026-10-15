import { describe, expect, it } from 'vitest';
import {
  buildDividers,
  buildHollowPointHalos,
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

const MIN_GRAPHICAL_CONTRAST_RATIO = 3;

const toRelativeLuminance = (hex: string): number => {
  const [red, green, blue] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const toContrastRatioOnWhite = (hex: string): number =>
  1.05 / (toRelativeLuminance(hex) + 0.05);

describe('point non pertinent', () => {
  it("contraste assez avec le blanc qui l'entoure pour rester visible", () => {
    expect(toContrastRatioOnWhite(toToneColor('light'))).toBeGreaterThanOrEqual(
      MIN_GRAPHICAL_CONTRAST_RATIO
    );
  });

  it('est un cercle à fond blanc, bordé de la couleur du ton non pertinent', () => {
    expect(toPointStyle(NON_PERTINENT_POINT)).toMatchObject({
      color: '#FFFFFF',
      borderColor: toToneColor('light'),
    });
  });

  it('découpe son contour en cinq pointillés', () => {
    const { borderType } = toPointStyle(NON_PERTINENT_POINT);
    const [dash, gap] = Array.isArray(borderType) ? borderType : [];

    expect((dash + gap) * 5).toBeCloseTo(Math.PI * POINT_SIZE);
  });
});

describe('buildHollowPointHalos', () => {
  const PERTINENT_POINT: MatrixPoint = {
    ...NON_PERTINENT_POINT,
    id: 'pertinent',
    tone: 'grey',
    x: 60,
    y: 80,
  };

  it('pose un fond blanc plus large que le point sous chaque point non pertinent seulement', () => {
    const [series] = buildHollowPointHalos([
      NON_PERTINENT_POINT,
      PERTINENT_POINT,
    ]);

    expect(series).toMatchObject({
      symbolSize: POINT_SIZE + 6,
      data: [
        {
          value: [NON_PERTINENT_POINT.x, NON_PERTINENT_POINT.y],
          itemStyle: { color: '#FFFFFF' },
        },
      ],
    });
  });

  it("ne trace rien quand aucun point n'est non pertinent", () => {
    expect(buildHollowPointHalos([PERTINENT_POINT])).toEqual([]);
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
