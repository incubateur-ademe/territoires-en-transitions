import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {FlatAxe, PlanNode} from './types';
import {buildPlans} from './utils';

export const usePlansNavigation = () => {
  const collectivite_id = useCollectiviteId();

  return useQuery(['plans_navigation', collectivite_id], async () => {
    const {data} = await supabaseClient.rpc('navigation_plans', {
      collectivite_id: collectivite_id!,
    });
    return buildPlans(data as unknown as FlatAxe[]) as unknown as PlanNode[];
  });
};
