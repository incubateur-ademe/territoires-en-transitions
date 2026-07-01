import { describe, expect, it } from 'vitest';
import { countOpenDataProposals, isCovered } from '../open-data-coverage';
import { GridCell } from '../types';

const covering = {
  sourceId: 'citepa',
  libelle: 'CITEPA',
  value: 10,
  methodologie: null,
  dateVersion: '2026-01-01',
};

describe('isCovered', () => {
  it('est vrai seulement si une cellule user-data a une source couvrante', () => {
    expect(isCovered({ kind: 'user-data', value: null, coveringSources: [covering] })).toBe(true);
    expect(isCovered({ kind: 'user-data', value: null, coveringSources: [] })).toBe(false);
    expect(
      isCovered({
        kind: 'open-data',
        value: 5,
        adoptedSourceId: 'citepa',
        source: { sourceId: 'citepa', libelle: 'CITEPA', methodologie: null, dateVersion: '2026-01-01' },
      })
    ).toBe(false);
    expect(isCovered(null)).toBe(false);
  });
});

describe('countOpenDataProposals', () => {
  it('compte les cellules vides couvertes par au moins une source', () => {
    const cells: GridCell[] = [
      { kind: 'user-data', value: null, coveringSources: [covering] },
      { kind: 'user-data', value: 3, valueId: 30, coveringSources: [covering] },
      { kind: 'user-data', value: null, coveringSources: [] },
    ];
    expect(countOpenDataProposals(cells)).toBe(1);
  });
});
