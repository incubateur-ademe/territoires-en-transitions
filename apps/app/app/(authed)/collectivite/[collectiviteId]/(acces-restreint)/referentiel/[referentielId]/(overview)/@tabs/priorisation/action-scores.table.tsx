'use client';

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
import { useTable } from '@/app/referentiels/DEPRECATED_ReferentielTable/useReferentiel';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { DeleteFiltersButton } from '@/app/ui/lists/DEPRECATED_filter-badges/delete-filters.button';
import { useSearchParams } from '@/app/utils/[deprecated]use-search-params';
import { ReferentielId } from '@tet/domain/referentiels';
import { divisionOrZero } from '@tet/domain/utils';
import { ITEM_ALL } from '@tet/ui';
import { flow } from 'es-toolkit';
import { useMemo } from 'react';

function actionMatchingCategorie(categories: string[]) {
  return (action: ActionListItem) =>
    action.categorie === null ||
    categories.includes(ITEM_ALL) ||
    categories.includes(action.categorie);
}

function actionMatchingRatios(
  referentielId: ReferentielId,
  ratios: PercentFilterValues[],
  filterColumnName: 'scoreProgramme' | 'scoreRealise'
) {
  if (ratios.includes(ITEM_ALL)) {
    return () => true;
  }

  const boundaries = ratios.map(
    (ratio) => percentBoundaries[ratio as keyof typeof percentBoundaries]
  );

  const maxLevel = getMaxDepth(referentielId);

  return (action: ActionListItem) => {
    // On applique le filtre sur les pourcentages de score uniquement aux sous-taches
    if (action.depth < maxLevel) {
      return true;
    }

    const scoreInPercentage =
      filterColumnName === 'scoreProgramme'
        ? divisionOrZero(
            action.score.pointProgramme,
            action.score.pointPotentiel
          )
        : divisionOrZero(action.score.pointFait, action.score.pointPotentiel);

    return boundaries.some((boundary) => {
      return (
        scoreInPercentage >= boundary.lower &&
        scoreInPercentage < boundary.upper
      );
    });
  };
}

function useTableWithFilters(referentielId: ReferentielId) {
  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'priorisation',
    initialFilters,
    nameToShortNames
  );

  const actionMatchingRatiosOfScoreProgramme = useMemo(
    () =>
      actionMatchingRatios(
        referentielId,
        filters.score_programme,
        'scoreProgramme'
      ),
    [referentielId, filters.score_programme]
  );

  const actionMatchingRatiosOfScoreRealise = useMemo(
    () =>
      actionMatchingRatios(
        referentielId,
        filters.score_realise,
        'scoreRealise'
      ),
    [referentielId, filters.score_realise]
  );

  const { table, isLoading } = useTable({
    referentielId,
  });

  const numberOfFilteredTaskActions = 0;
  const totalNumberOfTaskActions = 0;

  const getSubRows = useMemo(
    () =>
      flow(table.getSubRows, (rows) =>
        rows
          .filter(actionMatchingCategorie(filters.phase))
          .filter(actionMatchingRatiosOfScoreProgramme)
          .filter(actionMatchingRatiosOfScoreRealise)
      ),
    [
      table.getSubRows,
      filters.phase,
      actionMatchingRatiosOfScoreProgramme,
      actionMatchingRatiosOfScoreRealise,
    ]
  );

  return {
    table: {
      ...table,
      getSubRows,
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

  const tableData = useTableWithFilters(referentielId);

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
