import { useTRPC } from '@/api/utils/trpc/client';
import { useNPSSurveyManager } from '@/ui/components/tracking/use-nps-survey-manager';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpsertBudgets = () => {
  const trpc = useTRPC();
  const { trackUpdateOperation } = useNPSSurveyManager();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.plans.fiches.budgets.upsert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.budgets.list.queryKey(),
        });
        trackUpdateOperation('fiches');
      },
    })
  );
};
