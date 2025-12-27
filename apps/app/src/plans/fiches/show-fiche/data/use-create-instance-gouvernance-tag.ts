import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useCreateInstanceGouvernanceTag = (collectiviteId: number) => {
  const trpc = useTRPC();
  const { mutateAsync, isPending } = useMutation(
    trpc.collectivites.instanceGouvernance.create.mutationOptions({
      onSuccess: () => {
        trpc.collectivites.instanceGouvernance.list.queryKey({
          collectiviteId,
        });
      },
    })
  );

  return {
    mutate: mutateAsync,
    isPending,
  };
};
