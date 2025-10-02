import { Mutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook that provides an abstraction for subscribing to QueryClient mutation cache
 * with built-in deduplication based on mutationKey + status to prevent duplicate callbacks
 */
export const useMutationCacheSubscriber = (
  callback: ({
    status,
    mutationKey,
    meta,
  }: {
    status: string;
    mutationKey: readonly unknown[] | undefined;
    meta?: Record<string, string | number | boolean>;
  }) => void
) => {
  const queryClient = useQueryClient();
  const processedMutationsRef = useRef(new Set<string>());

  const handleMutation = useCallback(
    (mutation?: Mutation) => {
      if (!mutation) {
        return;
      }
      const status = mutation?.state.status;
      const mutationKey = mutation?.options.mutationKey;
      const submittedAt = mutation?.state.submittedAt;

      // Create cache key from mutationKey + status
      const cacheKey = `${mutationKey}:${status}:${submittedAt}`;

      const cache = processedMutationsRef.current;

      // Skip if we've already processed this mutation with this status
      if (cache.has(cacheKey)) {
        return;
      }

      // Add to cache and execute callback
      cache.add(cacheKey);
      callback({ status, mutationKey });
    },
    [callback]
  );

  useEffect(() => {
    const unsubscribe = queryClient
      .getMutationCache()
      .subscribe(({ mutation }) => {
        handleMutation(mutation);
      });

    return () => {
      unsubscribe();
      // Clean up the cache on unmount
      processedMutationsRef.current.clear();
    };
  }, [handleMutation, queryClient]);
};
