import 'server-only';

import { TRPCClientError } from '@trpc/client';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getAuthUser } from '../utils/supabase/auth-user.server';
import {
  getQueryClient,
  trpcInServerComponent,
} from '../utils/trpc/trpc-server-client';

/**
 * Renvoie l'utilisateur complet (DCP + collectivités + rôles) ou `null` si :
 *  - aucune session active, ou
 *  - session active mais données personnelles (DCP) pas encore renseignées.
 *
 * Ne redirige pas : à utiliser dans la DAL pour décider du parcours
 * d'onboarding (voir `require-onboarded-user.server.ts`).
 *
 * Note : le service backend `users.users.get` fait un `innerJoin` sur la table
 * `dcp`, donc une session sans DCP renvoie une erreur `NOT_FOUND` que l'on
 * traduit ici en `null`.
 */
export const getUserOrNull = cache(async () => {
  const authUser = await getAuthUser();

  if (!authUser) {
    return null;
  }

  try {
    const user = await getQueryClient().fetchQuery(
      trpcInServerComponent.users.users.get.queryOptions()
    );

    return {
      newEmail: authUser.new_email,
      ...user,
    };
  } catch (error) {
    if (error instanceof TRPCClientError && error.data?.code === 'NOT_FOUND') {
      return null;
    }
    throw error;
  }
});

/**
 * Variante stricte : redirige vers `/` si l'utilisateur n'est pas authentifié
 * ou n'a pas de DCP. À utiliser dans les surfaces authentifiées où l'onboarding
 * est déjà garanti par la DAL en amont.
 */
export const getUser = cache(async () => {
  const user = await getUserOrNull();

  if (!user) {
    redirect('/');
  }

  return user;
});
