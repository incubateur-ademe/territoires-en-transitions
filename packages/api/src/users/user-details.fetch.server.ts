import 'server-only';

import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getAuthUser } from '../utils/supabase/auth-user.server';
import {
  getQueryClient,
  trpcInServerComponent,
} from '../utils/trpc/trpc-server-client';

export const getUser = cache(async () => {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/');
  }

  const user = await getQueryClient().fetchQuery(
    trpcInServerComponent.users.users.get.queryOptions()
  );

  return {
    newEmail: authUser.new_email,
    ...user,
  };
});
