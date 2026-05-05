import { useQuery } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';

export type CompletionField =
  RouterOutput['plans']['plans']['getPlanCompletion'][number];

export type CompletionFieldName = CompletionField['name'];

export const useGetPlanCompletion = (planId: number): CompletionField[] => {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.plans.plans.getPlanCompletion.queryOptions({ planId })
  );
  return data ?? [];
};
