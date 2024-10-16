// By using `import type` you ensure that the reference will be stripped at compile-time, meaning you don't inadvertently import server-side code into your client.
// For more information, see the Typescript docs: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export
import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import type { AppRouter } from './../../../backend/src/trpc.router';
import { getAuthHeaders } from 'core-logic/api/auth/AuthProvider';

const BASE_URL = `${process.env.NX_PUBLIC_BACKEND_URL}/trpc`;

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: BASE_URL,
      async headers() {
        const authHeaders = await getAuthHeaders();
        return {
          ...(authHeaders ?? {}),
        };
      },
    }),
  ],
});
