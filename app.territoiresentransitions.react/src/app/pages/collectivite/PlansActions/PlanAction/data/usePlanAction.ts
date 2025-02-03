import { useQuery } from 'react-query';

import { supabaseClient } from '@/api/utils/supabase/browser-client';
import { FlatAxe } from './types';
import { flatAxesToPlanNodes } from './utils';

export const usePlanAction = (axe_id: number) => {
  return useQuery(['flat_axes', axe_id], async () => {
    const { data } = await supabaseClient.rpc('flat_axes', { axe_id });
    const planNodes = data && flatAxesToPlanNodes(data as FlatAxe[]);
    return planNodes;
  });
};
