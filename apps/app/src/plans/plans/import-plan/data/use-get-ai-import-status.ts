import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';

const POLLING_INTERVAL_MS = 2000;

const INACCESSIBLE_ERROR_CODES = [
  'NOT_FOUND',
  'FORBIDDEN',
  'UNAUTHORIZED',
  'BAD_REQUEST',
];

export const isInaccessibleAiImportError = (error: unknown): boolean => {
  const code = (
    error as { data?: { code?: string | null } | null } | null | undefined
  )?.data?.code;
  return INACCESSIBLE_ERROR_CODES.includes(code ?? '');
};

export const useGetAiImportStatus = (jobId: string | null) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.plans.aiImport.getAiImportStatus.queryOptions({
      jobId: jobId ?? '',
    }),
    enabled: jobId !== null,
    retry: false,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'done' || status === 'failed') return false;
      if (query.state.error && isInaccessibleAiImportError(query.state.error))
        return false;
      return POLLING_INTERVAL_MS;
    },
  });
};
