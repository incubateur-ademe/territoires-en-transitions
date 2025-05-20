import { updateLinkedFiches } from '@/api/plan-actions';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { trpc } from '@/api/utils/trpc/client';
import { useListFicheResumes } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-list-fiche-resumes';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { useMutation } from 'react-query';

/**
 * Charge la liste des fiches action liées à une autre fiche action
 */
export const useFichesActionLiees = (ficheId: number, requested = true) => {
  const { data: ficheResumes, isLoading } = useListFicheResumes(
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
  const collectiviteId = useCollectiviteId()!;
  const supabase = useSupabase();

  const utils = trpc.useUtils();

  return useMutation(
    async (linkedFicheIds: number[]) =>
      updateLinkedFiches(supabase, collectiviteId, ficheId, linkedFicheIds),

    {
      onSuccess: () => {
        utils.plans.fiches.listResumes.invalidate({
          collectiviteId,
        });
      },
    }
  );
};
