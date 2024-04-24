import {supabaseClient} from 'core-logic/api/supabase';
import {QueryKey, useMutation, useQueryClient} from 'react-query';
import {FicheResume} from './types';

/**
 * Édite une fiche résumé
 */
export const useUpdateFicheResume = (invalidationKeys?: QueryKey[]) => {
  const queryClient = useQueryClient();

  return useMutation(
    async (fiche: FicheResume) => {
      const {
        titre,
        statut,
        niveau_priorite,
        date_fin_provisoire,
        amelioration_continue,
      } = fiche;
      await supabaseClient
        .from('fiche_action')
        .update({
          titre,
          statut,
          niveau_priorite,
          date_fin_provisoire,
          amelioration_continue,
        })
        .eq('id', fiche.id!);
    },
    {
      onMutate: async () => {
        if (invalidationKeys) {
          const previousData = [
            ...invalidationKeys.map(key => [
              key,
              queryClient.getQueryData(key),
            ]),
          ];
          return previousData;
        }
      },
      onError: (err, args, previousData) => {
        previousData?.forEach(([key, data]) =>
          queryClient.setQueryData(key as string[], data)
        );
      },
      onSuccess: () => {
        invalidationKeys?.forEach(key => queryClient.invalidateQueries(key));
      },
    }
  );
};
