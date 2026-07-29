'use client';

import { signOutUser } from '@tet/api/utils/supabase/sign-out-user.server';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';

export function useLogout() {
  const router = useRouter();

  return async (event?: MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault();

    const { oidcLogoutUrl } = await signOutUser();

    if (oidcLogoutUrl) {
      // Navigation navigateur complète : l'URL est cross-origin (domaine
      // `api.*`), le router Next ne sait pas la suivre.
      window.location.href = oidcLogoutUrl;
      return;
    }

    router.push('/');
    router.refresh();
  };
}
