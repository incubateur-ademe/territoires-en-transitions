import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import FicheActionCard from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import { makeCollectivitePlanActionFicheUrl } from '@/app/app/paths';
import { Filters } from '@/app/plans/plans/detailed-plan-action-view/data/useFichesActionFiltresListe/types';
import { DeleteFiltersButton } from '@/app/ui/lists/filter-badges/delete-filters.button';
import { FicheResume } from '@/domain/plans/fiches';
import { Icon } from '@/ui/design-system/Icon';
import { Spacer } from '@/ui/design-system/Spacer';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';

const Chip = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center rounded-md border border-primary-3 text-primary-7 gap-1 font-bold  px-3">
      <span className="text-nowrap">{children}</span>
      <Icon icon="close-circle-fill" size="sm" />
    </div>
  );
};

export const FilterByCategory = ({
  title,
  selectedFilters,
  onDeleteFilter,
  onDeleteCategory,
}: {
  title: string;
  selectedFilters: string[];
  onDeleteFilter: (value: string) => void;
  onDeleteCategory: () => void;
}) => {
  return (
    <div className="inline-flex items-center rounded-md border border-primary-3 w-auto text-sm">
      <div className="h-full flex items-center bg-primary-1 p-2 px-3 border-r-1 border-r-primary-3">
        <span className=" align-middle text-primary-7 font-bold">{title}</span>
      </div>
      <div className="flex items-center flex-wrap gap-1 p-1">
        {selectedFilters
          .sort((a, b) => a.localeCompare(b))
          .map((filter) => (
            <button key={filter} onClick={() => onDeleteFilter(filter)}>
              <Chip>{filter}</Chip>
            </button>
          ))}
      </div>
      <button onClick={onDeleteCategory} className="pr-1 flex items-center">
        <Icon icon="close-circle-fill" size="lg" className="text-primary-7" />
      </button>
    </div>
  );
};

const FilteredResultsSummary = ({
  count,
  resetFilters,
}: {
  count: number;
  resetFilters: () => void;
}) => {
  return (
    <div className="flex items-baseline gap-6">
      <span className="text-sm text-gray-400">
        {count} résultat{count > 1 && 's'}
      </span>
      <DeleteFiltersButton onClick={() => resetFilters()} />
    </div>
  );
};

const FilteredResultsEmpty = () => {
  return (
    <div className="mt-16 mb-8">
      Aucune fiche ne correspond à votre recherche
    </div>
  );
};

const FilteredResultsList = <T extends Record<string, any>>({
  planId,
  collectivite,
  filteredResults,
}: Props<T> & { filteredResults: FicheResume[] }) => {
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

type Props<T extends Record<string, any>> = {
  planId: string;
  collectivite: CurrentCollectivite;
  filteredResults: FicheResume[];
  resetFilters: () => void;
  filters: T;
  onDeleteFilterValue: (key: keyof T, valueToDelete: string) => void;
  onDeleteFilterCategory: (key: keyof T) => void;
  getFilterValuesLabels: (values: string[]) => string[];
};

export const FilteredResults = <T extends Record<string, any>>({
  planId,
  collectivite,
  filteredResults,
  resetFilters,
  filters,
  onDeleteFilterValue,
  onDeleteFilterCategory,
  getFilterValuesLabels,
}: Props<T>) => {
  const hasFilteredContent = filteredResults.length > 0;
  return (
    <>
      <FilteredResultsSummary
        count={filteredResults.length}
        resetFilters={resetFilters}
      />
      <Spacer height={0.5} />
      <div className="flex gap-2 flex-wrap">
        {Object.entries(filters)
          .filter(
            ([_, value]) => Array.isArray(value) === true && value.length > 0
          )
          .map(([key, value]) => {
            const currentKey: keyof Filters = key as keyof Filters;
            const filterValueLabels = getFilterValuesLabels(value as string[]);

            return (
              <FilterByCategory
                key={key}
                title={key}
                selectedFilters={filterValueLabels}
                onDeleteFilter={(valueToDelete) => {
                  onDeleteFilterValue(currentKey, valueToDelete);
                }}
                onDeleteCategory={() => onDeleteFilterCategory(currentKey)}
              />
            );
          })}
      </div>
      <Spacer height={2} />
      <VisibleWhen condition={hasFilteredContent}>
        <FilteredResultsList
          planId={planId}
          collectivite={collectivite}
          filteredResults={filteredResults}
          resetFilters={resetFilters}
          filters={filters}
          onDeleteFilterValue={onDeleteFilterValue}
          onDeleteFilterCategory={onDeleteFilterCategory}
          getFilterValuesLabels={getFilterValuesLabels}
        />
      </VisibleWhen>
      <VisibleWhen condition={hasFilteredContent === false}>
        <FilteredResultsEmpty />
      </VisibleWhen>
    </>
  );
};
