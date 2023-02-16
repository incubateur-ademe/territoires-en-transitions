import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {TPlanAction} from './types/PlanAction';

export const usePlanAction = (plan_id: number) => {
  return useQuery(['plan_action', plan_id], async () => {
    const {data} = await supabaseClient.rpc('plan_action', {id: plan_id});
    return data as unknown as TPlanAction;
  });
};
