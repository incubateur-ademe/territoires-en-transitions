import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useGetAvancementParAxe = ({
  planId,
  thematiqueIds,
}: {
  planId: number;
  thematiqueIds: number[];
}) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.plans.suivi.getAvancementParAxe.queryOptions(
      { planId, thematiqueIds },
      { staleTime: 0 }
    )
  );
};
