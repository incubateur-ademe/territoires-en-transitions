import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from 'react-query';
import { PlanNode } from '../../types';
import { fetchPlan } from './fetch-plan';
export const useFetchPlan = (
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
    () => fetchPlan(supabase, planActionId),
    {
      initialData,
    }
  );
  return data ?? [];
};
