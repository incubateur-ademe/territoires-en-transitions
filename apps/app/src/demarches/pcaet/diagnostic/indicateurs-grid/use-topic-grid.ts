'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  generateCellKey,
  toIndicateurId,
  toYear,
  type CellKey,
  type CellValueInput,
  type GridCell,
  type GridInput,
  type IndicateurValuesGridActions,
  type Year,
} from '../../../../indicateurs/valeurs/grid/types';
import type { DemarchePcaetTopic } from '@tet/domain/demarches';
import { useUpdateDiagnosticIndicateursValeurs } from '../data/use-diagnostic';
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

const READONLY_ACTIONS: IndicateurValuesGridActions = {
  saveCellValue: async () => ({ ok: false }),
  saveCellValues: async () => ({ ok: false }),
};

/**
 * Grille d'un topic : structure et années serveur viennent de l'API. Les années
 * ajoutées / retirées / année de comptabilisation locale ne sont pas persistées
 * tant qu'aucune valeur n'est saisie ; elles fusionnent avec `topic.years`.
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
  const { updateValeurs: updateDiagnosticValeurs } =
    useUpdateDiagnosticIndicateursValeurs(demarcheId);

  const getSourceLabel = useSourceLabels();
  const { referenceYear: serverReferenceYear, horizons, years: serverYears } =
    topic;

  const [localReferenceYear, setLocalReferenceYear] = useState<number | null>(
    null
  );
  const [localExtraYears, setLocalExtraYears] = useState<number[]>([]);

  const referenceYear = localReferenceYear ?? serverReferenceYear;

  const years = useMemo(() => {
    const merged = new Set([
      ...serverYears,
      ...localExtraYears,
      ...(referenceYear === null ? [] : [referenceYear]),
    ]);
    return [...merged].sort((a, b) => a - b).map(toYear);
  }, [serverYears, localExtraYears, referenceYear]);

  const removableYears = useMemo(() => {
    const locked = new Set([
      ...(referenceYear === null ? [] : [referenceYear]),
      ...horizons,
    ]);
    return new Set(
      [...localExtraYears, ...topic.extraYears].filter(
        (year) => !locked.has(year)
      )
    );
  }, [localExtraYears, topic.extraYears, referenceYear, horizons]);

  const onReferenceYearChange = useCallback((year: Year) => {
    setLocalReferenceYear(year);
    setLocalExtraYears((prev) => prev.filter((extra) => extra !== year));
  }, []);

  const onAddYear = useCallback((year: Year) => {
    setLocalExtraYears((prev) =>
      prev.includes(year) ? prev : [...prev, year].sort((a, b) => a - b)
    );
  }, []);

  const onRemoveYear = useCallback((year: Year) => {
    setLocalExtraYears((prev) => prev.filter((extra) => extra !== year));
  }, []);

  const canRemoveYear = useCallback(
    (year: Year) => removableYears.has(year),
    [removableYears]
  );

  const actions = useMemo<IndicateurValuesGridActions>(() => {
    if (isReadonly) {
      return READONLY_ACTIONS;
    }

    return {
      saveCellValue: async (input: CellValueInput) => {
        try {
          await updateDiagnosticValeurs({ valeurs: [input] });
          return { ok: true, value: undefined };
        } catch {
          return { ok: false };
        }
      },
      saveCellValues: async (inputs: CellValueInput[]) => {
        try {
          await updateDiagnosticValeurs({ valeurs: inputs });
          return {
            ok: true,
            value: { written: inputs.length, failed: [] },
          };
        } catch {
          return { ok: false };
        }
      },
    };
  }, [isReadonly, updateDiagnosticValeurs]);

  const cells = useMemo(() => {
    const map = toGridCells(topic, getSourceLabel);
    const indicateurIds = topic.rows.flatMap((row) => [
      ...(row.indicateurId === null ? [] : [row.indicateurId]),
      ...row.rows.flatMap((child) =>
        child.indicateurId === null ? [] : [child.indicateurId]
      ),
    ]);
    for (const year of years) {
      for (const indicateurId of indicateurIds) {
        const key = generateCellKey(toIndicateurId(indicateurId), year);
        if (!map.has(key)) {
          map.set(key, {
            resultat: null,
            objectif: null,
            references: [],
          });
        }
      }
    }
    return map;
  }, [topic, getSourceLabel, years]);

  return {
    rows: useMemo(() => toGridInput(topic), [topic]),
    years,
    referenceYear: referenceYear === null ? undefined : toYear(referenceYear),
    unit: topic.unit ?? '',
    cells,
    actions,
    onReferenceYearChange: isReadonly ? undefined : onReferenceYearChange,
    onAddYear: isReadonly ? undefined : onAddYear,
    onRemoveYear: isReadonly ? undefined : onRemoveYear,
    canRemoveYear,
  };
};
