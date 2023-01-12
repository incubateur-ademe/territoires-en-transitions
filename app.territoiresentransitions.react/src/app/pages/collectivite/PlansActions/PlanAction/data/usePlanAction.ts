import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {TPlanAction} from './types/PlanAction';

type TFetchedData = {
  plan: TPlanAction;
};

const fetchPlanAction = async (plan_id: number): Promise<TFetchedData> => {
  const query = supabaseClient.rpc('plan_action', {id: plan_id});

  const {error, data} = await query;
  if (error) {
    throw new Error(error.message);
  }

  return {plan: data as unknown as TPlanAction};
};

export const usePlanAction = (plan_id: number) => {
  const {data} = useQuery(['plan_action', plan_id], () =>
    fetchPlanAction(plan_id)
  );

  return data;
};
