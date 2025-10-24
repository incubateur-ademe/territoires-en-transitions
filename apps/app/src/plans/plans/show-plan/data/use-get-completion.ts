import { RouterOutput, useTRPC } from '@/api/utils/trpc/client';
import { useQuery } from '@tanstack/react-query';
type FieldToComplete =
  RouterOutput['plans']['completionAnalytics']['getFieldsToComplete'][number];

export const useGetPlanCompletion = (planId: number): FieldToComplete[] => {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.plans.completionAnalytics.getFieldsToComplete.queryOptions({ planId })
  );
  return data ?? [];
};
