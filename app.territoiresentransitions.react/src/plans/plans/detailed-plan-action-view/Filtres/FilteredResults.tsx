import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import FicheActionCard from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import { makeCollectivitePlanActionFicheUrl } from '@/app/app/paths';
import { FicheResume } from '@/domain/plans/fiches';
import { FilterCategory, FilterChips } from '@/ui/design-system/FilterChips';
import { Spacer } from '@/ui/design-system/Spacer';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import {
  filterLabels,
  Filters,
} from '../data/useFichesActionFiltresListe/types';

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
  planId: string;
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
            planActionUid: planId,
            ficheUid: fiche.id.toString(),
          })}
          currentCollectivite={collectivite}
        />
      ))}
    </div>
  );
};

type CurrentFilters = Omit<Filters, 'collectivite_id' | 'axes'>;
type CurrentFiltersKeys = keyof CurrentFilters;
type Props = {
  planId: string;
  collectivite: CurrentCollectivite;
  filteredResults: FicheResume[];
  resetFilters: () => void;
  filters: CurrentFilters;
  onDeleteFilterValue: (key: CurrentFiltersKeys, valueToDelete: string) => void;
  onDeleteFilterCategory: (key: CurrentFiltersKeys) => void;
  getFilterValuesLabels: (values: string[]) => string[];
};

export const FilteredResults = ({
  planId,
  collectivite,
  filteredResults,
  resetFilters,
  filters,
  onDeleteFilterValue,
  onDeleteFilterCategory,
  getFilterValuesLabels,
}: Props) => {
  const hasFilteredContent = filteredResults.length > 0;

  const filterCategories: FilterCategory<CurrentFiltersKeys>[] = Object.entries(
    filters
  )
    .filter(([_, value]) => Array.isArray(value) === true && value.length > 0)
    .map(([key, value]) => {
      const currentKey: keyof Filters = key as keyof Filters;
      const filterValueLabels = getFilterValuesLabels(value as string[]);

      return {
        key: key as CurrentFiltersKeys,
        title: filterLabels[currentKey],
        selectedFilters: filterValueLabels,
      };
    });

  return (
    <>
      <FilteredResultsSummary count={filteredResults.length} />
      <Spacer height={0.5} />
      <FilterChips<CurrentFiltersKeys>
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
