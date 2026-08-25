'use client';

import { signOutUser } from '@tet/api/utils/supabase/sign-out-user.server';
import { Event, useEventTracker } from '@tet/ui';
import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';

export function useLogout() {
  const router = useRouter();
  const trackEvent = useEventTracker();

  return async (event?: MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault();

    const { oidcLogoutUrl } = await signOutUser();

    // Posé avant la navigation : PostHog vide sa file au `pagehide`.
    trackEvent(Event.auth.logout, {
      methode: oidcLogoutUrl ? 'oidc' : 'classique',
    });

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
