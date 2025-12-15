import type { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import { createTRPCClient, httpBatchLink, TRPCClient } from '@trpc/client';

const baseApiURL = process.env.BASE_API_URL || 'http://localhost:8080';

/**
 * Crée un client tRPC avec un bearer token
 * @param bearerToken Le token d'authentification
 * @returns Le client tRPC configuré
 */
export function setupTrpcClient(bearerToken: string): TRPCClient<AppRouter> {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${baseApiURL}/trpc`,
        async headers() {
          return {
            authorization: `Bearer ${bearerToken}`,
          };
        },
      }),
    ],
  });
}
