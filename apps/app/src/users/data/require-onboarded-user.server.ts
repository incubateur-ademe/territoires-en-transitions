import 'server-only';

import { getUserOrNull } from '@tet/api/users/user-details.fetch.server';
import { getAuthUser } from '@tet/api/utils/supabase/auth-user.server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { cache } from 'react';
import { signInPath, signUpPath } from '@/app/app/paths';

/**
 * Portail d'onboarding pour toutes les surfaces authentifiées. Redirige :
 *  - aucune session       → /login
 *  - session, sans DCP    → /signup?view=etape3 (profil à compléter)
 *
 * Renvoie sinon l'utilisateur complet (DCP + collectivités + rôles).
 * Mémoïsé via `cache()` : les layouts imbriqués qui l'appellent partagent le
 * même résultat sur une même requête (aucun fetch dupliqué).
 *
 * Remplace les redirections d'auth qui vivaient auparavant dans `proxy.ts`.
 */
export const requireOnboardedUser = cache(async () => {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect(signInPath);
  }

  const user = await getUserOrNull();

  // Session valide (authUser présent) mais pas de DCP → complétion du profil.
  if (!user) {
    const currentPath = (await headers()).get('x-current-path');
    const params = new URLSearchParams({ view: 'etape3' });
    if (currentPath) {
      params.set('redirect_to', currentPath);
    }
    redirect(`${signUpPath}?${params}`);
  }

  return user;
});
