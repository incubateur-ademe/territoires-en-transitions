import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Met à jour les personnes pilotes d'un indicateur */
export const useUpsertIndicateurPilote = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.indicateurs.pilotes.upsert.mutationOptions({
      onSuccess: (data, variables) => {
        const { collectiviteId, indicateurId, indicateurPilotes } = variables;
        // recharge les infos complémentaires associées à l'indicateur
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.pilotes.list.queryKey({
            collectiviteId,
            indicateurId
          }),
        });
      },
    })
  );
};

/** Charge les personnes pilotes d'un indicateur */
export const useIndicateurPilotes = (indicateurId: number) => {
  const collectivite_id = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(trpc.indicateurs.pilotes.list.queryOptions({
    collectiviteId: collectivite_id,
    indicateurId
  }));
};
