import 'server-only';

import { cache } from 'react';
import { createSupabaseServerClient } from './server-client';

// Mémoïsé par requête : plusieurs appelants (DAL, getUser…) partagent le même
// résultat sans rappeler supabaseClient.auth.getUser().
export const getAuthUser = cache(async () => {
  const supabaseClient = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  return user;
});
