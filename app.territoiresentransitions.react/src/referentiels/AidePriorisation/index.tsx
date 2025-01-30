'use client';

import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import { DesactiverLesFiltres } from '@/app/ui/shared/filters/DesactiverLesFiltres';
import { ActionCategorie, ReferentielId } from '@/domain/referentiels';
import { ITEM_ALL } from '@/ui';
import { useCallback } from 'react';
import { useReferentielId } from '../referentiel-context';
import {
  ActionDetailed,
  useSnapshot,
  useSnapshotFlagEnabled,
} from '../use-snapshot';
import { TableData, useTableData } from './DEPRECATED_useTableData';
import { percentBoundaries } from './FiltrePourcentage';
import { Table } from './Table';
import {
  getFilterInfoMessage,
  initialFilters,
  nameToShortNames,
  noFilters,
  PercentFilterValues,
  TFilters,
} from './filters';
import { getMaxDepth } from './queries';

function actionToTableRow(action: ActionDetailed) {
  return {
    sourceAction: action,
    nom: action.nom,
    identifiant: action.identifiant,
    action_id: action.actionId,
    phase: action.categorie as ActionCategorie, // Force casting for now but remove it when scores will not be coming from deprecated `client_scores` (and only from snapshot).
    score_realise:
      action.score.pointPotentiel === 0
        ? 0
        : action.score.pointFait / action.score.pointPotentiel,
    score_programme:
      action.score.pointPotentiel === 0
        ? 0
        : action.score.pointProgramme / action.score.pointPotentiel,
    points_restants: action.score.pointPotentiel - action.score.pointFait,
    have_children: action.actionsEnfant.length > 0,
    depth: action.level,
    type: action.actionType,
  };
}

function actionMatchingCategorie(categories: string[]) {
  return (action: ActionDetailed) =>
    action.categorie === null ||
    categories.includes(ITEM_ALL) ||
    categories.includes(action.categorie);
}

function actionMatchingRatios(
  referentielId: ReferentielId,
  ratios: PercentFilterValues[],
  filterColumnName: 'score_programme' | 'score_realise'
) {
  if (ratios.includes(ITEM_ALL)) {
    return () => true;
  }

  const boundaries = ratios.map(
    (ratio) => percentBoundaries[ratio as keyof typeof percentBoundaries]
  );

  const maxLevel = getMaxDepth(referentielId);

  return (action: ReturnType<typeof actionToTableRow>) => {
    // On applique le filtre sur les pourcentages de score uniquement aux sous-taches
    if (action.depth < maxLevel) {
      return true;
    }

    return boundaries.some((boundary) => {
      return (
        action[filterColumnName] >= boundary.lower &&
        action[filterColumnName] < boundary.upper
      );
    });
  };
}

function useTruc(referentielId: ReferentielId): TableData {
  const { data: snapshot, isPending } = useSnapshot({
    actionId: referentielId,
  });

  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'priorisation',
    initialFilters,
    nameToShortNames
  );

  // Uniquement les actions de niveau 1 (axes)
  const axesOnly = snapshot?.scores.actionsEnfant.map(actionToTableRow);

  const actionMatchingRatiosOfScoreProgramme = actionMatchingRatios(
    referentielId,
    filters.score_programme,
    'score_programme'
  );

  const actionMatchingRatiosOfScoreRealise = actionMatchingRatios(
    referentielId,
    filters.score_realise,
    'score_realise'
  );

  const maxLevel = getMaxDepth(referentielId);

  // Renvoie les sous-lignes d'une ligne, donc les enfants d'une action
  // mais seulement jusqu'au niveau 3
  const getSubRows = (row: any) => {
    const action = (row as ReturnType<typeof actionToTableRow>).sourceAction;

    // On s'arrête aux sous-actions (on ne descend pas aux taches)
    if (action.level > maxLevel - 1) {
      return [];
    }

    return action.actionsEnfant
      .filter(actionMatchingCategorie(filters.phase))
      .map(actionToTableRow)
      .filter(actionMatchingRatiosOfScoreProgramme)
      .filter(actionMatchingRatiosOfScoreRealise);
  };

  const table = {
    data: axesOnly ?? [],

    getRowId: useCallback((row: any) => row.identifiant, []),
    getSubRows,

    autoResetExpanded: false,
    // stateReducer,
  };

  const numberOfFilteredTaskActions = 0;
  const totalNumberOfTaskActions = 0;

  return {
    table,
    filters,
    setFilters,
    filtersCount,
    isLoading: isPending,
    count: numberOfFilteredTaskActions,
    total: totalNumberOfTaskActions,
  };
}

export const AidePriorisation = () => {
  const referentielId = useReferentielId();
  const collectiviteId = useCollectiviteId();

  const FLAG_isSnapshotEnabled = useSnapshotFlagEnabled();
  const NEW_tableData = useTruc(referentielId);
  const DEPRECATED_tableData = useTableData({ collectiviteId, referentielId });
  const tableData = FLAG_isSnapshotEnabled
    ? NEW_tableData
    : DEPRECATED_tableData;

  const { setFilters, filtersCount } = tableData;
  const labelFilters = filtersCount > 1 ? 'filtres actifs' : 'filtre actif';
  const filterInfoMessage = getFilterInfoMessage(
    filtersCount,
    getMaxDepth(referentielId)
  );

  return (
    <>
      <div className="mb-6">
        {filtersCount} {labelFilters}
        {filtersCount > 0 && (
          <DesactiverLesFiltres
            className="ml-5"
            onClick={() => setFilters(noFilters)}
          />
        )}
        {filterInfoMessage ? (
          <>
            <br />
            {filterInfoMessage}
          </>
        ) : null}
      </div>
      <Table tableData={tableData} />
    </>
  );
};
