import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';
import {FicheResume} from './types';
import {sortFichesResume} from './utils';

/**
 * Édite un axe dans un plan d'action
 */
export const useUpdateFicheResume = (axeId?: number) => {
  const queryClient = useQueryClient();

  const axe_fiches_key = ['axe_fiches', axeId || null];

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

        const previousData = [
          [axe_fiches_key, queryClient.getQueryData(axe_fiches_key)],
        ];

        queryClient.setQueryData(
          axe_fiches_key,
          (old: FicheResume[] | undefined): FicheResume[] => {
            const newFiches = old?.map(f => (f.id !== fiche.id ? f : fiche));
            return newFiches ? sortFichesResume(newFiches) : [];
          }
        );

        return previousData;
      },
      onError: (err, args, previousData) => {
        previousData?.forEach(([key, data]) =>
          queryClient.setQueryData(key as string[], data)
        );
      },
      onSuccess: () => {
        queryClient.invalidateQueries(axe_fiches_key);
      },
    }
  );
};
