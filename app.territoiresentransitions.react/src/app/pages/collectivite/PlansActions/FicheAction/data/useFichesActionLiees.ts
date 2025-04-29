import { updateLinkedFiches } from '@/api/plan-actions';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useFicheResumesFetch } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useFicheResumesFetch';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useMutation, useQueryClient } from 'react-query';

/**
 * Charge la liste des fiches action liées à une autre fiche action
 */
export const useFichesActionLiees = (ficheId: number, requested = true) => {
  const { data: ficheResumes, isLoading } = useFicheResumesFetch(
    {
      filters: {
        ficheIds: [ficheId],
      },
    },
    requested
  );

  // const { data, ...other } = useQuery(
  //   ['fiche_action_fiche_action_liees', collectiviteId, ficheId],
  //   async () =>
  //     ficheResumesFetch({
  //       dbClient: supabase,
  //       trpcUtils,
  //       collectiviteId,
  //       options: { filtre: { linkedFicheActionIds: [ficheId] } },
  //     }),
  //   { enabled: requested }
  // );

  return { data: ficheResumes?.data ?? [], isLoading };
  // return { data: data?.data ?? [], ...other };
};

/**
 * Met à jour la liste des fiches action liées à un indicateur
 */
export const useUpdateFichesActionLiees = (ficheId: number) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId()!;
  const supabase = useSupabase();

  return useMutation(
    async (linkedFicheIds: number[]) =>
      updateLinkedFiches(supabase, collectiviteId, ficheId, linkedFicheIds),

    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          'fiche_action_fiche_action_liees',
          collectiviteId,
          ficheId,
        ]);
      },
    }
  );
};
