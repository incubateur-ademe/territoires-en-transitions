import { skipToken, useQuery } from '@tanstack/react-query';
import { RouterOutput, TRPCUseQueryResult, useTRPC } from '@tet/api';

export type Axe = RouterOutput['plans']['axes']['get'];

export const useGetAxe = (
  axeId: number | undefined
): TRPCUseQueryResult<Axe> => {
  const trpc = useTRPC();
  return useQuery(
    trpc.plans.axes.get.queryOptions(
      axeId !== undefined ? { axeId } : skipToken
    )
  );
};
