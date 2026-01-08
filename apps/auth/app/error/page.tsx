'use client';

import { Alert } from '@tet/ui';

const ErrorPage = () => {
  return (
    <Alert
      description="Une erreur est survenue. Veuillez contacter le support"
      title="Erreur"
      state="error"
    />
  );
};

export default ErrorPage;
