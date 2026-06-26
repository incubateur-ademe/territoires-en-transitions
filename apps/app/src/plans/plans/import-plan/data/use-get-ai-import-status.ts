import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

const POLLING_INTERVAL_MS = 2000;

export const useGetAiImportStatus = (jobId: string | null) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.plans.aiImport.getAiImportStatus.queryOptions({
      jobId: jobId ?? '',
    }),
    enabled: jobId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'done' || status === 'failed') {
        return false;
      }
      return POLLING_INTERVAL_MS;
    },
  });
};
