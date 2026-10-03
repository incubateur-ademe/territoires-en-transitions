import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { FicheSecteurs, OrigineSecteursEnum } from '@tet/domain/plans';

export const useUpsertFicheSecteurs = (ficheId: number) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const queryKey = trpc.plans.fiches.getSecteurs.queryKey({ ficheId });

  return useMutation(
    trpc.plans.fiches.upsertSecteurs.mutationOptions({
      onMutate: async ({ secteurs }) => {
        await queryClient.cancelQueries({ queryKey });
        const previousSecteurs = queryClient.getQueryData(queryKey);
        const optimisticSecteurs: FicheSecteurs =
          secteurs.length === 0
            ? {
                etat: 'non_attribuable',
                origine: OrigineSecteursEnum.MANUELLE,
              }
            : {
                etat: 'attribue',
                secteurs,
                origine: OrigineSecteursEnum.MANUELLE,
              };
        queryClient.setQueryData(queryKey, optimisticSecteurs);
        return { previousSecteurs };
      },
      onError: (_error, _input, context) => {
        queryClient.setQueryData(queryKey, context?.previousSecteurs);
      },
      onSuccess: (secteurs) => {
        queryClient.setQueryData(queryKey, secteurs);
      },
    })
  );
};
