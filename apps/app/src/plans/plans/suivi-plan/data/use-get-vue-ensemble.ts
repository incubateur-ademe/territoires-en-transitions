import { useQuery } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';

export const useGetVueEnsemble = (
  input: RouterInput['plans']['suivi']['getVueEnsemble']
) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.plans.suivi.getVueEnsemble.queryOptions(input, { staleTime: 0 })
  );
};
