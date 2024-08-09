// modale floating-ui ne pouvant s'afficher que côté client...
'use client';

import { LoginModal } from '@tet/auth/components/Login';
import { useRedirectTo } from '@tet/auth/components/Login/useRedirectTo';
import { useLoginState } from './useLoginState';

/**
 * Affiche la page d'authentification
 *
 * Après authentification, si les searchParams de l'url contiennent
 * `redirect_to`, l'utilisateur est redirigé sur la page voulue, et à défaut sur
 * l'app.
 */
const LoginPage = ({
  searchParams: { view = null, email = null, otp = null, redirect_to = '/' },
}: {
  searchParams: {
    view: string | null;
    email: string | null;
    otp: string | null;
    redirect_to: string;
  };
}) => {
  // redirige immédiatement si l'utilisateur est déjà connecté
  useRedirectTo(redirect_to);

  const defaultValues = {
    email,
    otp,
  };

  const state = useLoginState({
    redirectTo: redirect_to,
    defaultView: view,
    defaultValues,
  });

  return (
    <LoginModal
      defaultValues={defaultValues}
      // TODO: intégrer crisp dans le package pour pouvoir le raccorder ici
      //onOpenChatbox={() => {}}
      {...state}
    />
  );
};

export default LoginPage;
