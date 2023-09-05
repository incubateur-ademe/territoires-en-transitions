import {useMutation, useQueryClient} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {FicheResume} from './types';
import {ficheChangeAxeDansPlan} from '../../PlanAction/data/utils';
import {dropAnimation} from '../../PlanAction/DragAndDropNestedContainers/Arborescence';
import {naturalSort} from 'utils/naturalSort';

type Args = {
  fiche: FicheResume;
  plan_id: number;
  old_axe_id: number;
  new_axe_id: number;
};

export const useFicheChangeAxe = () => {
  const queryClient = useQueryClient();

  return useMutation(
    async ({fiche, new_axe_id, old_axe_id}: Args) => {
      await supabaseClient.rpc('deplacer_fiche_action_dans_un_axe', {
        fiche_id: fiche.id!,
        new_axe_id,
        old_axe_id,
      });
    },
    {
      mutationKey: 'fiche_change_axe',
      onMutate: async args => {
        const {fiche, new_axe_id, old_axe_id, plan_id} = args;
        const fiche_id = fiche.id!;

        // clés dans le cache
        const planActionKey = ['plan_action', plan_id];
        const oldAxeKey = ['axe_fiches', old_axe_id];
        const newAxeKey = ['axe_fiches', new_axe_id];

        // copie l'état précédent avant de modifier le cache
        const previousState = [
          [planActionKey, queryClient.getQueryData(planActionKey)],
          [oldAxeKey, queryClient.getQueryData(oldAxeKey)],
          [newAxeKey, queryClient.getQueryData(newAxeKey)],
        ];

        // met à jour les listes d'id de fiches dans l'arborescence
        queryClient.setQueryData(planActionKey, (old: any) => {
          return ficheChangeAxeDansPlan(old, fiche_id, old_axe_id, new_axe_id);
        });

        // supprime la fiche de l'axe source
        queryClient.setQueryData(
          ['axe_fiches', old_axe_id],
          (old: FicheResume[] | undefined): FicheResume[] => {
            return (
              old?.filter((fiche: FicheResume) => fiche.id !== fiche_id) || []
            );
          }
        );

        // ajoute la fiche dans l'axe destination
        queryClient.setQueryData(
          ['axe_fiches', new_axe_id],
          (old: FicheResume[] | undefined): FicheResume[] => {
            return [...(old || []), fiche].sort(byTitle);
          }
        );

        // renvoi l'état précédent
        return previousState;
      },
      onError: (err, args, previousState) => {
        // en cas d'erreur restaure l'état précédent
        previousState?.forEach(([key, data]) =>
          queryClient.setQueryData(key as string[], data)
        );
      },
      onSuccess: (data, args) => {
        args.fiche.id && dropAnimation(`fiche-${args.fiche.id.toString()}`);
      },
    }
  );
};

// tri local des fiches par titre
const byTitle = (a: FicheResume, b: FicheResume) => {
  if (!a.titre) return -1;
  if (!b.titre) return 1;
  return naturalSort(a.titre, b.titre);
};
