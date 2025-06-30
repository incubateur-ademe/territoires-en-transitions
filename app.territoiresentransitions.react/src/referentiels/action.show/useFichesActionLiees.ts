
import { useListFicheResumes } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-list-fiche-resumes';

// charge les fiches actions liées à une action du référentiel
export const useFichesActionLiees = ({
  actionId,
  collectiviteId,
}: {
  actionId: string;
  collectiviteId: number;
}) => {
  const { data, isLoading } = useListFicheResumes(collectiviteId, {
    filters: {
      mesureIds: [actionId],
    },
  });

  if (isLoading || !data) {
    return { data: [], isLoading };
  }

  // dédoublonne les fiches liées à plusieurs sous-actions de la même action
  const fichesDedoublonnees = data.data?.filter(
    (fiche, i, a) => a.findIndex((v) => v.id === fiche.id) === i
  );

  // renvoie les données
  return {
    isLoading: false,
    data: fichesDedoublonnees ?? [],
  };
};
