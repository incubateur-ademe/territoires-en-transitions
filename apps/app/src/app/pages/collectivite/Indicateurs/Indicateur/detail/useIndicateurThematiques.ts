import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Met à jour les thématiques d'un indicateur personnalisé */
export const useUpsertIndicateurThematiques = (
) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();


  return useMutation(
    trpc.indicateurs.definitions.indicateursThematiques.upsert.mutationOptions({
      onSuccess: (data, variables) => {
        const { collectiviteId, indicateurId } = variables;
        // recharge les infos complémentaires associées à l'indicateur
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.definitions.list.queryKey({
            collectiviteId,
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.definitions.indicateursThematiques.list.queryKey({
            collectiviteId,
            indicateurId
          }),
        });
      },
    })
  );
};

/** Charge les thématiques d'un indicateur */
export const useIndicateurThematiques = (indicateurId: number) => {
  const collectivite_id = useCollectiviteId();

  const trpc = useTRPC();

  return useQuery(trpc.indicateurs.definitions.indicateursThematiques.list.queryOptions({
    collectiviteId: collectivite_id,
    indicateurId
  }));

};
