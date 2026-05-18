import { describe, expect, it } from 'vitest';
import {
  computeVariation,
  formatVariation,
  resolveVariationToReferenceYear,
} from './variation';
import {
  generateCellKey,
  CellKey,
  GridCell,
  toIndicateurId,
  toYear,
} from '../types';

describe('computeVariation', () => {
  it('rend la variation signee vs la valeur de reference', () => {
    expect(computeVariation({ value: 40, referenceValue: 100 })).toBe(
      -0.6
    );
    expect(computeVariation({ value: 140, referenceValue: 100 })).toBe(
      0.4
    );
  });

  it('rend null quand la valeur de reference est absente', () => {
    expect(
      computeVariation({ value: 40, referenceValue: null })
    ).toBe(null);
  });

  it('rend null quand la valeur de reference est nulle', () => {
    expect(computeVariation({ value: 40, referenceValue: 0 })).toBe(
      null
    );
  });
});

const NARROW_NO_BREAK_SPACE = 0x202f;

describe('formatVariation', () => {
  it('prefixe le signe et suffixe le pourcentage', () => {
    expect(formatVariation(-0.6)).toMatch(/^-60\s%$/);
    expect(formatVariation(0.4)).toMatch(/^\+40\s%$/);
    expect(formatVariation(0)).toMatch(/^0\s%$/);
  });

  it('rend au plus une decimale avec la virgule francaise', () => {
    expect(formatVariation(0.333)).toMatch(/^\+33,3\s%$/);
  });

  it('separe le nombre du pourcentage par une espace fine insecable', () => {
    const formatted = formatVariation(0.4);
    expect(formatted.charCodeAt(formatted.length - 2)).toBe(
      NARROW_NO_BREAK_SPACE
    );
  });
});

describe('resolveVariationToReferenceYear', () => {
  const indicateurId = toIndicateurId(1);
  const cell = (resultat: number | null, objectif: number | null): GridCell => ({
    resultat,
    objectif,
  });
  const cellsWith = (byYear: Record<number, GridCell>): Map<CellKey, GridCell> =>
    new Map(
      Object.entries(byYear).map(([year, gridCell]) => [
        generateCellKey(indicateurId, toYear(Number(year))),
        gridCell,
      ])
    );

  it('rend la variation objectif vs resultat de reference (+10%)', () => {
    expect(
      resolveVariationToReferenceYear({
        cell: cell(null, 110),
        cells: cellsWith({ 2026: cell(100, null), 2030: cell(null, 110) }),
        indicateurId,
        year: toYear(2030),
        referenceYear: toYear(2026),
      })
    ).toBe(0.1);
  });

  it('rend la variation d une colonne future vs la valeur de reference', () => {
    expect(
      resolveVariationToReferenceYear({
        cell: cell(null, 40),
        cells: cellsWith({ 2026: cell(100, null), 2050: cell(null, 40) }),
        indicateurId,
        year: toYear(2050),
        referenceYear: toYear(2026),
      })
    ).toBe(-0.6);
  });

  it('rend null pour l annee de reference et les annees passees', () => {
    expect(
      resolveVariationToReferenceYear({
        cell: cell(120, null),
        cells: cellsWith({ 2026: cell(100, null), 2020: cell(120, null) }),
        indicateurId,
        year: toYear(2020),
        referenceYear: toYear(2026),
      })
    ).toBe(null);
  });

  it('rend null sans annee de reference', () => {
    expect(
      resolveVariationToReferenceYear({
        cell: cell(null, 40),
        cells: cellsWith({ 2050: cell(null, 40) }),
        indicateurId,
        year: toYear(2050),
        referenceYear: null,
      })
    ).toBe(null);
  });

  it('rend null quand la cellule de reference est absente', () => {
    expect(
      resolveVariationToReferenceYear({
        cell: cell(null, 40),
        cells: cellsWith({ 2050: cell(null, 40) }),
        indicateurId,
        year: toYear(2050),
        referenceYear: toYear(2026),
      })
    ).toBe(null);
  });

  it('rend null quand l objectif courant est absent', () => {
    expect(
      resolveVariationToReferenceYear({
        cell: cell(40, null),
        cells: cellsWith({ 2026: cell(100, null), 2050: cell(40, null) }),
        indicateurId,
        year: toYear(2050),
        referenceYear: toYear(2026),
      })
    ).toBe(null);
  });
});
