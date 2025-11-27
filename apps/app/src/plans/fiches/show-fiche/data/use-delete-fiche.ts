import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
type Args = {
  onDeleteCallback?: () => void;
};

/**
 * Supprime une fiche action d'une collectivité
 */
export const useDeleteFiche = (args: Args) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();

  return useMutation(
    trpc.plans.fiches.delete.mutationOptions({
      meta: { disableToast: true },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.listFiches.queryKey({
            collectiviteId,
          }),
        });

        args.onDeleteCallback?.();
      },
    })
  );
};
