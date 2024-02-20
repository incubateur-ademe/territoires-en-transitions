import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';
import {FicheAction, FicheResume} from './types';
import {sortFichesResume} from './utils';

/**
 * Édite une fiche résumé
 */
export const useUpdateFicheResume = (ficheId: string, axeId?: number) => {
  const queryClient = useQueryClient();

  const axe_fiches_key = ['axe_fiches', axeId || null];
  const fiche_action_key = ['fiche_action', ficheId];

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
      onMutate: async args => {
        const fiche = args;

        const previousData = [
          [axe_fiches_key, queryClient.getQueryData(axe_fiches_key)],
          [fiche_action_key, queryClient.getQueryData(fiche_action_key)],
        ];

        queryClient.setQueryData(
          axe_fiches_key,
          (old: FicheResume[] | undefined): FicheResume[] => {
            const newFiches = old?.map(f => (f.id !== fiche.id ? f : fiche));
            return newFiches ? sortFichesResume(newFiches) : [];
          }
        );

        queryClient.setQueryData(
          fiche_action_key,
          (old?: {fiche: FicheAction}): any => {
            if (old) {
              return {
                fiche: {
                  ...old?.fiche,
                  titre: fiche.titre,
                  statut: fiche.statut,
                  niveau_priorite: fiche.niveau_priorite,
                  date_fin_provisoire: fiche.date_fin_provisoire,
                  amelioration_continue: fiche.amelioration_continue,
                } as FicheAction,
              };
            }
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
        queryClient.invalidateQueries(fiche_action_key);
      },
    }
  );
};
