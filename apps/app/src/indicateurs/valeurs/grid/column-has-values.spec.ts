import { describe, expect, it } from 'vitest';
import { columnHasValues } from './column-has-values';
import {
  generateCellKey,
  toIndicateurId,
  toYear,
  type CellKey,
  type GridCell,
} from './types';

describe('columnHasValues', () => {
  const id = toIndicateurId(1);
  const year = toYear(2040);
  const empty: GridCell = { resultat: null, objectif: null };

  it('false si toutes les cellules vides', () => {
    const cells = new Map<CellKey, GridCell>([
      [generateCellKey(id, year), empty],
    ]);
    expect(
      columnHasValues({ cells, year, indicateurIds: [id] })
    ).toBe(false);
  });

  it('true si résultat ou objectif présent', () => {
    const cells = new Map<CellKey, GridCell>([
      [generateCellKey(id, year), { resultat: 1, objectif: null }],
    ]);
    expect(
      columnHasValues({ cells, year, indicateurIds: [id] })
    ).toBe(true);
  });
});
