import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useListInstanceGouvernanceTags = (collectiviteId: number) => {
  const trpc = useTRPC();
  const result = useQuery(
    trpc.collectivites.tags.instanceGouvernance.list.queryOptions({
      collectiviteId,
    })
  );
  return {
    instanceGouvernanceTags: result.data ?? [],
    isLoading: result.isLoading,
    isError: result.isError,
  };
};
