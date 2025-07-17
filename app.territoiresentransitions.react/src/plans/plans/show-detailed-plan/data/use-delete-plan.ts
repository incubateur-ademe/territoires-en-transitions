import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export const useDeletePlan = (planId: number, redirectURL?: string) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const router = useRouter();
  const utils = trpc.useUtils();
  const navigation_key = ['plans_navigation', collectiviteId];

  const { mutateAsync: deletePlan } = trpc.plans.plans.deletePlan.useMutation();

  return useMutation({
    mutationFn: async () => {
      await deletePlan({ planId });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: navigation_key });

      const previousData = queryClient.getQueryData(navigation_key);

      // Remove the plan from navigation
      queryClient.setQueryData(navigation_key, (old: any[] | undefined) =>
        old ? old.filter((p) => p.id !== planId) : []
      );

      return previousData;
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(navigation_key, context);
    },
    onSuccess: async () => {
      console.log('onSuccess');
      await queryClient.invalidateQueries({ queryKey: navigation_key });
      await utils.plans.plans.getDetailedPlans.invalidate({
        collectiviteId,
      });
      if (redirectURL) {
        router.push(redirectURL);
      }
    },
  });
};
