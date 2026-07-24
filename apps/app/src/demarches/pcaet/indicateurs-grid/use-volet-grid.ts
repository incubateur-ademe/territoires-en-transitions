'use client';

import { useCallback, useMemo } from 'react';
import {
  IndicateurValuesGridActions,
  toYear,
  Year,
} from '@/app/indicateurs/valeurs/grid';
import {
  applyRowOrder,
  IndicateurGridShape,
} from '@/app/indicateurs/valeurs/grid/indicateur-grid-shape';
import {
  IndicateurGridData,
  useIndicateurGridData,
} from '@/app/indicateurs/valeurs/grid/use-indicateur-grid-data';
import { useIndicateurGridWriteActions } from '@/app/indicateurs/valeurs/grid/use-indicateur-grid-write-actions';
import type { DemarchePcaetVoletId } from '../demarche-pcaet.types';
import { usePcaetGridState } from '../use-pcaet-grid-state';
import { buildVoletYears } from './build-volet-years';
import { reorderRows } from './reorder-rows';

const defaultReferenceYear = (): Year => toYear(new Date().getFullYear());

type ReorderEvent = { groupId: string; activeId: string; overId: string };

export type VoletGrid = {
  rows: IndicateurGridData['groups'];
  years: Year[];
  referenceYear: Year;
  unit: IndicateurGridData['unit'];
  cells: IndicateurGridData['cells'];
  isLoading: boolean;
  actions: IndicateurValuesGridActions;
  onReorderRows: (event: ReorderEvent) => void;
  onReferenceYearChange: (year: Year) => void;
  onAddYear: (year: Year) => void;
  onRemoveYear: (year: Year) => void;
  canRemoveYear: (year: Year) => boolean;
};

export const useVoletGrid = ({
  demarcheId,
  voletId,
  shape: initialShape,
}: {
  demarcheId: string;
  voletId: DemarchePcaetVoletId;
  shape: IndicateurGridShape;
}): VoletGrid => {
  const [gridState, updateGridState] = usePcaetGridState(demarcheId, voletId);
  const { rowOrder, extraYears } = gridState;
  const referenceYear =
    gridState.referenceYear != null
      ? toYear(gridState.referenceYear)
      : defaultReferenceYear();

  const shape = useMemo(
    () => applyRowOrder(initialShape, rowOrder),
    [initialShape, rowOrder]
  );
  const years = useMemo(
    () => buildVoletYears({ referenceYear, extraYears }),
    [referenceYear, extraYears]
  );

  const {
    groups,
    cells,
    identifiantReferentielByIndicateurId,
    unit,
    isLoading,
  } = useIndicateurGridData({ shape, years });
  const actions = useIndicateurGridWriteActions();

  const onReorderRows = useCallback(
    (event: ReorderEvent) => {
      const nextRowOrder = reorderRows({
        initialShape,
        rowOrder,
        identifiantReferentielByIndicateurId,
        ...event,
      });
      if (nextRowOrder !== null) {
        updateGridState(() => ({ rowOrder: nextRowOrder }));
      }
    },
    [
      initialShape,
      rowOrder,
      identifiantReferentielByIndicateurId,
      updateGridState,
    ]
  );

  const onReferenceYearChange = useCallback(
    (year: Year) => updateGridState(() => ({ referenceYear: year })),
    [updateGridState]
  );

  const onAddYear = useCallback(
    (year: Year) =>
      updateGridState((prev) => ({
        extraYears: [...new Set([...prev.extraYears, year])].sort(
          (a, b) => a - b
        ),
      })),
    [updateGridState]
  );

  const onRemoveYear = useCallback(
    (year: Year) =>
      updateGridState((prev) => ({
        extraYears: prev.extraYears.filter((extraYear) => extraYear !== year),
      })),
    [updateGridState]
  );

  const canRemoveYear = useCallback(
    (year: Year) => year !== referenceYear && extraYears.includes(year),
    [extraYears, referenceYear]
  );

  return {
    rows: groups,
    years,
    referenceYear,
    unit,
    cells,
    isLoading,
    actions,
    onReorderRows,
    onReferenceYearChange,
    onAddYear,
    onRemoveYear,
    canRemoveYear,
  };
};
