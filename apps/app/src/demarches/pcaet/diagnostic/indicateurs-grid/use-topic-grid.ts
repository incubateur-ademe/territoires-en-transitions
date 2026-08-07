'use client';

import { useCallback, useMemo } from 'react';
import {
  IndicateurValuesGridActions,
  toYear,
  Year,
} from '../../../../indicateurs/valeurs/grid';
import {
  applyRowOrder,
  IndicateurGridShape,
} from '../../../../indicateurs/valeurs/grid/indicateur-grid-shape';
import {
  IndicateurGridData,
  useIndicateurGridData,
} from '../../../../indicateurs/valeurs/grid/use-indicateur-grid-data';
import { useIndicateurGridWriteActions } from '../../../../indicateurs/valeurs/grid/use-indicateur-grid-write-actions';
import type { DemarchePcaetTopicId } from '@/app/demarches/types';
import { usePcaetGridState } from '../use-grid-state';
import { buildTopicYears } from './build-topic-years';

const defaultReferenceYear = (): Year => toYear(new Date().getFullYear());

export type TopicGrid = {
  rows: IndicateurGridData['groups'];
  years: Year[];
  referenceYear: Year;
  unit: IndicateurGridData['unit'];
  cells: IndicateurGridData['cells'];
  isLoading: boolean;
  actions: IndicateurValuesGridActions;
  onReferenceYearChange: (year: Year) => void;
  onAddYear: (year: Year) => void;
  onRemoveYear: (year: Year) => void;
  canRemoveYear: (year: Year) => boolean;
};

export const useTopicGrid = ({
  demarcheId,
  topicId,
  shape: initialShape,
}: {
  demarcheId: number;
  topicId: DemarchePcaetTopicId;
  shape: IndicateurGridShape;
}): TopicGrid => {
  const [gridState, updateGridState] = usePcaetGridState(demarcheId, topicId);
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
    () => buildTopicYears({ referenceYear, extraYears }),
    [referenceYear, extraYears]
  );

  const { groups, cells, unit, isLoading } = useIndicateurGridData({
    shape,
    years,
  });
  const actions = useIndicateurGridWriteActions();

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
    onReferenceYearChange,
    onAddYear,
    onRemoveYear,
    canRemoveYear,
  };
};
