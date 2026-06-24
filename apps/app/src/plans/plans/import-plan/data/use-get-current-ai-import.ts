import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

export const useGetCurrentAiImport = (collectiviteId: number) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.plans.aiImport.getCurrentAiImport.queryOptions({ collectiviteId }),
    staleTime: 0,
    refetchOnMount: 'always',
  });
};
