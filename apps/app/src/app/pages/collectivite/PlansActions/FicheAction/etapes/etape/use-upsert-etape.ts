import { useTRPC } from '@/api/utils/trpc/client';
import { useNPSSurveyManager } from '@/ui/components/tracking/use-nps-survey-manager';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Charge les étapes d'une fiche action
 */
export const useUpsertEtape = () => {
  const { trackUpdateOperation } = useNPSSurveyManager();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.plans.fiches.etapes.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.etapes.list.queryKey(),
        });
        trackUpdateOperation('fiches');
      },
    })
  );
};
