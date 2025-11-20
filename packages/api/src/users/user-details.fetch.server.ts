import 'server-only';

import { User } from '@supabase/supabase-js';
import { CollectiviteAccess } from '@tet/domain/users';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getAuthUser } from '../utils/supabase/auth-user.server';
import {
  getQueryClient,
  trpcInServerComponent,
} from '../utils/trpc/server-client';

export type DCP = {
  nom: string;
  prenom: string;
  telephone: string | null;
  email: string;
  cgu_acceptees_le: string | null;
};

export interface UserDetails extends Omit<User, 'email'>, DCP {
  // email: string;
  isSupport: boolean;
  collectivites: CollectiviteAccess[];
  isVerified: boolean;
}

export const getUser = cache(async () => {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/');
  }

  const userDetailsTrpc = await getQueryClient().fetchQuery(
    trpcInServerComponent.users.getDetails.queryOptions()
  );

  return {
    newEmail: authUser.new_email,
    ...userDetailsTrpc.user,
  };
});
