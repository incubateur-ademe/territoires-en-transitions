import { describe, expect, it, vi } from 'vitest';
import { buildColumnSelection } from './build-column-selection';
import {
  generateCellKey,
  CellKey,
  GridCell,
  GridRowGroup,
  OpenDataSource,
  toIndicateurId,
  toYear,
} from '../types';

const citepa: OpenDataSource = {
  sourceId: 'citepa',
  libelle: 'CITEPA',
  value: 100,
  methodologie: null,
  dateVersion: '2026-01-01',
};

const insee: OpenDataSource = {
  sourceId: 'insee',
  libelle: 'INSEE',
  value: 200,
  methodologie: null,
  dateVersion: '2024-01-01',
};

const year = toYear(2030);

const coveredEmpty = (): GridCell => ({
  kind: 'user-data',
  value: null,
  coveringSources: [citepa],
});

const coveredByBoth = (): GridCell => ({
  kind: 'user-data',
  value: null,
  coveringSources: [citepa, insee],
});

const filled = (): GridCell => ({
  kind: 'user-data',
  value: 5,
  valueId: 1,
  coveringSources: [],
});

const group: GridRowGroup = {
  id: 'secteur',
  label: 'Résidentiel',
  rows: [1, 2, 3, 4].map((id) => ({
    indicateurId: toIndicateurId(id),
    label: `p${id}`,
  })),
};

const cellsWith = (
  entries: [number, GridCell][]
): Map<CellKey, GridCell> =>
  new Map(
    entries.map(([id, cell]) => [generateCellKey(toIndicateurId(id), year), cell])
  );

describe('buildColumnSelection', () => {
  it('compte les cellules vides couvertes par la même source dans le secteur × année', () => {
    const selection = buildColumnSelection({
      cell: coveredEmpty(),
      group,
      year,
      cells: cellsWith([
        [1, coveredEmpty()],
        [2, coveredEmpty()],
        [3, coveredEmpty()],
        [4, filled()],
      ]),
      selectOpenData: vi.fn(),
    });
    expect(selection?.count).toBe(3);
  });

  it('sélectionne la source pour chaque cellule vide couverte', async () => {
    const selectOpenData = vi.fn().mockResolvedValue({ ok: true, value: undefined });
    const selection = buildColumnSelection({
      cell: coveredEmpty(),
      group,
      year,
      cells: cellsWith([
        [1, coveredEmpty()],
        [2, coveredEmpty()],
        [3, coveredEmpty()],
      ]),
      selectOpenData,
    });

    await selection?.onSelect();

    expect(selectOpenData).toHaveBeenCalledTimes(3);
    expect(selectOpenData).toHaveBeenCalledWith({
      indicateurId: 2,
      year: 2030,
      sourceId: 'citepa',
    });
  });

  it('remonte false quand une sélection de la colonne échoue', async () => {
    const selectOpenData = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, value: undefined })
      .mockResolvedValueOnce({ ok: false, error: 'boom' });
    const selection = buildColumnSelection({
      cell: coveredEmpty(),
      group,
      year,
      cells: cellsWith([
        [1, coveredEmpty()],
        [2, coveredEmpty()],
      ]),
      selectOpenData,
    });

    expect(await selection?.onSelect()).toBe(false);
  });

  it('propose le lot depuis une cellule open data, via sa source sélectionnée', () => {
    const openDataCell: GridCell = {
      kind: 'open-data',
      value: 358,
      selectedSourceId: 'insee',
      source: {
        sourceId: 'insee',
        libelle: 'INSEE',
        methodologie: null,
        dateVersion: '2024-01-01',
      },
      coveringSources: [citepa, insee],
    };
    const selection = buildColumnSelection({
      cell: openDataCell,
      group,
      year,
      cells: cellsWith([
        [1, coveredByBoth()],
        [2, coveredByBoth()],
      ]),
      selectOpenData: vi.fn(),
    });
    expect(selection).toEqual(
      expect.objectContaining({
        count: 2,
        source: expect.objectContaining({ libelle: 'INSEE' }),
      })
    );
  });

  it("rend undefined quand une seule cellule vide est couverte", () => {
    const selection = buildColumnSelection({
      cell: coveredEmpty(),
      group,
      year,
      cells: cellsWith([
        [1, coveredEmpty()],
        [2, filled()],
      ]),
      selectOpenData: vi.fn(),
    });
    expect(selection).toBeUndefined();
  });

  it('rend undefined quand la cellule courante est déjà renseignée', () => {
    const selection = buildColumnSelection({
      cell: filled(),
      group,
      year,
      cells: cellsWith([
        [1, coveredEmpty()],
        [2, coveredEmpty()],
      ]),
      selectOpenData: vi.fn(),
    });
    expect(selection).toBeUndefined();
  });
});
