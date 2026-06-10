import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useRouter } from 'next/navigation';

export const useDuplicateFiche = ({
  ficheId,
  invalidatePlanId,
}: {
  ficheId: number;
  invalidatePlanId?: number;
}) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync: duplicateFiche } = useMutation(
    trpc.plans.fiches.duplicate.mutationOptions()
  );

  return useMutation({
    mutationFn: () => duplicateFiche({ ficheId }),
    meta: {
      success: appLabels.actionDupliquee,
    },
    onSuccess: ({ ficheId: duplicatedFicheId }) => {
      queryClient.invalidateQueries({
        queryKey: trpc.plans.fiches.listFiches.queryKey({ collectiviteId }),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.plans.fiches.countBy.queryKey(),
      });
      queryClient.invalidateQueries({ queryKey: ['axe_fiches'] });
      if (invalidatePlanId) {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.plans.get.queryKey({
            planId: invalidatePlanId,
          }),
        });
      }
      router.push(
        makeCollectiviteActionUrl({
          collectiviteId,
          ficheUid: duplicatedFicheId.toString(),
        })
      );
    },
  });
};
