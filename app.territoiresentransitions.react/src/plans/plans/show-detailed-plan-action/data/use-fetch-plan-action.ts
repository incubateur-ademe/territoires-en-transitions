import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { fetchPlanAction } from '@/app/plans/plans/show-detailed-plan-action/data/fetch-plan-action';
import { useQuery } from 'react-query';
import { PlanNode } from '../../types';

export const usePlanAction = (
  planActionId: number,
  {
    initialData,
  }: {
    initialData: PlanNode[] | null;
  }
): PlanNode[] => {
  const supabase = useSupabase();

  const { data, error } = useQuery(
    ['flat_axes', planActionId],
    () => fetchPlanAction(supabase, planActionId),
    {
      initialData,
    }
  );
  return data ?? [];
};
