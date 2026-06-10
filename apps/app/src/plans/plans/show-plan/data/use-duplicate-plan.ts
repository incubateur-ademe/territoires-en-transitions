import { appLabels } from '@/app/labels/catalog';
import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useRouter } from 'next/navigation';

export const useDuplicatePlan = (planId: number) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const router = useRouter();
  const trpc = useTRPC();

  const { mutateAsync: duplicatePlan } = useMutation(
    trpc.plans.plans.duplicate.mutationOptions()
  );

  return useMutation({
    mutationFn: ({ nom }: { nom: string }) => duplicatePlan({ planId, nom }),
    meta: {
      success: appLabels.planDuplique,
    },
    onSuccess: ({ planId: newPlanId }) => {
      queryClient.invalidateQueries({
        queryKey: trpc.plans.plans.list.queryKey({ collectiviteId }),
      });
      router.push(
        makeCollectivitePlanActionUrl({
          collectiviteId,
          planActionUid: newPlanId.toString(),
        })
      );
    },
  });
};
