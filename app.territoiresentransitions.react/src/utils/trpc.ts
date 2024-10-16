// By using `import type` you ensure that the reference will be stripped at compile-time, meaning you don't inadvertently import server-side code into your client.
// For more information, see the Typescript docs: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export
import type { AppRouter } from './../../../backend/src/trpc.router';
import { createTRPCReact } from '@trpc/react-query';

export const trpc = createTRPCReact<AppRouter>();
