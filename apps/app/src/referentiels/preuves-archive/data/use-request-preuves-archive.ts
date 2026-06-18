import { useTRPC } from '@tet/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useRequestPreuvesArchive() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.referentiels.preuvesArchive.request.mutationOptions({
      onSuccess: (_, { collectiviteId, referentielId }) => {
        queryClient.invalidateQueries({
          queryKey: trpc.referentiels.preuvesArchive.list.queryKey({
            collectiviteId,
            referentielId,
          }),
        });
      },
    })
  );
}
