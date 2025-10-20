import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ListIndicateurValeurOuput } from './use-list-indicateur-valeurs';

export const useUpsertIndicateurValeur = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.indicateurs.valeurs.upsert.mutationOptions({
      onSuccess: (newValeur, variables) => {
        const { collectiviteId, indicateurId } = variables;

        // recharge les infos complémentaires associées à l'indicateur
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.definitions.list.queryKey({
            collectiviteId,
          }),
        });

        queryClient
          .getQueriesData<ListIndicateurValeurOuput>({
            queryKey: trpc.indicateurs.valeurs.list.queryKey({
              collectiviteId,
            }),
          })
          .forEach(([queryKey, queryResult]) => {
            if (
              queryResult?.indicateurs.some(
                (indicateur) => indicateur.definition.id === indicateurId
              )
            ) {
              queryClient.invalidateQueries({ queryKey });
            }
          });

        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.actions.getValeursUtilisables.queryKey({
            collectiviteId,
          }),
        });
      },
      meta: {
        success: 'La valeur a été mise à jour',
        error: "La valeur n'a pas pu être mise à jour",
      },
    })
  );
};
