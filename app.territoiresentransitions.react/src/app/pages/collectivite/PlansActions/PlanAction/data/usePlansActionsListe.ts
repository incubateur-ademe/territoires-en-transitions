import {useQuery} from 'react-query';

import {planActionsFetch} from '@tet/api/dist/src/fiche_actions/plan_actions.list/data_access/plan_actions.fetch';
import {supabaseClient} from 'core-logic/api/supabase';

/** Récupère uniquement les axes racines des plans d'action.
 * Ce hook ne donne pas les enfants de ces axes.
 */
export const usePlansActionsListe = (collectiviteId: number) => {
  const {data} = useQuery(['plans_actions', collectiviteId], () =>
    planActionsFetch({
      dbClient: supabaseClient,
      collectiviteId,
    })
  );

  return data;
};
