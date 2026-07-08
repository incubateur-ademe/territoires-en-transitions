import { describe, expect, it } from 'vitest';
import {
  CellKey,
  GridCell,
  OpenDataSource,
  generateCellKey,
  toIndicateurId,
  toSourceId,
  toYear,
} from './types';
import { applyOpenDataSelections } from './apply-open-data-selections';

const citepa: OpenDataSource = {
  sourceId: toSourceId('citepa'),
  libelle: 'CITEPA',
  value: 100,
  methodologie: 'Inventaire national',
  dateVersion: '2026-01-01',
};

const year = toYear(2030);
const key = generateCellKey(toIndicateurId(1), year);

const coveredEmpty = (): GridCell => ({
  kind: 'user-data',
  value: null,
  coveringSources: [citepa],
});

describe('applyOpenDataSelections', () => {
  it('convertit une cellule vide couverte en open data avec la source selectionnee', () => {
    const cells = new Map<CellKey, GridCell>([[key, coveredEmpty()]]);

    expect(applyOpenDataSelections(cells, { [key]: toSourceId('citepa') }).get(key)).toEqual({
      kind: 'open-data',
      value: 100,
      selectedSourceId: 'citepa',
      source: {
        sourceId: 'citepa',
        libelle: 'CITEPA',
        methodologie: 'Inventaire national',
        dateVersion: '2026-01-01',
      },
      coveringSources: [citepa],
    });
  });

  it('laisse la cellule inchangee sans selection', () => {
    const cells = new Map<CellKey, GridCell>([[key, coveredEmpty()]]);

    expect(applyOpenDataSelections(cells, {}).get(key)).toEqual(coveredEmpty());
  });

  it('laisse la cellule inchangee quand la source selectionnee ne la couvre pas', () => {
    const cells = new Map<CellKey, GridCell>([[key, coveredEmpty()]]);

    expect(applyOpenDataSelections(cells, { [key]: toSourceId('insee') }).get(key)).toEqual(
      coveredEmpty()
    );
  });

  it('laisse une cellule deja renseignee inchangee', () => {
    const filled: GridCell = {
      kind: 'user-data',
      value: 42,
      coveringSources: [citepa],
    };
    const cells = new Map<CellKey, GridCell>([[key, filled]]);

    expect(applyOpenDataSelections(cells, { [key]: toSourceId('citepa') }).get(key)).toEqual(
      filled
    );
  });
});
