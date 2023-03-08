import {useHistory} from 'react-router-dom';
import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from 'app/paths';
import {FicheActionVueRow} from './types/ficheActionVue';

/** Upsert une fiche action pour une collectivité */
const upsertFicheAction = async (fiche: FicheActionVueRow) => {
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
          queryClient.invalidateQueries(['plan_action', args.planActionId]);
          history.push(
            makeCollectivitePlanActionFicheUrl({
              collectiviteId: collectivite_id!,
              ficheUid: data[0].id!.toString(),
              planActionUid: args.planActionId!.toString(),
            })
          );
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
    onSuccess: data => {
      queryClient.invalidateQueries(['fiches_non_classees', collectivite_id]);
      queryClient.invalidateQueries(['fiche_action', data[0].id!.toString()]);
      queryClient.invalidateQueries(['structures', collectivite_id]);
      queryClient.invalidateQueries(['partenaires', collectivite_id]);
      queryClient.invalidateQueries(['personnes_pilotes', collectivite_id]);
      queryClient.invalidateQueries(['services_pilotes', collectivite_id]);
      queryClient.invalidateQueries(['personnes_referentes', collectivite_id]);
      queryClient.invalidateQueries(['financeurs', collectivite_id]);
    },
  });
};
