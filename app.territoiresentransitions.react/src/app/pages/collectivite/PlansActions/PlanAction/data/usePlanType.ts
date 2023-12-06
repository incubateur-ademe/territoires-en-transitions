import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {PlanType} from './types';
import {useCollectiviteId} from 'core-logic/hooks/params';

const fetchPlanType = async ({
  collectivite_id,
  planId,
}: {
  collectivite_id: number;
  planId: number;
}) => {
  const query = supabaseClient
    .from('axe')
    .select('type:plan_action_type')
    .eq('collectivite_id', collectivite_id)
    .eq('id', planId)
    .returns<PlanType[]>();

  const {error, data} = await query;
  if (error) {
    throw new Error(error.message);
  }

  return data[0].type;
};

/** Renvoie le type complet d'un plan d'action */
export const usePlanType = (planId: number) => {
  const collectivite_id = useCollectiviteId();

  const {data} = useQuery(['plan_type', planId], () =>
    fetchPlanType({collectivite_id: collectivite_id!, planId})
  );

  return data;
};
