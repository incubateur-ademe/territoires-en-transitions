import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useListInstanceGouvernanceTags = (
  collectiviteId: number,
  collectiviteIds?: number[]
) => {
  const trpc = useTRPC();

  const input = collectiviteIds
    ? { collectiviteIds }
    : { collectiviteId };

  const result = useQuery(
    trpc.collectivites.tags.instanceGouvernance.list.queryOptions(input)
  );

  return {
    instanceGouvernanceTags: result.data ?? [],
    isLoading: result.isLoading,
    isError: result.isError,
  };
};
