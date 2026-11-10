import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useGetFaireAvancerLePlan = ({ planId }: { planId: number }) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.plans.suivi.getFaireAvancerLePlan.queryOptions(
      { planId },
      { staleTime: 0 }
    )
  );
};
