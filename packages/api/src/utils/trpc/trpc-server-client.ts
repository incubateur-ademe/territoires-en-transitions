import {
  createTRPCClient,
  httpLink,
  Operation,
  TRPCClient,
} from '@trpc/client';
import {
  createTRPCOptionsProxy,
  TRPCOptionsProxy,
} from '@trpc/tanstack-react-query';
import { cache } from 'react';
import { makeQueryClient } from './react-query-client';

import type { AppRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  getErrorMessage,
  supabaseUrlToAuthCookieName,
} from '@tet/domain/utils';
import { cookies } from 'next/headers';
import { ENV } from '../../environmentVariables';
import {
  getTrpcLoggerLink,
  getTrpcUrl,
  setCorrelationIdInContextAndGetHeader,
} from './trpc.utils';

function debugFetch(baseFetch: typeof fetch, label = 'tRPC') {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const correlationId = headers.get('x-correlation-id');

    let res: Response;
    try {
      res = await baseFetch(input, init);
    } catch (e) {
      console.error(
        `[${correlationId}] ${label} fetch failed: ${getErrorMessage(e)}`
      );
      throw e;
    }

    // If response is non-JSON or parse will fail, the body is what you need.
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) {
      const body = await res
        .clone()
        .text()
        .catch(() => '<failed to read body>');
      // TODO: to be removed once the problem has been fixed, risk to log sensitive data
      console.error(
        `[${correlationId}] ${label} non-JSON response ${res.status} ${res.statusText} with content type ${ct}`
      );
      console.error(
        `[${correlationId}] ${label} body (first 10000 chars):\n${body.slice(
          0,
          10000
        )}`
      );
    }

    return res;
  };
}

async function getSupabaseCookieHeader() {
  const cookieStore = await cookies();

  if (!ENV.supabase_url) {
    throw new Error('SUPABASE_URL is not defined');
  }

  const supabaseCookieName = supabaseUrlToAuthCookieName(ENV.supabase_url);

  const mainCookie = cookieStore.get(supabaseCookieName);

  if (mainCookie?.value) {
    return { Cookie: `${supabaseCookieName}=${mainCookie.value}` };
  }

  // Forward chunk cookies (name.0, name.1, name.2, ...) when JWT is chunked by @supabase/ssr
  const chunkParts: string[] = [];
  for (let i = 0; ; i++) {
    const chunk = cookieStore.get(`${supabaseCookieName}.${i}`);
    if (!chunk?.value) break;
    chunkParts.push(`${supabaseCookieName}.${i}=${chunk.value}`);
  }

  if (chunkParts.length === 0) {
    return {};
  }

  return { Cookie: chunkParts.join('; ') };
}

async function getTrpcHeaders({ op }: { op: Operation }) {
  const supabaseCookieHeader = await getSupabaseCookieHeader();
  const correlationIdHeader = setCorrelationIdInContextAndGetHeader({
    op,
  });

  return {
    ...supabaseCookieHeader,
    ...correlationIdHeader,
  };
}

const SERVER_HTTP_LINK = httpLink({
  url: getTrpcUrl(),
  headers: getTrpcHeaders,
  fetch: (url, options) => {
    return debugFetch(fetch)(url, options);
  },
});

// IMPORTANT: Create a stable getter for the query client that
// will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

// TRPC client utilisable dans les RSC avec le QueryClient
// ce qui permet de partager la data entre server et front,
// ou bien de faire du prefetching
export const trpcInServerComponent: TRPCOptionsProxy<AppRouter> =
  createTRPCOptionsProxy({
    client: createTRPCClient<AppRouter>({
      links: [getTrpcLoggerLink(), SERVER_HTTP_LINK],
    }),
    queryClient: getQueryClient,
  });

// TRPC client utilisable dans les server actions et les route handlers
export const trpcInServerFunction: TRPCClient<AppRouter> =
  createTRPCClient<AppRouter>({
    links: [getTrpcLoggerLink(), SERVER_HTTP_LINK],
  });
