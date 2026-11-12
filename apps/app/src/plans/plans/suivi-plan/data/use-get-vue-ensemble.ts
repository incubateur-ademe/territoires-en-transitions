import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useGetVueEnsemble = ({
  planId,
  thematiqueIds,
}: {
  planId: number;
  thematiqueIds: number[];
}) => {
  const trpc = useTRPC();
  return useQuery(
    trpc.plans.suivi.getVueEnsemble.queryOptions({ planId, thematiqueIds })
  );
};
