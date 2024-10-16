import { ficheResumesFetch, updateLinkedFiches } from '@tet/api/plan-actions';
import { supabaseClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useMutation, useQuery, useQueryClient } from 'react-query';

/**
 * Charge la liste des fiches action liées à une autre fiche action
 */
export const useFichesActionLiees = (ficheId: number) => {
  const collectiviteId = useCollectiviteId()!;

  const { data, ...other } = useQuery(
    ['fiche_action_fiche_action_liees', collectiviteId, ficheId],
    async () =>
      ficheResumesFetch({
        dbClient: supabaseClient,
        collectiviteId,
        options: { filtre: { linkedFicheActionIds: [ficheId] } },
      })
  );
  return { data: data?.data ?? [], ...other };
};

/**
 * Met à jour la liste des fiches action liées à un indicateur
 */
export const useUpdateFichesActionLiees = (ficheId: number) => {
  const queryClient = useQueryClient();
  const collectiviteId = useCollectiviteId()!;

  return useMutation(
    async (linkedFicheIds: number[]) =>
      updateLinkedFiches(
        supabaseClient,
        collectiviteId,
        ficheId,
        linkedFicheIds
      ),

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
