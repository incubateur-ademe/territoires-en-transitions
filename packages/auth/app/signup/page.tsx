'use client';

import { useRedirectTo } from '@tet/auth/components/Login/useRedirectTo';
import { SignupModal } from '@tet/auth/components/Signup';
import { useState } from 'react';
import { useCollectivites } from './useCollectivites';
import { useSignupState } from './useSignupState';

/**
 * Affiche la page de création de compte
 *
 * Après authentification, si les searchParams de l'url contiennent
 * `redirect_to`, l'utilisateur est redirigé sur la page voulue, et à défaut sur
 * l'app.
 */
const SignupPage = ({
  searchParams: { view = null, email = null, otp = null, redirect_to = '/' },
}: {
  searchParams: {
    view: string | null;
    email: string | null;
    otp: string | null;
    redirect_to: string;
  };
}) => {
  const [filter, setFilter] = useState('');
  const { data: collectivites } = useCollectivites(filter);

  const defaultValues = {
    email,
    otp,
  };

  const state = useSignupState({
    redirectTo: redirect_to,
    defaultView: view,
    defaultValues,
  });

  // redirige immédiatement si l'utilisateur est déjà connecté
  useRedirectTo(redirect_to);

  return (
    <SignupModal
      collectivites={collectivites || []}
      onFilterCollectivites={setFilter}
      defaultValues={defaultValues}
      {...state}
    />
  );
};

export default SignupPage;
