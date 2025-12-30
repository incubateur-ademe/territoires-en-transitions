import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useUpdateInstanceGouvernanceTag = (collectiviteId: number) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation(
    trpc.collectivites.instanceGouvernance.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.collectivites.instanceGouvernance.list.queryKey({
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
