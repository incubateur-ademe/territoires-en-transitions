import { useCollectiviteId } from '@/api/collectivites';
import { updateLinkedFiches } from '@/api/plan-actions';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useTRPC } from '@/api/utils/trpc/client';
import { useListFicheResumes } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-list-fiche-resumes';
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
  const { data: ficheResumes, isLoading } = useListFicheResumes(
    collectiviteId,
    {
      filters: {
        linkedFicheIds: [ficheId],
      },
    },
    requested
  );

  return { data: ficheResumes?.data ?? [], isLoading };
};

export const useUpdateFichesActionLiees = (ficheId: number) => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkedFicheIds: number[]) =>
      updateLinkedFiches(supabase, collectiviteId, ficheId, linkedFicheIds),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.plans.fiches.listResumes.queryKey({
          collectiviteId,
        }),
      });
    },
  });
};
