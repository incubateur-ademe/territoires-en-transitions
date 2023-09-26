import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';
import {FicheResume} from './types';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {ficheResumeByTitle} from './utils';

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
      onMutate: async args => {
        const fiche = args;

        if (axeId) {
          const axeKey = ['axe_fiches', axeId];

          const previousState = [[axeKey, queryClient.getQueryData(axeKey)]];

          queryClient.setQueryData(
            axeKey,
            (old: FicheResume[] | undefined): FicheResume[] => {
              const newFiches = old?.map(f => (f.id !== fiche.id ? f : fiche));
              return newFiches?.sort(ficheResumeByTitle) || [];
            }
          );

          return previousState;
        }
      },
      onError: (err, args, previousState) => {
        // en cas d'erreur restaure l'état précédent
        previousState?.forEach(([key, data]) =>
          queryClient.setQueryData(key as string[], data)
        );
      },
      onSuccess: (data, fiche) => {
        queryClient.invalidateQueries([
          'fiches_resume_collectivite',
          collectivite_id,
        ]);
        // queryClient.invalidateQueries(['axe_fiches', axeId]);
        queryClient.invalidateQueries(['fiche_action', fiche.id]);
      },
    }
  );
};
