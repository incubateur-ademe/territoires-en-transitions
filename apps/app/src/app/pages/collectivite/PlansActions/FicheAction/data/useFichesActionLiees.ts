import { useSupabase, useTRPC } from '@/api';
import { useCollectiviteId } from '@/api/collectivites';
import { updateLinkedFiches } from '@/api/plan-actions';
import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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
  const supabase = useSupabase();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['update_linked_fiches'],
    mutationFn: async (linkedFicheIds: number[]) =>
      updateLinkedFiches(supabase, collectiviteId, ficheId, linkedFicheIds),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.plans.fiches.listFiches.queryKey({
          collectiviteId,
        }),
      });
    },
  });
};
