import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import FicheActionCard from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import { makeCollectivitePlanActionFicheUrl } from '@/app/app/paths';
import {
  CurrentFiltersKeys,
  usePlanFilters,
} from '@/app/plans/plans/show-plan/filters/plan-filters.context';
import { FicheResume } from '@/domain/plans/fiches';
import { Spacer } from '@/ui';
import { FilterBadges, FilterCategory } from '@/ui/design-system/FilterBadges';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';

const FilteredResultsSummary = ({ count }: { count: number }) => {
  return (
    <span className="text-sm text-gray-400">
      {count} résultat{count > 1 && 's'}
    </span>
  );
};

const FilteredResultsEmpty = () => {
  return (
    <div className="mt-16 mb-8">
      Aucune fiche ne correspond à votre recherche
    </div>
  );
};

const FilteredResultsList = ({
  planId,
  collectivite,
  filteredResults,
}: {
  planId: number;
  collectivite: CurrentCollectivite;
  filteredResults: FicheResume[];
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {filteredResults.map((fiche) => (
        <FicheActionCard
          key={fiche.id}
          ficheAction={fiche}
          link={makeCollectivitePlanActionFicheUrl({
            collectiviteId: collectivite.collectiviteId,
            planActionUid: planId.toString(),
            ficheUid: fiche.id.toString(),
          })}
          currentCollectivite={collectivite}
        />
      ))}
    </div>
  );
};

type Props = {
  planId: number;
  collectivite: CurrentCollectivite;
};

export const FilteredResults = ({ planId, collectivite }: Props) => {
  const {
    filters,
    getFilterValuesLabels,
    getFilterLabel,
    resetFilters,
    onDeleteFilterValue,
    onDeleteFilterCategory,
    filteredResults,
  } = usePlanFilters();

  const filtersToDisplay = {
    referents: filters.referents,
    statuts: filters.statuts,
    priorites: filters.priorites,
    pilotes: filters.pilotes,
  };
  const hasFilteredContent = filteredResults.length > 0;

  const filterCategories: FilterCategory<CurrentFiltersKeys>[] = Object.entries(
    filtersToDisplay
  )
    .filter(([_, value]) => Array.isArray(value) === true && value.length > 0)
    .map(([key, value]) => {
      const currentKey: CurrentFiltersKeys = key as CurrentFiltersKeys;
      const filterValueLabels = getFilterValuesLabels(
        currentKey,
        value as string[]
      );

      return {
        key: key as CurrentFiltersKeys,
        title: getFilterLabel(currentKey),
        selectedFilters: filterValueLabels,
      };
    });

  return (
    <>
      <FilteredResultsSummary count={filteredResults.length} />
      <Spacer height={0.5} />
      <FilterBadges<CurrentFiltersKeys>
        filterCategories={filterCategories}
        onDeleteFilterValue={onDeleteFilterValue}
        onDeleteFilterCategory={onDeleteFilterCategory}
        onClearAllFilters={resetFilters}
      />
      <Spacer height={2} />
      <VisibleWhen condition={hasFilteredContent}>
        <FilteredResultsList
          planId={planId}
          collectivite={collectivite}
          filteredResults={filteredResults}
        />
      </VisibleWhen>
      <VisibleWhen condition={hasFilteredContent === false}>
        <FilteredResultsEmpty />
      </VisibleWhen>
    </>
  );
};
