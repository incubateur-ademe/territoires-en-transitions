import { useQuery } from '@tanstack/react-query';
import { RouterInput, useTRPC } from '@tet/api';

export const useGetIndicateursObjectifs = (
  input: RouterInput['plans']['suivi']['getIndicateursObjectifs']
) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.plans.suivi.getIndicateursObjectifs.queryOptions(input, {
      staleTime: 0,
    })
  );
};
