import { useCollectiviteId } from '@/api/collectivites';
import { useListFilteredFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';

/** @deprecated TODO: Supprimer ce hook et utiliser directement `useListFicheResumes` */
export const useFichesNonClasseesListe = () => {
  const collectiviteId = useCollectiviteId();
  const { data: result } = useListFilteredFiches(collectiviteId, {
    filters: {
      noPlan: true,
    },
  });

  return { data: result?.fiches };
};
