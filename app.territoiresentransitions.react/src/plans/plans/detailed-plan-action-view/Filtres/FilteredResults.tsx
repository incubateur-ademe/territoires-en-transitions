import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import FicheActionCard from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import { makeCollectivitePlanActionFicheUrl } from '@/app/app/paths';
import { TFichesActionsListe } from '@/app/plans/plans/detailed-plan-action-view/data/useFichesActionFiltresListe';
import { DeleteFiltersButton } from '@/app/ui/lists/filter-badges/delete-filters.button';
import { FicheResume } from '@/domain/plans/fiches';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { usePlanActionFilters } from './context/PlanActionFiltersContext';

const FilteredResultsSummary = ({
  count,
  resetFilters,
}: {
  count: number;
  resetFilters: () => void;
}) => {
  return (
    <div className="flex items-baseline gap-6 my-8">
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

const FilteredResultsList = ({
  planId,
  collectivite,
  filteredResults,
}: Props & { filteredResults: FicheResume[] }) => {
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

type Props = {
  planId: string;
  filters?: TFichesActionsListe;
  collectivite: CurrentCollectivite;
};

export const FilteredResults = ({ planId, collectivite }: Props) => {
  const { filteredResults, resetFilters } = usePlanActionFilters();
  const hasFilteredContent = filteredResults.length > 0;
  return (
    <>
      <FilteredResultsSummary
        count={filteredResults.length}
        resetFilters={resetFilters}
      />
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
