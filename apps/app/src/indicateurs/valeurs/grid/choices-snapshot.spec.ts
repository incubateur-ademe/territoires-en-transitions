import { describe, expect, it } from 'vitest';
import { toChoicesSnapshot } from './choices-snapshot';
import {
  CellKey,
  GridCell,
  generateCellKey,
  toIndicateurId,
  toYear,
} from './types';

const cellAt = (
  indicateurId: number,
  year: number,
  cell: GridCell
): [CellKey, GridCell] => [
  generateCellKey(toIndicateurId(indicateurId), toYear(year)),
  cell,
];

const openDataCell: GridCell = {
  kind: 'open-data',
  value: 180,
  selectedSourceId: 'citepa',
  source: {
    sourceId: 'citepa',
    libelle: 'CITEPA',
    methodologie: null,
    dateVersion: '2026-01-01',
  },
  coveringSources: [],
};

const filledUserCell: GridCell = {
  kind: 'user-data',
  value: 168,
  coveringSources: [],
};

const emptyUserCell: GridCell = {
  kind: 'user-data',
  value: null,
  coveringSources: [],
};

describe('toChoicesSnapshot', () => {
  it('regroupe les choix par indicateur (valeur maison = source null, open data = source)', () => {
    const snapshot = toChoicesSnapshot(
      new Map([
        cellAt(3, 2026, filledUserCell),
        cellAt(3, 2030, openDataCell),
      ])
    );
    expect(snapshot).toEqual({
      [toIndicateurId(3)]: [
        { year: toYear(2026), value: 168, source: null },
        {
          year: toYear(2030),
          value: 180,
          source: { sourceId: 'citepa', libelle: 'CITEPA' },
        },
      ],
    });
  });

  it('ignore les cellules user-data sans valeur (aucun choix)', () => {
    expect(toChoicesSnapshot(new Map([cellAt(3, 2036, emptyUserCell)]))).toEqual(
      {}
    );
  });
});
