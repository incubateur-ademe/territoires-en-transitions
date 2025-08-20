import { Indicateurs } from '@/api';
import { useTRPC } from '@/api/utils/trpc/client';
import { useUpdateIndicateurDefinition } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/useUpdateIndicateurDefinition';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpsertIndicateurValeur = (indicateur: Indicateurs.domain.IndicateurDefinitionUpdate) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate: updateDefinition } = useUpdateIndicateurDefinition();

  return useMutation(
    trpc.indicateurs.valeurs.upsert.mutationOptions({
      onSuccess: (data, variables) => {
        const { collectiviteId, indicateurId } = variables;
        if (collectiviteId && indicateurId) {
          queryClient.invalidateQueries({
            queryKey: trpc.indicateurs.valeurs.list.queryKey({
              collectiviteId,
              indicateurIds: [indicateurId],
            }),
          });
          queryClient.invalidateQueries({
            queryKey: trpc.referentiels.actions.getValeursUtilisables.queryKey({
              collectiviteId,
            }),
          });
        }
      },
    })
  );
};
