import 'server-only';

import { MaCollectivite } from '@/api';
import { dcpFetch } from '@/api/users/dcp.fetch';
import { getAuthUser } from '@/api/utils/supabase/auth-user.server';
import { createClient } from '@/api/utils/supabase/server-client';
import { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
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
  collectivites: MaCollectivite[];
}

export async function fetchUserDetails(user: User): Promise<UserDetails> {
  const supabase = await createClient();

  const [dcp, { data: isSupport }, collectivites] = await Promise.all([
    dcpFetch({ dbClient: supabase, user_id: user.id }),
    supabase.rpc('est_support'),
    fetchUserCollectivites(supabase),
  ]);

  if (!dcp) {
    redirect('/');
  }

  return {
    ...user,
    ...dcp,
    isSupport: isSupport ?? false,
    collectivites,
  };
}

export async function getUser() {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect('/');
  }

  const user = await fetchUserDetails(authUser);

  return user;
}
