import { RouterOutput, useTRPC } from '@/api';
import { useQuery } from '@tanstack/react-query';

export type CompletionField =
  RouterOutput['plans']['completionAnalytics']['getFieldsToComplete'][number];

export type CompletionFieldName = CompletionField['name'];

export const useGetPlanCompletion = (planId: number): CompletionField[] => {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.plans.completionAnalytics.getFieldsToComplete.queryOptions({ planId })
  );
  return data ?? [];
};
