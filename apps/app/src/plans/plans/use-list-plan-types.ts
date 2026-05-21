import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { planTypesToOptions } from './plan-types-to-options';

export const useListPlanTypes = () => {
  const trpc = useTRPC();
  const { data = [], isLoading } = useQuery(
    trpc.plans.plans.listTypes.queryOptions()
  );

  return { data, options: planTypesToOptions(data), isLoading };
};
