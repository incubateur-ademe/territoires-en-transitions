import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useQuery } from '@tanstack/react-query';
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
  const { data } = useQuery({
    queryKey: ['flat_axes', planActionId],
    queryFn: () => fetchPlan(supabase, planActionId),
    initialData,
  });
  return data ?? [];
};
