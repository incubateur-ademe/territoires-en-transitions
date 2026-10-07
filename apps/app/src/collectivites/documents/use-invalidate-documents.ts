import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { queryKeysToInvalidate, type DocumentTarget } from './document-target';

type InvalidateDocuments = (...targets: DocumentTarget[]) => Promise<void>;

export const useInvalidateDocuments = (): InvalidateDocuments => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return async (...targets) => {
    const uniqueKeys = new Map(
      targets
        .flatMap((target) => queryKeysToInvalidate(trpc, target))
        .map((queryKey) => [JSON.stringify(queryKey), queryKey])
    );

    await Promise.all(
      [...uniqueKeys.values()].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey })
      )
    );
  };
};
