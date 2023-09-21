import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';
import {FicheResume} from './types';
import {useCollectiviteId} from 'core-logic/hooks/params';

/**
 * Édite un axe dans un plan d'action
 */
export const useUpdateFicheResume = (axeId?: number) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  return useMutation(
    async (fiche: FicheResume) => {
      const {titre, statut, niveau_priorite, date_fin_provisoire} = fiche;
      await supabaseClient
        .from('fiche_action')
        .update({titre, statut, niveau_priorite, date_fin_provisoire})
        .eq('id', fiche.id!);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          'fiches_resume_collectivite',
          collectivite_id,
        ]);
        queryClient.invalidateQueries(['axe_fiches', axeId]);
      },
    }
  );
};
