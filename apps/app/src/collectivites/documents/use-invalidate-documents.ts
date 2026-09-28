import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { queryKeysToInvalidate, type DocumentTarget } from './document-target';

type InvalidateDocuments = (target: DocumentTarget) => Promise<void>;

export const useInvalidateDocuments = (): InvalidateDocuments => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return async (target) => {
    await Promise.all(
      queryKeysToInvalidate(trpc, target).map((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      )
    );
  };
};
