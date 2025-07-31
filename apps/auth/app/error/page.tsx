'use client';

import { Alert } from '@/ui';

const ErrorPage = () => {
  return (
    <Alert
      description="Une erreur est survenue. Veuillez contacter le support"
      title="Erreur"
      state="error"
      fullPageWidth
    />
  );
};

export default ErrorPage;
