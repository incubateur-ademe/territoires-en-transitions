'use client';

import { useCallback, useMemo } from 'react';
import {
  toYear,
  type CellKey,
  type GridCell,
  type GridInput,
  type IndicateurValuesGridActions,
  type Year,
} from '../../../../indicateurs/valeurs/grid/types';
import type { DemarchePcaetTopic } from '@tet/domain/demarches';
import { useSetDiagnosticYears } from '../data/use-diagnostic';
import { useSourceLabels } from '../data/use-source-labels';
import { toGridCells, toGridInput } from './topic-grid.adapter';

export type TopicGrid = {
  rows: GridInput;
  years: Year[];
  referenceYear: Year | undefined;
  unit: string;
  cells: Map<CellKey, GridCell>;
  actions: IndicateurValuesGridActions;
  onReferenceYearChange?: (year: Year) => void;
  onAddYear?: (year: Year) => void;
  onRemoveYear?: (year: Year) => void;
  canRemoveYear: (year: Year) => boolean;
};

/**
 * La saisie des valeurs depuis le diagnostic n'est pas encore branchée : ces
 * actions ne sont jamais appelées (cellules désactivées, collage inerte), elles
 * satisfont le contrat du composant.
 */
const READONLY_ACTIONS: IndicateurValuesGridActions = {
  saveCellValue: async () => ({ ok: false }),
  saveCellValues: async () => ({ ok: false }),
};

/**
 * Grille d'un topic : structure, années et unité viennent de l'API. Les colonnes
 * se modifient pendant l'élaboration seulement — l'année de comptabilisation se
 * déplace, les années ajoutées s'ajoutent et se retirent.
 */
export const useTopicGrid = ({
  demarcheId,
  topic,
  isReadonly,
}: {
  demarcheId: number;
  topic: DemarchePcaetTopic;
  isReadonly: boolean;
}): TopicGrid => {
  const setYears = useSetDiagnosticYears(demarcheId);
  const getSourceLabel = useSourceLabels();
  const { code, referenceYear, extraYears } = topic;

  const onReferenceYearChange = useCallback(
    (year: Year) =>
      setYears({ topicCode: code, referenceYear: year, extraYears }),
    [setYears, code, extraYears]
  );

  const onAddYear = useCallback(
    (year: Year) =>
      referenceYear === null
        ? undefined
        : setYears({
            topicCode: code,
            referenceYear,
            extraYears: [...extraYears, year],
          }),
    [setYears, code, referenceYear, extraYears]
  );

  const onRemoveYear = useCallback(
    (year: Year) =>
      referenceYear === null
        ? undefined
        : setYears({
            topicCode: code,
            referenceYear,
            extraYears: extraYears.filter((extra) => extra !== year),
          }),
    [setYears, code, referenceYear, extraYears]
  );

  /**
   * Seules les colonnes ajoutées se retirent : les horizons réglementaires et
   * l'année de comptabilisation sont attendus au dépôt.
   */
  const canRemoveYear = useCallback(
    (year: Year) => extraYears.includes(year),
    [extraYears]
  );

  return {
    rows: useMemo(() => toGridInput(topic), [topic]),
    years: useMemo(() => topic.years.map(toYear), [topic.years]),
    referenceYear: referenceYear === null ? undefined : toYear(referenceYear),
    unit: topic.unit ?? '',
    cells: useMemo(
      () => toGridCells(topic, getSourceLabel),
      [topic, getSourceLabel]
    ),
    actions: READONLY_ACTIONS,
    onReferenceYearChange: isReadonly ? undefined : onReferenceYearChange,
    onAddYear: isReadonly ? undefined : onAddYear,
    onRemoveYear: isReadonly ? undefined : onRemoveYear,
    canRemoveYear,
  };
};
