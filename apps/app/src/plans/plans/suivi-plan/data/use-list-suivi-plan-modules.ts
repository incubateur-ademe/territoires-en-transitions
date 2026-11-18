import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useListSuiviPlanModules = ({ planId }: { planId: number }) => {
  const trpc = useTRPC();
  return useQuery(trpc.plans.suivi.listModules.queryOptions({ planId }));
};
