import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import FicheActionCard from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import { makeCollectivitePlanActionFicheUrl } from '@/app/app/paths';
import {
  filterLabels,
  Filters,
} from '@/app/plans/plans/detailed-plan-action-view/data/useFichesActionFiltresListe/types';
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

const DeleteFiltersButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="h-full flex items-center justify-center gap-1 rounded-md  border-grey-8 border-solid border px-2 py-1"
    >
      <span className="text-grey-8 font-bold text-xs">
        Supprimer tous les filtres
      </span>
      <Icon icon="delete-bin-6-line" className="text-grey-8" size="sm" />
    </button>
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
    <div className="inline-flex items-center rounded-md border border-primary-3 w-auto">
      <div className="h-full flex items-center bg-primary-1 p-2 px-3 border-r-1 border-r-primary-3">
        <span className=" align-middle text-primary-7 font-bold text-sm">
          {title}
        </span>
      </div>
      <div className="flex items-center flex-wrap gap-1 p-1">
        {selectedFilters
          .sort((a, b) => a.localeCompare(b))
          .map((filter) => (
            <button
              key={filter}
              onClick={() => onDeleteFilter(filter)}
              className="text-sm"
            >
              <Chip>{filter}</Chip>
            </button>
          ))}
      </div>
      <button onClick={onDeleteCategory} className="pr-1 flex items-center">
        <Icon icon="close-circle-fill" className="text-primary-7" />
      </button>
    </div>
  );
};

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
      <FilteredResultsSummary count={filteredResults.length} />
      <Spacer height={0.5} />
      <div className="flex gap-2 items-center flex-wrap">
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
                title={filterLabels[currentKey]}
                selectedFilters={filterValueLabels}
                onDeleteFilter={(valueToDelete) => {
                  onDeleteFilterValue(currentKey, valueToDelete);
                }}
                onDeleteCategory={() => onDeleteFilterCategory(currentKey)}
              />
            );
          })}
        <DeleteFiltersButton onClick={resetFilters} />
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
