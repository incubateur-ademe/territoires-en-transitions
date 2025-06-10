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
        staleTime: 30 * 1000,
        retry: (failureCount, error) => {
          if (error instanceof TRPCClientError) {
            if (UNRECOVERABLE_ERRORS.includes(error.data?.code)) {
              return false;
            }
          }
          return failureCount < 3;
        },
      },
      dehydrate: {
        // serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
      hydrate: {
        // deserializeData: superjson.deserialize,
      },
    },
  });
}
