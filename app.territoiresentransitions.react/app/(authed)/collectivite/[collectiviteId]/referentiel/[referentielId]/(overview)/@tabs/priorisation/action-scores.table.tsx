'use client';

import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import {
  TableData,
  useTableData,
} from '@/app/referentiels/AidePriorisation/DEPRECATED_useTableData';
import { percentBoundaries } from '@/app/referentiels/AidePriorisation/FiltrePourcentage';
import { Table } from '@/app/referentiels/AidePriorisation/Table';
import {
  getFilterInfoMessage,
  initialFilters,
  nameToShortNames,
  noFilters,
  PercentFilterValues,
  TFilters,
} from '@/app/referentiels/AidePriorisation/filters';
import { getMaxDepth } from '@/app/referentiels/AidePriorisation/queries';
import { actionNewToDeprecated } from '@/app/referentiels/DEPRECATED_scores.types';
import { NEW_useTable } from '@/app/referentiels/ReferentielTable/useReferentiel';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useSnapshotFlagEnabled } from '@/app/referentiels/use-snapshot';
import { DeleteFiltersButton } from '@/app/ui/lists/filter-badges/delete-filters.button';
import { ReferentielId } from '@/domain/referentiels';
import { ITEM_ALL } from '@/ui';
import { flow } from 'es-toolkit';

function actionMatchingCategorie(categories: string[]) {
  return (action: ReturnType<typeof actionNewToDeprecated>) =>
    action.phase === null ||
    categories.includes(ITEM_ALL) ||
    categories.includes(action.phase);
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

  return (action: ReturnType<typeof actionNewToDeprecated>) => {
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

function useTableWithFilters(referentielId: ReferentielId): TableData {
  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'priorisation',
    initialFilters,
    nameToShortNames
  );

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

  const { table, isLoading } = NEW_useTable({
    referentielId,
  });

  const numberOfFilteredTaskActions = 0;
  const totalNumberOfTaskActions = 0;

  return {
    table: {
      ...table,
      getSubRows: flow(table.getSubRows, (rows) =>
        rows
          .filter(actionMatchingCategorie(filters.phase))
          .filter(actionMatchingRatiosOfScoreProgramme)
          .filter(actionMatchingRatiosOfScoreRealise)
      ),
    },
    filters,
    setFilters,
    filtersCount,
    isLoading,
    count: numberOfFilteredTaskActions,
    total: totalNumberOfTaskActions,
  };
}

export const ActionScoresTable = () => {
  const referentielId = useReferentielId();
  const collectiviteId = useCollectiviteId();

  const FLAG_isSnapshotEnabled = useSnapshotFlagEnabled();
  const NEW_tableData = useTableWithFilters(referentielId);
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
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-6">
          <span>
            {filtersCount} {labelFilters}
          </span>
          {filtersCount > 0 && (
            <DeleteFiltersButton onClick={() => setFilters(noFilters)} />
          )}
        </div>
        {filterInfoMessage && <p className="mb-0">{filterInfoMessage}</p>}
      </div>
      <Table tableData={tableData} />
    </>
  );
};
