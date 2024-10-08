import { useQuery } from 'react-query';

import {
  planActionsFetch,
  WithSelect,
} from '@tet/api/plan-actions/plan-actions.list/data-access/plan-actions.fetch';
import { supabaseClient as dbClient } from 'core-logic/api/supabase';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { FetchOptions } from '@tet/api/plan-actions/plan-actions.list/domain/fetch-options.schema';

type Props = {
  options?: FetchOptions;
  withSelect?: WithSelect[];
};

/** Récupère uniquement les axes racines des plans d'action.
 * Ce hook ne donne pas les enfants de ces axes.
 */
export const usePlansActionsListe = ({ options, withSelect }: Props) => {
  const collectiviteId = useCollectiviteId();

  return useQuery(['plans_actions', collectiviteId!, options, withSelect], () =>
    planActionsFetch({
      dbClient,
      collectiviteId: collectiviteId!,
      options,
      withSelect,
    })
  );
};
