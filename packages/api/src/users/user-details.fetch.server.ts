import 'server-only';

import { CurrentCollectivite } from '@/api/collectivites';
import { dcpFetch } from '@/api/users/dcp.fetch';
import { getAuthUser } from '@/api/utils/supabase/auth-user.server';
import { createClient } from '@/api/utils/supabase/server-client';
import { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import {
  getQueryClient,
  trpcInServerComponent,
} from '../utils/trpc/server-client';
import { fetchUserCollectivites } from './user-collectivites.fetch.server';

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
  collectivites: CurrentCollectivite[];
  isVerified: boolean;
}

export const fetchUserDetails = cache(
  async (user: User): Promise<UserDetails> => {
    const supabase = await createClient();

    const [dcp, { data: isSupport }, collectivites, { data: isVerified }] =
      await Promise.all([
        dcpFetch({ dbClient: supabase, user_id: user.id }),
        supabase.rpc('est_support'),
        fetchUserCollectivites(supabase),
        supabase.rpc('est_verifie'),
      ]);

    if (!dcp) {
      redirect('/');
    }

    return {
      ...user,
      ...dcp,
      isSupport: isSupport ?? false,
      isVerified: isVerified ?? false,
      collectivites,
    };
  }
);

export const getUser = cache(async () => {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/');
  }

  const userDetailsTrpc = await getQueryClient().fetchQuery(
    trpcInServerComponent.users.getDetails.queryOptions()
  );
  console.log(`userDetails trpc: ${JSON.stringify(userDetailsTrpc)}`);

  const userDetails = await fetchUserDetails(authUser);

  console.log(`userDetails: ${JSON.stringify(userDetails)}`);
  return userDetails;
});
