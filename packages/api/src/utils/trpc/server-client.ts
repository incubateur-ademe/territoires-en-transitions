import { getAuthHeaders } from '@/api/utils/supabase/get-auth-headers';
import { createClient } from '@/api/utils/supabase/server-client';
import type { AppRouter } from '@/domain/trpc-router';
import { createTRPCClient, httpLink } from '@trpc/client';

// renvoi un client utilisable dans les RSC et les server actions
export async function createServerClient() {
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  return createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: `${apiUrl}/trpc`,
        async headers() {
          const supabaseClient = await createClient();
          const {
            data: { session },
          } = await supabaseClient.auth.getSession();

          return getAuthHeaders(session);
        },
      }),
    ],
  });
}
