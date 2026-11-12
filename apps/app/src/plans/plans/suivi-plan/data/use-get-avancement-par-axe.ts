import { useQuery } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';

export const useGetAvancementParAxe = (
  input: RouterInput['plans']['suivi']['getAvancementParAxe']
) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.plans.suivi.getAvancementParAxe.queryOptions(input, { staleTime: 0 })
  );
};
