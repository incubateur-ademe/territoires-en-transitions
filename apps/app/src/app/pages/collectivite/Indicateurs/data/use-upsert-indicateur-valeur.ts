import { useTRPC } from '@/api/utils/trpc/client';
import { useNPSSurveyManager } from '@/ui/components/tracking/use-nps-survey-manager';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpsertIndicateurValeur = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { trackUpdateOperation } = useNPSSurveyManager();
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
        trackUpdateOperation('indicateurs');
      },
    })
  );
};
