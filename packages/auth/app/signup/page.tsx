'use client';

import { SignupModal } from '@/auth/components/Signup';
import { use, useState } from 'react';
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

export default SignupPage;
