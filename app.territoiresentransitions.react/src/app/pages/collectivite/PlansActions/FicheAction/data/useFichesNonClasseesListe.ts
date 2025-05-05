import { useListFicheResumes } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useFicheResumesFetch';

/** @deprecated TODO: Supprimer ce hook et utiliser directement `useListFicheResumes` */
export const useFichesNonClasseesListe = () => {
  const { data: result } = useListFicheResumes({
    filters: {
      noPlan: true,
    },
  });

  return { data: result?.data };
};
