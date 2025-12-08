import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useRouter } from 'next/navigation';

export const useDeletePlan = (planId: number, redirectURL?: string) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const router = useRouter();
  const trpc = useTRPC();

  const { mutateAsync: deletePlan } = useMutation(
    trpc.plans.delete.mutationOptions()
  );

  return useMutation({
    mutationFn: async () => {
      await deletePlan({ planId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: trpc.plans.list.queryKey({
          collectiviteId,
        }),
      });
      if (redirectURL) {
        router.push(redirectURL);
      }
    },
  });
};
