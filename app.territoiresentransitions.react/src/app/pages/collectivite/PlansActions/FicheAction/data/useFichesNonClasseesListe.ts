import { useListFicheResumes } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-list-fiche-resumes';

/** @deprecated TODO: Supprimer ce hook et utiliser directement `useListFicheResumes` */
export const useFichesNonClasseesListe = () => {
  const { data: result } = useListFicheResumes({
    filters: {
      noPlan: true,
    },
  });

  return { data: result?.data };
};
