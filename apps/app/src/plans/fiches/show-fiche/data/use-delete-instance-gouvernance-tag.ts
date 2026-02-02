import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useDeleteInstanceGouvernance = (collectiviteId: number) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation(
    trpc.collectivites.tags.instanceGouvernance.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectivites.tags.instanceGouvernance.list.queryKey({
            collectiviteId,
          }),
        });
      },
    })
  );

  return {
    mutate: mutateAsync,
    isPending,
  };
};
