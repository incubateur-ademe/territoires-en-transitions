import 'server-only';

import { createClient } from '@/api/utils/supabase/server-client';

export async function getAuthUser() {
  const supabaseClient = await createClient();

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  return user;
}
