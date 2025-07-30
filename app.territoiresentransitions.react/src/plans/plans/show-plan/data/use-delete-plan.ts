import { useCollectiviteId } from '@/api/collectivites';
import { trpc, useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export const useDeletePlan = (planId: number, redirectURL?: string) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const router = useRouter();
  const trpcClient = useTRPC();

  const { mutateAsync: deletePlan } = trpc.plans.plans.deletePlan.useMutation();

  return useMutation({
    mutationFn: async () => {
      await deletePlan({ planId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: trpcClient.plans.plans.list.queryKey({
          collectiviteId,
        }),
      });
      if (redirectURL) {
        router.push(redirectURL);
      }
    },
  });
};
