'use client';

import { getAuthPaths } from '@tet/api';
import { ENV } from '@tet/api/environmentVariables';
import { Button } from '@tet/ui';

export const CreateAccountButton = ({
  label = 'Créer un compte',
  redirectTo = ENV.app_url ?? '',
}: {
  label?: string;
  /** Où l'app renvoie l'utilisateur une fois son compte créé. */
  redirectTo?: string;
}) => {
  const authPaths = getAuthPaths(redirectTo);
  return <Button href={authPaths?.signUp}>{label}</Button>;
};
