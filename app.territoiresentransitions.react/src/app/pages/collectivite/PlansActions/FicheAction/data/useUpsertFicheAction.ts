import {useHistory} from 'react-router-dom';
import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionAxeFicheUrl,
  makeCollectivitePlanActionFicheUrl,
} from 'app/paths';
import {FicheAction} from './types';

/** Upsert une fiche action pour une collectivité */
const upsertFicheAction = async (fiche: FicheAction) => {
  let query = supabaseClient
    .from('fiches_action')
    .insert(fiche as any)
    .select();

  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Crée une nouvelle fiche action pour une collectivité
 * Si l'id d'un axe est donnée en argument, la fiche est ajoutée à cet axe
 */
type Args = {
  axeId?: number;
  planActionId?: number;
  isAxePage?: boolean;
};

export const useCreateFicheAction = (args?: Args) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const history = useHistory();

  return useMutation(
    () =>
      upsertFicheAction({
        collectivite_id: collectivite_id!,
        axes:
          args && args.axeId
            ? [{id: args?.axeId, collectivite_id: collectivite_id!}]
            : null,
      } as never),
    {
      meta: {disableToast: true},
      onSuccess: data => {
        if (args && args?.axeId) {
          if (args.isAxePage) {
            queryClient.invalidateQueries(['plan_action', args.axeId]);
            history.push(
              makeCollectivitePlanActionAxeFicheUrl({
                collectiviteId: collectivite_id!,
                ficheUid: data[0].id!.toString(),
                planActionUid: args.planActionId!.toString(),
                axeUid: args.axeId.toString(),
              })
            );
          } else {
            queryClient.invalidateQueries(['plan_action', args.planActionId]);
            history.push(
              makeCollectivitePlanActionFicheUrl({
                collectiviteId: collectivite_id!,
                ficheUid: data[0].id!.toString(),
                planActionUid: args.planActionId!.toString(),
              })
            );
          }
        } else {
          queryClient.invalidateQueries([
            'fiches_non_classees',
            collectivite_id,
          ]);
          history.push(
            makeCollectiviteFicheNonClasseeUrl({
              collectiviteId: collectivite_id!,
              ficheUid: data[0].id!.toString(),
            })
          );
        }
      },
    }
  );
};

/**
 * Édite une fiche action
 */
export const useEditFicheAction = () => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  return useMutation(upsertFicheAction, {
    mutationKey: 'edit_fiche',
    onMutate: async fiche => {
      const ficheActionKey = ['fiche_action', fiche.id?.toString()];
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({queryKey: ficheActionKey});

      // Snapshot the previous value
      const previousFiche: {fiche: FicheAction} | undefined =
        queryClient.getQueryData(ficheActionKey);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ficheActionKey,
        (old?: {fiche: FicheAction}) => ({
          fiche: {
            ...old?.fiche,
            ...fiche,
          },
        })
      );

      // Return a context object with the snapshotted value
      return {previousFiche};
    },
    onSettled: (data, err, fiche, context) => {
      if (err) {
        queryClient.setQueryData(
          ['fiche_action', fiche.id],
          context?.previousFiche
        );
      }
      queryClient.invalidateQueries(['fiche_action', fiche.id?.toString()]);

      queryClient.invalidateQueries(['fiches_non_classees', collectivite_id]);
      queryClient.invalidateQueries(['structures', collectivite_id]);
      queryClient.invalidateQueries(['partenaires', collectivite_id]);
      queryClient.invalidateQueries(['personnes_pilotes', collectivite_id]);
      queryClient.invalidateQueries(['personnes', collectivite_id]);
      queryClient.invalidateQueries(['services_pilotes', collectivite_id]);
      queryClient.invalidateQueries(['personnes_referentes', collectivite_id]);
      queryClient.invalidateQueries(['financeurs', collectivite_id]);
    },
  });
};
