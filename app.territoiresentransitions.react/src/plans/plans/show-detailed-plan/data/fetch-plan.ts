import { SupabaseClient } from '@supabase/supabase-js';
import { FlatAxe, PlanNode } from '../../types';
import { flatAxesToPlanNodes } from '../../utils';

export const fetchPlan = async (
  supabase: SupabaseClient,
  axe_id: number
): Promise<PlanNode[] | null> => {
  const { data, error } = await supabase.rpc('flat_axes', { axe_id });
  if (error || !data) {
    return null;
  }
  const planNodes = data && flatAxesToPlanNodes(data as FlatAxe[]);
  return planNodes;
};
