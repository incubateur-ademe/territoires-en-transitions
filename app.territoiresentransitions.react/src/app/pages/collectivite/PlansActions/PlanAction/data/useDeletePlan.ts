import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export const useDeletePlan = (planId: number, redirectURL?: string) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const router = useRouter();
  const utils = trpc.useUtils();
  const navigation_key = ['plans_navigation', collectivite_id];

  const { mutateAsync: deletePlanMutation } =
    trpc.plans.plans.deletePlan.useMutation();

  return useMutation({
    mutationFn: async () => {
      await deletePlanMutation({ planId });
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: navigation_key });
      utils.plans.plans.get.invalidate({ planId });
      if (redirectURL) {
        router.push(redirectURL);
      }
    },
  });
};
