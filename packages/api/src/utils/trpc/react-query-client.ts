import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';

const UNRECOVERABLE_ERRORS = [
  'UNAUTHORIZED',
  'UNPROCESSABLE_CONTENT',
  'BAD_GATEWAY',
  'NOT_FOUND',
  'BAD_REQUEST',
  'FORBIDDEN',
  'PAYLOAD_TOO_LARGE',
  'METHOD_NOT_SUPPORTED',
  'NOT_IMPLEMENTED',
];

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
        retry: (failureCount, error) => {
          console.error(error);
          if (error instanceof TRPCClientError) {
            if (UNRECOVERABLE_ERRORS.includes(error.data?.code)) {
              return false;
            }
            if (
              error.data?.code === 'UNAUTHORIZED' &&
              !error.message?.toLowerCase().includes('expired')
            ) {
              return false;
            }
          }
          return failureCount < 3;
        },
      },
      dehydrate: {
        // serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          // This will allow us to start prefetching in a server component high up the tree,
          // then consuming that promise in a client component further down
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
      hydrate: {
        // deserializeData: superjson.deserialize,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
