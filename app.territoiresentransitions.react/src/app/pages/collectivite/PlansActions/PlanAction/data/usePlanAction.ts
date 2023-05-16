import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {FlatAxe, PlanNode} from './types';
import {buildPlans} from './utils';

export const usePlanAction = (axe_id: number) => {
  return useQuery(['plan_action', axe_id], async () => {
    const {data} = await supabaseClient.rpc('flat_axes', {axe_id});
    return buildPlans(data as unknown as FlatAxe[])[0] as unknown as PlanNode;
  });
};
