import { useCollectiviteId } from '@/api/collectivites';
import { trpc, useTRPC } from '@/api/utils/trpc/client';
import { PlanNode } from '@/domain/plans/plans';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export const useDeleteAxe = (
  axe_id: number,
  planId: number,
  redirectURL?: string
) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const router = useRouter();
  const navigation_key = ['plans_navigation', collectivite_id];
  const trpcClient = useTRPC();
  const { mutateAsync: deleteAxe } = trpc.plans.plans.deleteAxe.useMutation();

  return useMutation({
    mutationFn: async () => {
      await deleteAxe({ axeId: axe_id });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: trpcClient.plans.plans.get.queryKey({ planId }),
      });
      await queryClient.cancelQueries({ queryKey: navigation_key });

      const previousData = [
        [navigation_key, queryClient.getQueryData(navigation_key)],
      ];

      // update les axes de la navigation
      // ne supprime que l'axe parent et non les enfants
      // ceux ci ne sont pas affichés et retirer lors de l'invalidation
      queryClient.setQueryData(navigation_key, (old: PlanNode[] | undefined) =>
        old ? old.filter((a) => a.id !== axe_id) : []
      );

      return previousData;
    },
    onError: (err, axe, context) => {
      context?.forEach(([key, data]) =>
        queryClient.setQueryData(key as string[], data)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: navigation_key });
      queryClient.invalidateQueries({
        queryKey: trpcClient.plans.plans.get.queryKey({ planId }),
      });
      redirectURL && router.push(redirectURL);
    },
  });
};
