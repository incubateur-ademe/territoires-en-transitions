// modale floating-ui ne pouvant s'afficher que côté client...
'use client';

import {useSearchParams} from 'next/navigation';
import {getBaseUrlApp} from '@tet/api';
import {LoginModal} from '@tet/ui';
import {useLoginState} from './useLoginState';

/**
 * Affiche la page d'authentification
 *
 * Après authentification, si les searchParams de l'url contiennent
 * `redirect_to`, l'utilisateur est redirigé sur la page voulue, et à défaut sur
 * l'app.
 */
const LoginPage = () => {
  // détermine l'url vers laquelle rediriger après un login réussi
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect_to') || '/';
  const defaultView = searchParams.get('view');
  const defaultValues = {
    email: searchParams.get('email'),
    otp: searchParams.get('otp'),
  };

  const state = useLoginState({
    redirectTo,
    defaultView,
    defaultValues,
  });

  return (
    <LoginModal
      defaultValues={defaultValues}
      // TODO: intégrer crisp dans le site pour pouvoir le raccorder ici
      onOpenChatbox={() => {}}
      {...state}
    />
  );
};

export default LoginPage;
