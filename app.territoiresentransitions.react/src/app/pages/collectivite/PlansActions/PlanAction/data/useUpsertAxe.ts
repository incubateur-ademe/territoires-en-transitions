import {supabaseClient} from 'core-logic/api/supabase';
import {useMutation, useQueryClient} from 'react-query';

import {useCollectiviteId} from 'core-logic/hooks/params';
import {useHistory} from 'react-router-dom';
import {makeCollectivitePlanActionUrl} from 'app/paths';
import {TAxeInsert} from 'types/alias';

/**
 * Upsert un axe pour une collectivité.
 * S'il n'a pas de parent, alors cela est considéré comme un nouveau plan
 */
export const upsertAxe = async (axe: TAxeInsert) => {
  let query = supabaseClient.from('axe').upsert(axe).select();

  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Crée un nouveau plan d'action pour une collectivité
 */
export const useCreatePlanAction = () => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();
  const history = useHistory();

  return useMutation({
    mutationFn: upsertAxe,
    meta: {disableToast: true},
    onSuccess: data => {
      queryClient.invalidateQueries(['plans_navigation', collectivite_id]);
      history.push(
        makeCollectivitePlanActionUrl({
          collectiviteId: collectivite_id!,
          planActionUid: data[0].id!.toString(),
        })
      );
    },
  });
};

/**
 * Ajoute un sous-axe à un axe
 */
export const useAddAxe = (parentId: number, planActionId: number) => {
  const queryClient = useQueryClient();
  const collectivite_id = useCollectiviteId();

  return useMutation(
    // Considéré comme un axe car on fourni un parent
    () =>
      upsertAxe({collectivite_id: collectivite_id!, parent: parentId} as never),
    {
      meta: {disableToast: true},
      onSuccess: data => {
        queryClient.invalidateQueries(['plan_action', planActionId]);
        queryClient.invalidateQueries(['plan_action', parentId]);
        queryClient.invalidateQueries(['plans_navigation', collectivite_id]);
      },
    }
  );
};
