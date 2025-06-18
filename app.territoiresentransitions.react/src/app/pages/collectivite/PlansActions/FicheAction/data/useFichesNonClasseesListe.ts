import { useCollectiviteId } from '@/api/collectivites';
import { useListFicheResumes } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-list-fiche-resumes';

/** @deprecated TODO: Supprimer ce hook et utiliser directement `useListFicheResumes` */
export const useFichesNonClasseesListe = () => {
  const collectiviteId = useCollectiviteId();
  const { data: result } = useListFicheResumes(collectiviteId, {
    filters: {
      noPlan: true,
    }
  });

  return { data: result?.data };
};
