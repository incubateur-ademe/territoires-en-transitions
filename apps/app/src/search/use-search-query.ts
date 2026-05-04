'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import {
  FicheParentFilter,
  PlanParentFilter,
  SearchIndexName,
} from '@tet/domain/search';
import { useDebounce } from 'use-debounce';

export type UseSearchQueryInput = {
  query: string;
  collectiviteId: number | null | undefined;
  enabledIndexes: SearchIndexName[];
  exclusiveMode: boolean;
  ficheParentFilter: FicheParentFilter;
  planParentFilter: PlanParentFilter;
  /** Optional limit per bucket. Defaults to backend default (20). */
  limit?: number;
};

const DEBOUNCE_MS = 150;

/**
 * Wraps `trpc.search.query` with input debouncing. The debounced query string
 * becomes part of the react-query key, so older in-flight requests are cancelled
 * automatically (input-keyed query identity + AbortController on the fetch).
 *
 * The query is skipped when:
 *   - the debounced query is shorter than 1 char,
 *   - no collectivité is active,
 *   - no index is enabled.
 */
export function useSearchQuery(input: UseSearchQueryInput) {
  const trpc = useTRPC();

  const [debouncedQuery] = useDebounce(input.query, DEBOUNCE_MS);

  const trimmed = debouncedQuery.trim();
  const enabled =
    trimmed.length >= 1 &&
    !!input.collectiviteId &&
    input.enabledIndexes.length > 0;

  const queryOptions = trpc.search.query.queryOptions(
    {
      // When `enabled` is false the request is never fired, but we still need
      // a syntactically valid shape (the request schema enforces `min(1)`) to
      // build a stable queryKey.
      query: trimmed.length > 0 ? trimmed : '_',
      collectiviteId: input.collectiviteId ?? 1,
      enabledIndexes:
        input.enabledIndexes.length > 0 ? input.enabledIndexes : ['plans'],
      exclusiveMode: input.exclusiveMode,
      ficheParentFilter: input.ficheParentFilter,
      planParentFilter: input.planParentFilter,
      ...(input.limit ? { limit: input.limit } : {}),
    },
    {
      enabled,
      // Keep previous data on key change (typing) so the list doesn't blank
      // between debounced refetches.
      placeholderData: (previous) => previous,
      // Don't refetch on window focus while the modal stays mounted.
      refetchOnWindowFocus: false,
    }
  );

  const { data, isLoading, isFetching, error, refetch } = useQuery(queryOptions);

  return {
    /** Raw input as typed by the user (not debounced). */
    query: input.query,
    /** Debounced query actually sent to the backend. */
    debouncedQuery: trimmed,
    data,
    isLoading,
    isFetching,
    error: error ?? null,
    refetch,
    /** True only when the query would be sent (used to gate UI states). */
    enabled,
  };
}
