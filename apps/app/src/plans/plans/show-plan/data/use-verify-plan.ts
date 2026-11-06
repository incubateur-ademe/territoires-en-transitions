import { appLabels } from '@/app/labels/catalog';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useRouter } from 'next/navigation';

const VERIFIED_TOAST_DURATION_IN_MS = 6_000;

/**
 * Validation d'un plan importé par IA. La démarche qui le tient peut alors
 * compter son programme d'actions comme complet : le toast y ramène.
 */
export const useVerifyPlan = (
  planId: number,
  { demarcheUrl }: { demarcheUrl?: string } = {}
) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setToast, setToastWithAction } = useToastContext();
  const router = useRouter();

  return useMutation(
    trpc.plans.plans.verify.mutationOptions({
      meta: {
        error: appLabels.planImporteValidationErreur,
      },
      onSuccess: () => {
        if (demarcheUrl) {
          setToastWithAction({
            status: 'success',
            message: appLabels.planImporteValide,
            autoHideDuration: VERIFIED_TOAST_DURATION_IN_MS,
            action: {
              label: appLabels.planRevenirALaDemarche,
              onClick: () => router.push(demarcheUrl),
            },
          });
        } else {
          setToast('success', appLabels.planImporteValide);
        }
        return Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.plans.plans.get.queryKey({ planId }),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.plans.plans.list.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.demarches.pcaet.get.pathKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.demarches.pcaet.list.pathKey(),
          }),
        ]);
      },
    })
  );
};
