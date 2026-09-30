import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

export const useUpdateFichesActionLiees = (ficheId: number) => {
  const collectiviteId = useCollectiviteId();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutate, ...rest } = useMutation(
    trpc.plans.fiches.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.plans.fiches.listFiches.queryKey({
            collectiviteId,
          }),
        });
      },
    })
  );

  return {
    ...rest,
    mutate: (linkedFicheIds: number[]) =>
      mutate({
        ficheId,
        ficheFields: {
          fichesLiees: linkedFicheIds.map((id) => ({ id })),
        },
      }),
  };
};
