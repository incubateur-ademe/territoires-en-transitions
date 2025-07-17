import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { TPlanType } from '@/app/types/alias';
import { useQuery } from '@tanstack/react-query';
import { fetchPlanType } from './fetch-plan-type';

export const useGetPlanType = ({
  planId,
  collectiviteId,
  initialData,
}: {
  planId: number;
  collectiviteId: number;
  initialData: TPlanType | null;
}): TPlanType | null => {
  const supabase = useSupabase();
  const { data: planType } = useQuery({
    queryKey: ['plan_type', planId],
    queryFn: () => {
      return fetchPlanType(supabase, { planId, collectiviteId });
    },
    initialData,
  });
  return planType ?? null;
};
