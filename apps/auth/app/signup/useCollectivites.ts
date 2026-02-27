import { useQuery } from '@tanstack/react-query';
import { TRPCUseQueryResult, useTRPC } from '@tet/api';

export function useListCollectivites(
  nom?: string
): TRPCUseQueryResult<Array<{ id: number; nom: string }>> {
  const trpc = useTRPC();

  return useQuery(
    trpc.collectivites.collectivites.list.queryOptions({
      ...(nom && { text: nom }),
      limit: 15,
    })
  );
}
