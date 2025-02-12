import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from 'react-query';
import { FlatAxe } from './types';
import { flatAxesToPlanNodes } from './utils';

export const usePlanAction = (axe_id: number) => {
  const supabase = useSupabase();
  return useQuery(['flat_axes', axe_id], async () => {
    const { data } = await supabase.rpc('flat_axes', { axe_id });
    const planNodes = data && flatAxesToPlanNodes(data as FlatAxe[]);
    return planNodes;
  });
};
