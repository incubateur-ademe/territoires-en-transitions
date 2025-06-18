import { CollectiviteNiveauAcces } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { makeCollectivitePlanActionFicheUrl } from '@/app/app/paths';
import { DeleteFiltersButton } from '@/app/ui/lists/filter-badges/delete-filters.button';
import FicheActionCard from '../../FicheAction/Carte/FicheActionCard';
import { TFichesActionsListe } from '../../FicheAction/data/useFichesActionFiltresListe';

type Props = {
  planId: string;
  filters?: TFichesActionsListe;
  collectivite: CollectiviteNiveauAcces;
};

const PlanActionFiltresResultats = ({
  planId,
  filters,
  collectivite,
}: Props) => {
  if (filters === undefined || !collectivite) return null;

  return (
    <>
      <div className="flex items-baseline gap-6 my-8">
        <span className="text-sm text-gray-400">
          {filters.total} résultat{filters.total > 1 && 's'}
        </span>
        <DeleteFiltersButton
          onClick={() => filters.setFilters(filters.initialFilters)}
        />
      </div>
      {filters.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {filters.items.map((fiche) => (
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

export default PlanActionFiltresResultats;
