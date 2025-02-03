import { FicheResume } from '@/api/plan-actions';
import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { QueryKey, useMutation, useQueryClient } from 'react-query';

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
        priorite,
        dateFinProvisoire,
        ameliorationContinue,
      } = fiche;
      await supabaseClient
        .from('fiche_action')
        .update({
          titre,
          statut,
          niveau_priorite: priorite,
          date_fin_provisoire: dateFinProvisoire,
          amelioration_continue: ameliorationContinue,
        })
        .eq('id', fiche.id);
    },
    {
      onMutate: async () => {
        if (invalidationKeys) {
          const previousData = [
            ...invalidationKeys.map((key) => [
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
        invalidationKeys?.forEach((key) => queryClient.invalidateQueries(key));
      },
    }
  );
};
