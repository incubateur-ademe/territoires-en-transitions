import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCollectiviteId } from '@tet/api/collectivites';

/**
 * Charge la liste des fiches action liées à une autre fiche action
 */
export const useFichesActionLiees = ({
  ficheId,
  collectiviteId,
  requested = true,
}: {
  ficheId: number;
  collectiviteId: number;
  requested?: boolean;
}) => {
  const { fiches, isLoading } = useListFiches(
    collectiviteId,
    {
      filters: {
        linkedFicheIds: [ficheId],
      },
    },
    requested
  );

  return { fiches, isLoading };
};

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
