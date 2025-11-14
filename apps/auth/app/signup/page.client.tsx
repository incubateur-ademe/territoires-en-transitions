'use client';

import { SignupModal } from '../../components/Signup';
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
export const SignupPageClient = ({
  view,
  email,
  otp,
  redirect_to,
}: {
  view: string | null;
  email: string | null;
  otp: string | null;
  redirect_to: string;
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

  return (
    <SignupModal
      collectivites={collectivites || []}
      onFilterCollectivites={setFilter}
      defaultValues={defaultValues}
      {...state}
    />
  );
};
