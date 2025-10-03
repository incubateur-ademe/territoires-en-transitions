import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';

// charge les fiches actions liées à une action du référentiel
export const useFichesActionLiees = ({
  actionId,
  collectiviteId,
}: {
  actionId: string;
  collectiviteId: number;
}) => {
  const { fiches, isLoading } = useListFiches(collectiviteId, {
    filters: {
      mesureIds: [actionId],
    },
  });

  if (isLoading) {
    return { data: [], isLoading };
  }

  // dédoublonne les fiches liées à plusieurs sous-actions de la même action
  const fichesDedoublonnees = fiches?.filter(
    (fiche, i, a) => a.findIndex((v) => v.id === fiche.id) === i
  );

  // renvoie les données
  return {
    isLoading: false,
    data: fichesDedoublonnees ?? [],
  };
};
