'use client';

import { getAuthPaths } from '@tet/api';
import { ENV } from '@tet/api/environmentVariables';
import { Button } from '@tet/ui';

export const CreateAccountButton = ({
  label = 'Créer un compte',
}: {
  label?: string;
}) => {
  const authPaths = getAuthPaths(ENV.app_url ?? '');
  return <Button href={authPaths?.signUp}>{label}</Button>;
};
