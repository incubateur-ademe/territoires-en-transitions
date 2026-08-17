import {
  Mutation,
  MutationCacheNotifyEvent,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Événements porteurs d'un changement d'état de la mutation. Les autres
 * (`observerOptionsUpdated`, `observerAdded`…) rejouent l'état courant : une
 * mutation réussie les émet à chaque rendu qui recrée ses options, ce qui
 * ferait resurgir son toast longtemps après coup.
 */
const STATE_CHANGE_EVENTS = ['added', 'updated'] satisfies ReadonlyArray<
  MutationCacheNotifyEvent['type']
>;

const isStateChange = (event: MutationCacheNotifyEvent): boolean =>
  (STATE_CHANGE_EVENTS as readonly string[]).includes(event.type);

/**
 * L'abonnement étant stable, le cache de déduplication n'est plus vidé par un
 * réabonnement. On borne sa taille pour éviter une croissance indéfinie.
 */
const MAX_PROCESSED_MUTATIONS = 500;

/** Code d'erreur interne renvoyé par l'API, à traduire côté app. */
const errorKeyOf = (error: unknown): string | undefined => {
  const data = (error as { data?: { errorKey?: unknown } } | null)?.data;
  return typeof data?.errorKey === 'string' ? data.errorKey : undefined;
};

/**
 * Hook that provides an abstraction for subscribing to QueryClient mutation cache
 * with built-in deduplication based on mutationKey + status to prevent duplicate callbacks
 */
export const useMutationCacheSubscriber = (
  callback: ({
    status,
    mutationKey,
    meta,
    errorKey,
  }: {
    status: string;
    mutationKey: readonly unknown[] | undefined;
    meta?: Record<string, string | number | boolean>;
    errorKey?: string;
  }) => void
) => {
  const queryClient = useQueryClient();
  const processedMutationsRef = useRef(new Set<string>());

  // Les appelants passent une closure recréée à chaque rendu : la garder dans
  // une ref évite de réabonner (et donc de vider le cache de déduplication)
  // à chaque fois.
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleMutation = useCallback((mutation?: Mutation) => {
    if (!mutation) {
      return;
    }
    const status = mutation?.state.status;
    const mutationKey = mutation?.options.mutationKey;
    const meta = mutation?.options.meta as
      | Record<string, string | number | boolean>
      | undefined;
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
    if (cache.size > MAX_PROCESSED_MUTATIONS) {
      const oldestKey = cache.values().next();
      if (!oldestKey.done) {
        cache.delete(oldestKey.value);
      }
    }
    callbackRef.current({
      status,
      mutationKey,
      meta,
      errorKey: errorKeyOf(mutation?.state.error),
    });
  }, []);

  useEffect(() => {
    const cache = processedMutationsRef.current;
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (isStateChange(event)) {
        handleMutation(event.mutation);
      }
    });

    return () => {
      unsubscribe();
      // Clean up the cache on unmount
      cache.clear();
    };
  }, [handleMutation, queryClient]);
};
