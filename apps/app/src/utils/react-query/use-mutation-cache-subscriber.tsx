import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useRef } from 'react';

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

  const notify = useEffectEvent(
    (args: {
      status: string;
      mutationKey: readonly unknown[] | undefined;
      meta?: Record<string, string | number | boolean>;
    }) => callback(args)
  );

  useEffect(() => {
    const unsubscribe = queryClient
      .getMutationCache()
      .subscribe(({ mutation }) => {
        if (!mutation) {
          return;
        }
        const status = mutation.state.status;
        const mutationKey = mutation.options.mutationKey;
        const meta = mutation.options.meta as
          | Record<string, string | number | boolean>
          | undefined;
        const submittedAt = mutation.state.submittedAt;

        // Clé de dédup : mutationKey + status + submittedAt (unique par
        // exécution de mutation). Empêche de rejouer le callback pour un même
        // status d'une même mutation, quel que soit le nombre d'événements que
        // le mutation cache émet ensuite pour elle.
        const cacheKey = `${mutationKey}:${status}:${submittedAt}`;
        const cache = processedMutationsRef.current;

        if (cache.has(cacheKey)) {
          return;
        }

        cache.add(cacheKey);
        notify({ status, mutationKey, meta });
      });

    return () => {
      unsubscribe();
      // Purge uniquement au démontage réel (deps stables) — plus à chaque rendu.
      processedMutationsRef.current.clear();
    };
  }, [queryClient]);
};
