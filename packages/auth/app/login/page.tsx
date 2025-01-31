// modale floating-ui ne pouvant s'afficher que côté client...
'use client';

import { LoginModal } from '@/auth/components/Login';
import { use } from 'react';
import { useLoginState } from './useLoginState';

/**
 * Affiche la page d'authentification
 *
 * Après authentification, si les searchParams de l'url contiennent
 * `redirect_to`, l'utilisateur est redirigé sur la page voulue, et à défaut sur
 * l'app.
 */
const LoginPage = ({
  searchParams,
}: {
  searchParams: Promise<{
    view: string | null;
    email: string | null;
    otp: string | null;
    redirect_to: string;
  }>;
}) => {
  const {
    view = null,
    email = null,
    otp = null,
    redirect_to = '/',
  } = use(searchParams);

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
