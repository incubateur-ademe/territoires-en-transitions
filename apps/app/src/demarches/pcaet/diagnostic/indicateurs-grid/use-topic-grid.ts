'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  toYear,
  type CellKey,
  type GridCell,
  type GridInput,
  type IndicateurValuesGridActions,
  type Year,
} from '../../../../indicateurs/valeurs/grid/types';
import type { DemarchePcaetTopic } from '@tet/domain/demarches';
import { appLabels } from '@/app/labels/catalog';
import {
  useSetDiagnosticYears,
  type SetDiagnosticYears,
} from '../data/use-diagnostic';
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
  /**
   * Une écriture par message de confirmation : le toast global lit `meta`, figé
   * à la création de la mutation, donc l'ajout et le retrait ne peuvent pas
   * partager la même instance.
   */
  const { setYears: saveReferenceYear, isPending: isSavingReferenceYear } =
    useSetDiagnosticYears(
      demarcheId,
      appLabels.demarcheDiagnosticAnneesEnregistrees
    );
  const { setYears: saveAfterAdd, isPending: isAddingYear } =
    useSetDiagnosticYears(demarcheId, appLabels.indicateurAnneeAjoutee);
  const { setYears: saveAfterRemove, isPending: isRemovingYear } =
    useSetDiagnosticYears(demarcheId, appLabels.indicateurAnneeSupprimee);

  const isPending = isSavingReferenceYear || isAddingYear || isRemovingYear;
  const getSourceLabel = useSourceLabels();
  const { code, referenceYear, extraYears } = topic;

  /**
   * Le service reçoit la liste complète des années ajoutées, il ne peut donc
   * pas fusionner deux écritures. Tant qu'une réponse se fait attendre, on
   * compose sur la dernière liste envoyée plutôt que sur celle du topic, en
   * retard d'un tour : sinon deux actions rapprochées s'écraseraient l'une
   * l'autre. Dès que le serveur a répondu — ou a échoué — il refait foi.
   */
  const lastSentExtraYears = useRef(extraYears);
  useEffect(() => {
    if (!isPending) {
      lastSentExtraYears.current = extraYears;
    }
  }, [isPending, extraYears]);

  const saveExtraYears = useCallback(
    (save: SetDiagnosticYears, nextExtraYears: number[]) => {
      if (referenceYear === null) {
        return;
      }
      lastSentExtraYears.current = nextExtraYears;
      save({ topicCode: code, referenceYear, extraYears: nextExtraYears });
    },
    [code, referenceYear]
  );

  const onReferenceYearChange = useCallback(
    (year: Year) =>
      saveReferenceYear({
        topicCode: code,
        referenceYear: year,
        extraYears: lastSentExtraYears.current,
      }),
    [saveReferenceYear, code]
  );

  const onAddYear = useCallback(
    (year: Year) =>
      saveExtraYears(saveAfterAdd, [...lastSentExtraYears.current, year]),
    [saveExtraYears, saveAfterAdd]
  );

  const onRemoveYear = useCallback(
    (year: Year) =>
      saveExtraYears(
        saveAfterRemove,
        lastSentExtraYears.current.filter((extra) => extra !== year)
      ),
    [saveExtraYears, saveAfterRemove]
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
