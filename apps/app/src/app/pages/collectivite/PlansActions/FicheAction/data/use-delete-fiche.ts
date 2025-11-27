import { useCollectiviteId } from '@/api/collectivites';
import { useTRPC } from '@/api/utils/trpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useDeleteFiche = ({
  onDeleteCallback,
}: {
  onDeleteCallback?: () => void;
}) => {
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

        onDeleteCallback?.();
      },
    })
  );
};
