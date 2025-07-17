import { useCollectiviteId } from '@/api/collectivites';
import { trpc } from '@/api/utils/trpc/client';
import { PlanNode } from '@/backend/plans/plans/plans.schema';
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
  const utils = trpc.useUtils();
  const navigation_key = ['plans_navigation', collectivite_id];

  const { mutateAsync: deleteAxe } = trpc.plans.plans.deleteAxe.useMutation();

  return useMutation({
    mutationFn: async () => {
      await deleteAxe({ axeId: axe_id });
    },
    onMutate: async () => {
      await utils.plans.plans.get.cancel({ planId });
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
      utils.plans.plans.get.invalidate({ planId });
      redirectURL && router.push(redirectURL);
    },
  });
};
