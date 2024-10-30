import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import { getAuthHeaders } from 'core-logic/api/auth/AuthProvider';

// By using `import type` you ensure that the reference will be stripped at compile-time, meaning you don't inadvertently import server-side code into your client.
// For more information, see the Typescript docs: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { AppRouter } from './../../../backend/src/trpc.router';
import { ENV } from 'environmentVariables';

const BASE_URL = `${ENV.backend_url}/trpc`;

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
