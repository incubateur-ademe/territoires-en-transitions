import { useFicheResumesFetch } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useFicheResumesFetch';

// charge les fiches actions liées à une action du référentiel
export const useFichesActionLiees = (actionId: string) => {
  const { data, isLoading } = useFicheResumesFetch({
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
