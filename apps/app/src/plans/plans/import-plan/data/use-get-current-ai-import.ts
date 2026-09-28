import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useGetCurrentAiImport = (
  collectiviteId: number,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.plans.aiImport.getCurrentAiImport.queryOptions({ collectiviteId }),
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
  });
};
