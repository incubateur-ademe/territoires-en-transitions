// modale floating-ui ne pouvant s'afficher que côté client...
'use client';

import {useSearchParams} from 'next/navigation';
import {LoginModal} from '@tet/ui';
import {useLoginState} from './useLoginState';

// redirection par défaut vers la home de l'app.
const DEFAULT_REDIRECT =
  process.env.NODE_ENV === 'production'
    ? 'https://app.territoiresentransitions.fr'
    : 'http://localhost:3000';

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

  const {onCancel, onSubmit, isLoading, error, view, setView} =
    useLoginState(redirectTo);

  return (
    <LoginModal
      isLoading={isLoading}
      error={error}
      view={view}
      setView={setView}
      onCancel={onCancel}
      onSubmit={onSubmit}
    />
  );
};

export default LoginPage;
