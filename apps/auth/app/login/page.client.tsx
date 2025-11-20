// modale floating-ui ne pouvant s'afficher que côté client...
'use client';

import { useEffect } from 'react';
import { LoginModal } from '../../components/Login';
import { deleteOldAuthCookie } from './delete-old-auth-cookie.server';
import { useLoginState } from './useLoginState';

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
}: {
  view: string | null;
  email: string | null;
  otp: string | null;
  redirect_to: string;
}) => {
  const defaultValues = {
    email,
    otp,
  };

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
    />
  );
};
