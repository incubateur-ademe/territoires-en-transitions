// modale floating-ui ne pouvant s'afficher que côté client...
'use client';

import {useSearchParams} from 'next/navigation';
import {LoginModal} from '@tet/ui';
import {useLoginState} from './useLoginState';
import {DEFAULT_REDIRECT} from '../constants';

/**
 * Affiche la page d'authentification
 *
 * Après authentification, si les searchParams de l'url contiennent
 * `redirect_to`, l'utilisateur est redirigé sur la page voulue, et à défaut sur
 * `DEFAULT_REDIRECT`.
 */
const LoginPage = () => {
  // détermine l'url vers laquelle rediriger après un login réussi
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect_to') || DEFAULT_REDIRECT;
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

  return <LoginModal defaultValues={defaultValues} {...state} />;
};

export default LoginPage;
