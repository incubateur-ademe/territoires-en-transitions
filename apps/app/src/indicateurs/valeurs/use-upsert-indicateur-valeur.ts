import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { ListIndicateurValeurOuput } from './use-list-indicateur-valeurs';

export const useUpsertIndicateurValeur = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setToast } = useToastContext();

  return useMutation(
    trpc.indicateurs.valeurs.upsert.mutationOptions({
      onSuccess: (_, variables) => {
        const { collectiviteId, indicateurId } = variables;
        if (!variables.id) {
          setToast('success', 'La valeur a été ajoutée');
        }

        // recharge les infos complémentaires associées à l'indicateur
        queryClient.invalidateQueries({
          queryKey: trpc.indicateurs.indicateurs.list.queryKey({
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
      onError: (_, variables) => {
        setToast(
          'error',
          `La valeur n'a pas pu être ${variables.id ? 'modifiée' : 'ajoutée'}`
        );
      },
    })
  );
};
