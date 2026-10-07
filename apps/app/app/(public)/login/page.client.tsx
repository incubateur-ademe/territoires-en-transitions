// modale floating-ui ne pouvant s'afficher que côté client...
'use client';

import { LoginModal } from '@/app/users/authentications/login-user/login-modal';
import { deleteOldAuthCookie } from '@/app/users/authentications/login-user/delete-old-auth-cookie.server';
import { useLoginState } from '@/app/users/authentications/login-user/use-login-state';
import { Event, useEventTracker } from '@tet/ui';
import { useEffect } from 'react';

/**
 * Affiche la page d'authentification
 *
 * Après authentification, si les searchParams de l'url contiennent
 * `redirect_to`, l'utilisateur est redirigé sur la page voulue, et à défaut sur
 * l'app.
 */
export const LoginPageClient = ({
  view = null,
  email = null,
  otp = null,
  redirect_to = '/',
  erreur = null,
}: {
  view: string | null;
  email: string | null;
  otp: string | null;
  redirect_to: string;
  erreur?: string | null;
}) => {
  const defaultValues = {
    email,
    otp,
  };

  const trackEvent = useEventTracker();

  // Les parcours OIDC en échec retombent ici avec `?erreur=<code>` : c'est la
  // seule trace de ces abandons, l'écran ne les affiche pas.
  useEffect(() => {
    if (erreur) {
      trackEvent(Event.auth.oidc.error, {
        erreurType: erreur,
        etape: 'connexion',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erreur]);

  const state = useLoginState({
    redirectTo: redirect_to,
    defaultView: view,
    defaultValues,
  });

  useEffect(() => {
    async function callServerFunction() {
      await deleteOldAuthCookie();
    }

    if (view === null) {
      callServerFunction();
    }
  }, [view]);

  return (
    <LoginModal
      defaultValues={defaultValues}
      // TODO: intégrer crisp dans le package pour pouvoir le raccorder ici
      //onOpenChatbox={() => {}}
      {...state}
      redirectTo={redirect_to}
    />
  );
};
