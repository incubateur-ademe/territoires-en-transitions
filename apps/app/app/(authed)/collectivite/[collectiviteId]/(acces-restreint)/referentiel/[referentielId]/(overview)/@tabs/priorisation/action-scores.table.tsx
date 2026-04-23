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
import { useTable } from '@/app/referentiels/ReferentielTable/useReferentiel';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import type { ActionDetailed } from '@/app/referentiels/use-snapshot';
import { DeleteFiltersButton } from '@/app/ui/lists/DEPRECATED_filter-badges/delete-filters.button';
import { useSearchParams } from '@/app/utils/[deprecated]use-search-params';
import { ReferentielId } from '@tet/domain/referentiels';
import { divisionOrZero } from '@tet/domain/utils';
import { ITEM_ALL } from '@tet/ui';
import { useMemo } from 'react';

function actionMatchingCategorie(categories: string[]) {
  return (action: ActionDetailed) =>
    action.categorie === null ||
    action.categorie === undefined ||
    categories.includes(ITEM_ALL) ||
    categories.includes(action.categorie);
}

function actionMatchingRatios(
  referentielId: ReferentielId,
  ratios: PercentFilterValues[],
  filterColumnName: 'score_programme' | 'score_realise'
) {
  const boundaries = ratios.map(
    (ratio) => percentBoundaries[ratio as keyof typeof percentBoundaries]
  );

  const maxLevel = getMaxDepth(referentielId);

  return (action: ActionDetailed) => {
    if (action.level < maxLevel) {
      return true;
    }

    const scoreRealise = divisionOrZero(
      action.score?.pointFait ?? 0,
      action.score?.pointPotentiel ?? 0
    );
    const scoreProgramme = divisionOrZero(
      action.score?.pointProgramme ?? 0,
      action.score?.pointPotentiel ?? 0
    );
    const value =
      filterColumnName === 'score_realise' ? scoreRealise : scoreProgramme;

    return boundaries.some(
      (boundary) => value >= boundary.lower && value < boundary.upper
    );
  };
}

function useTableWithFilters(referentielId: ReferentielId) {
  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'priorisation',
    initialFilters,
    nameToShortNames
  );

  const { table, isLoading } = useTable({
    referentielId,
  });

  const hasPhaseFilter = !filters.phase.includes(ITEM_ALL);
  const hasScoreProgrammeFilter = !filters.score_programme.includes(ITEM_ALL);
  const hasScoreRealiseFilter = !filters.score_realise.includes(ITEM_ALL);

  const getSubRows = useMemo(() => {
    // No active filters: keep original behavior with zero overhead
    if (!hasPhaseFilter && !hasScoreProgrammeFilter && !hasScoreRealiseFilter) {
      return table.getSubRows;
    }

    const matchCategorie = hasPhaseFilter
      ? actionMatchingCategorie(filters.phase)
      : () => true;

    const matchProgramme = hasScoreProgrammeFilter
      ? actionMatchingRatios(
          referentielId,
          filters.score_programme,
          'score_programme'
        )
      : () => true;

    const matchRealise = hasScoreRealiseFilter
      ? actionMatchingRatios(
          referentielId,
          filters.score_realise,
          'score_realise'
        )
      : () => true;

    return (row: ActionDetailed) => {
      const children = table.getSubRows(row) ?? [];

      if (!children.length) {
        return children;
      }

      return children.filter(
        (action) =>
          matchCategorie(action) &&
          matchProgramme(action) &&
          matchRealise(action)
      );
    };
  }, [
    table,
    filters.phase,
    filters.score_programme,
    filters.score_realise,
    hasPhaseFilter,
    hasScoreProgrammeFilter,
    hasScoreRealiseFilter,
    referentielId,
  ]);

  const numberOfFilteredTaskActions = 0;
  const totalNumberOfTaskActions = 0;

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
