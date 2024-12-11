'use client';

import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  createTRPCQueryUtils,
  createTRPCReact,
  httpBatchLink,
} from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { useState } from 'react';
import { makeQueryClient } from './query-client';

// By using `import type` you ensure that the reference will be stripped at compile-time, meaning you don't inadvertently import server-side code into your client.
// For more information, see the Typescript docs: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { AppRouter } from '@/backend/trpc/trpc.router';
import { getAuthHeaders } from '../authTokens';

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

let queryClientSingleton: QueryClient;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (queryClientSingleton ??= makeQueryClient());
}

function getUrl() {
  return `${
    process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8080'
  }/trpc`;
}

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      // transformer: superjson, <-- if you use a data transformer
      url: getUrl(),
      async headers() {
        const authHeaders = await getAuthHeaders();
        return {
          ...(authHeaders ?? {}),
        };
      },
    }),
  ],
});

export const trpcUtils = createTRPCQueryUtils({
  queryClient: getQueryClient(),
  client: trpcClient,
});

export function TRPCProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>
) {
  // NOTE:
  // Avoid useState when initializing the query client if you don't
  // have a suspense boundary between this and the code that may
  // suspend because React will throw away the client on the initial
  // render if it suspends and there is no boundary
  const queryClient = getQueryClient();
  const [trpcClientState] = useState(trpcClient);
  return (
    <trpc.Provider client={trpcClientState} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
