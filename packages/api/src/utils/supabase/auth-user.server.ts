import 'server-only';

import { createSupabaseServerClient } from './server-client';

export async function getAuthUser() {
  const supabaseClient = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  return user;
}
