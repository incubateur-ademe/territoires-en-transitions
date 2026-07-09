'use client';

import { omit } from 'es-toolkit';
import { useCallback, useMemo } from 'react';
import {
  CellKey,
  generateCellKey,
  IndicateurValuesGridActions,
  Result,
  SourceId,
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
import { reorderRows } from './reorder-rows';

const HORIZON_YEARS = [2030, 2036, 2050];

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
  const { openDataSelections, rowOrder } = gridState;
  const referenceYear =
    gridState.referenceYear != null
      ? toYear(gridState.referenceYear)
      : defaultReferenceYear();

  const shape = useMemo(
    () => applyRowOrder(initialShape, rowOrder),
    [initialShape, rowOrder]
  );
  const years = useMemo(
    () => [
      referenceYear,
      ...HORIZON_YEARS.map(toYear).filter((year) => year !== referenceYear),
    ],
    [referenceYear]
  );

  const {
    groups,
    cells,
    identifiantReferentielByIndicateurId,
    unit,
    isLoading,
  } = useIndicateurGridData({ shape, referenceYear, years, openDataSelections });
  const writeActions = useIndicateurGridWriteActions(referenceYear);

  const patchOpenDataSelections = useCallback(
    (
      update: (
        current: Record<CellKey, SourceId>
      ) => Record<CellKey, SourceId>
    ) =>
      updateGridState((previous) => ({
        openDataSelections: update(previous.openDataSelections),
      })),
    [updateGridState]
  );

  const actions = useMemo<IndicateurValuesGridActions>(
    () => ({
      saveCellValue: writeActions.saveCellValue,
      saveCellValues: writeActions.saveCellValues,
      selectOpenData: async ({
        indicateurId,
        year,
        sourceId,
      }): Promise<Result> => {
        const clearedUserValue = await writeActions.clearCell({
          indicateurId,
          year,
        });
        if (!clearedUserValue.ok) {
          return clearedUserValue;
        }
        const persisted = patchOpenDataSelections((current) => ({
          ...current,
          [generateCellKey(indicateurId, year)]: sourceId,
        }));
        return persisted ? { ok: true, value: undefined } : { ok: false };
      },
      clearCell: async ({ indicateurId, year }): Promise<Result> => {
        patchOpenDataSelections((current) =>
          omit(current, [generateCellKey(indicateurId, year)])
        );
        return { ok: true, value: undefined };
      },
    }),
    [writeActions, patchOpenDataSelections]
  );

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
  };
};
