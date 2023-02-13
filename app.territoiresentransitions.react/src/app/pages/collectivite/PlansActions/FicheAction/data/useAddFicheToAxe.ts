import {useMutation, useQueryClient} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {FicheActionVueRow} from './types/ficheActionVue';
import {TProfondeurAxe} from '../../PlanAction/data/types/profondeurPlan';
import {TPlanActionAxeInsert} from '../../PlanAction/data/types/alias';
import {useCollectiviteId} from 'core-logic/hooks/params';
// import {useHistory} from 'react-router-dom';
// import {makeCollectivitePlanActionFicheUrl} from 'app/paths';

type Args = {
  planAction_id: number;
  fiche_id: number;
  axe: TProfondeurAxe;
};

export const useAddFicheToAxe = () => {
  const queryClient = useQueryClient();
  // const history = useHistory();
  const collectivite_id = useCollectiviteId();

  return useMutation(
    async ({axe, fiche_id}: Args) => {
      await supabaseClient.rpc('ajouter_fiche_action_dans_un_axe', {
        axe_id: axe.axe.id,
        fiche_id,
      });
    },
    {
      mutationKey: 'add_fiche_to_axe',
      onMutate: async args => {
        const ficheActionKey = ['fiche_action', args.fiche_id.toString()];
        // Cancel any outgoing refetches
        // (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({queryKey: ficheActionKey});

        // Snapshot the previous value
        const previousAction: {fiche: FicheActionVueRow} | undefined =
          queryClient.getQueryData(ficheActionKey);

        // Optimistically update to the new value
        queryClient.setQueryData(ficheActionKey, (old: any) => {
          const formatedNewAxe: TPlanActionAxeInsert = {
            collectivite_id: collectivite_id!,
            id: args.axe.axe.id,
            nom: args.axe.axe.nom,
          };
          return {
            fiche: {
              ...old.fiche,
              axes: old.fiche.axes
                ? [...old.fiche.axes, formatedNewAxe]
                : [formatedNewAxe],
            },
          };
        });

        // Return a context object with the snapshotted value
        return {previousAction};
      },
      onSettled: (data, err, args, context) => {
        const {fiche_id} = args;

        if (err) {
          queryClient.setQueryData(
            ['fiche_action', fiche_id.toString()],
            context?.previousAction
          );
        }
        // history.push(
        //   makeCollectivitePlanActionFicheUrl({
        //     collectiviteId: collectivite_id!,
        //     planActionUid: planAction_id.toString(),
        //     ficheUid: fiche_id.toString(),
        //   })
        // );
        queryClient.invalidateQueries(['fiche_action', fiche_id.toString()]);
        queryClient.invalidateQueries(['plans_actions', collectivite_id]);
      },
    }
  );
};
