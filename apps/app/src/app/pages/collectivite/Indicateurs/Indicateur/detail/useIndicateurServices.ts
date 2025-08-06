import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Met à jour les services pilotes d'un indicateur */
export const useUpsertIndicateurServices = () => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.indicateurs.definitions.indicateursServicesPilotes.upsert.mutationOptions(
      {
        onSuccess: (_, variables) => {
          const { collectiviteId, indicateurId } = variables;
          // recharge les infos complémentaires associées à l'indicateur
          queryClient.invalidateQueries({
            queryKey: trpc.indicateurs.definitions.list.queryKey({
              collectiviteId,
            }),
          });
          queryClient.invalidateQueries({
            queryKey:
              trpc.indicateurs.definitions.indicateursServicesPilotes.list.queryKey(
                {
                  collectiviteId,
                  indicateurId,
                }
              ),
          });
        },
        meta: {
          success: "L'indicateur a été mis à jour",
          error: "L'indicateur n'a pas pu être mis à jour",
        },
      }
    )
  );
};

/** Charge les services pilotes d'un indicateur */
export const useIndicateurServices = (indicateurId: number) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useQuery(
    trpc.indicateurs.definitions.indicateursServicesPilotes.list.queryOptions({
      collectiviteId,
      indicateurId,
    })
  );
};
