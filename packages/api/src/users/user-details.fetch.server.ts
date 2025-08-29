import 'server-only';

import { MaCollectivite } from '@/api';
import { dcpFetch } from '@/api/users/dcp.fetch';
import { createClient } from '@/api/utils/supabase/server-client';
import { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { fetchUserCollectivites } from './user-collectivites.fetch.server';

export type DCP = {
  nom: string;
  prenom: string;
  cgu_acceptees_le: string | null;
};

export interface UserDetails extends User, DCP {
  isSupport: boolean;
  collectivites: MaCollectivite[];
  isVerified: boolean;
}

export async function fetchUserDetails(user: User): Promise<UserDetails> {
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
    collectivites,
    isVerified: isVerified ?? false,
  };
}
