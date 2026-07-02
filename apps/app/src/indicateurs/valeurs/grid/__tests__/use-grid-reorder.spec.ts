import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  groupDragId,
  rowDragId,
  useGridReorder,
  yearDragId,
} from '../use-grid-reorder';
import { GridRowGroup, toIndicateurId, toYear } from '../types';

const years = [2030, 2036, 2050].map(toYear);

const groups: GridRowGroup[] = [
  {
    id: 'secteur',
    label: 'Secteur',
    rows: [
      { indicateurId: toIndicateurId(1), label: 'A' },
      { indicateurId: toIndicateurId(2), label: 'B' },
      { indicateurId: toIndicateurId(3), label: 'C' },
    ],
  },
  {
    id: 'transport',
    label: 'Transport',
    rows: [{ indicateurId: toIndicateurId(4), label: 'D' }],
  },
];

const setup = () => renderHook(() => useGridReorder({ years, groups }));

describe('useGridReorder', () => {
  it("part de l'ordre des props", () => {
    const { result } = setup();
    expect(result.current.orderedYears).toEqual([2030, 2036, 2050]);
    expect(result.current.isReordered).toBe(false);
  });

  it('reordonne les colonnes (annees)', () => {
    const { result } = setup();

    act(() =>
      result.current.reorderYears(yearDragId(toYear(2030)), yearDragId(toYear(2050)))
    );

    expect(result.current.orderedYears).toEqual([2036, 2050, 2030]);
    expect(result.current.isReordered).toBe(true);
  });

  it('reordonne les groupes de premier niveau', () => {
    const { result } = setup();

    act(() =>
      result.current.reorderGroups(
        groupDragId('secteur'),
        groupDragId('transport')
      )
    );

    expect(result.current.orderedGroups.map((group) => group.id)).toEqual([
      'transport',
      'secteur',
    ]);
    expect(result.current.isReordered).toBe(true);
  });

  it('reordonne les lignes dans un groupe', () => {
    const { result } = setup();

    act(() =>
      result.current.reorderRows(
        'secteur',
        rowDragId(toIndicateurId(1)),
        rowDragId(toIndicateurId(3))
      )
    );

    expect(
      result.current.orderedGroups[0].rows.map((row) => row.indicateurId)
    ).toEqual([2, 3, 1]);
  });

  it('delegue le reordonnancement des lignes quand onReorderRows est fourni', () => {
    const onReorderRows = vi.fn();
    const { result } = renderHook(() =>
      useGridReorder({ years, groups, onReorderRows })
    );

    act(() =>
      result.current.reorderRows(
        'secteur',
        rowDragId(toIndicateurId(1)),
        rowDragId(toIndicateurId(3))
      )
    );

    expect(onReorderRows).toHaveBeenCalledWith('secteur', 'row-1', 'row-3');
    expect(
      result.current.orderedGroups[0].rows.map((row) => row.indicateurId)
    ).toEqual([1, 2, 3]);
  });

  it("reinitialise l'ordre", () => {
    const { result } = setup();

    act(() =>
      result.current.reorderYears(yearDragId(toYear(2030)), yearDragId(toYear(2050)))
    );
    act(() => result.current.reset());

    expect(result.current.orderedYears).toEqual([2030, 2036, 2050]);
    expect(result.current.isReordered).toBe(false);
  });
});
