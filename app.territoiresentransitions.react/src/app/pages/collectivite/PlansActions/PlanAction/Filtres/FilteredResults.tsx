import { CollectiviteNiveauAcces } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { usePlanActionFilters } from '@/app/app/pages/collectivite/PlansActions/PlanAction/Filtres/context/PlanActionFiltersContext';
import { makeCollectivitePlanActionFicheUrl } from '@/app/app/paths';
import { DeleteFiltersButton } from '@/app/ui/lists/filter-badges/delete-filters.button';
import FicheActionCard from '../../FicheAction/Carte/FicheActionCard';
import { TFichesActionsListe } from '../../FicheAction/data/useFichesActionFiltresListe';

type Props = {
  planId: string;
  filters?: TFichesActionsListe;
  collectivite: CollectiviteNiveauAcces;
};

const FilteredResults = ({ planId, collectivite }: Props) => {
  const { filteredResults,  resetFilters } =
    usePlanActionFilters();
  return (
    <>
      <div className="flex items-baseline gap-6 my-8">
        <span className="text-sm text-gray-400">
          {filteredResults.length} résultat{filteredResults.length > 1 && 's'}
        </span>
        <DeleteFiltersButton onClick={() => resetFilters()} />
      </div>
      {filteredResults.length > 0 ? (
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
      ) : (
        <div className="mt-16 mb-8">
          Aucune fiche ne correspond à votre recherche
        </div>
      )}
    </>
  );
};

export default FilteredResults;
