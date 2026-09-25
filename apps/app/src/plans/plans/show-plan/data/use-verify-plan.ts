import { appLabels } from '@/app/labels/catalog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

/**
 * Validation d'un plan importé par IA. La démarche qui le tient peut alors
 * compter son programme d'actions comme complet.
 */
export const useVerifyPlan = (planId: number) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.plans.plans.verify.mutationOptions({
      meta: {
        success: appLabels.planImporteValide,
        error: appLabels.planImporteValidationErreur,
      },
      onSuccess: () =>
        Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.plans.plans.get.queryKey({ planId }),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.demarches.pcaet.get.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.demarches.pcaet.list.pathKey(),
          }),
        ]),
    })
  );
};
