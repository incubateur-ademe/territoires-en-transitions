import { useTRPC } from '@/api/utils/trpc/client';
import { CompletionField } from '@/domain/plans';
import { useQuery } from '@tanstack/react-query';

export const useGetPlanCompletion = (planId: number): CompletionField[] => {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.plans.completionAnalytics.getFieldsToComplete.queryOptions({ planId })
  );
  return data ?? [];
};
