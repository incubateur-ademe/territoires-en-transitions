import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

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
