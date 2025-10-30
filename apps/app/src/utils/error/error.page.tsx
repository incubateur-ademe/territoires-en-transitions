'use client'; // Error boundaries must be Client Components

import { reportException } from '@/api/utils/error-reporting';
import { getErrorMessage } from '@/domain/utils';
import { TRPCClientErrorLike } from '@trpc/client';
import { useEffect, useState } from 'react';
import { ErrorCard } from './error.card';

export function ErrorPage({
  error,
  reset,
}: {
  error: (Error & { digest?: string }) | TRPCClientErrorLike<any>;
  reset: () => void;
}) {
  const [crashId] = useState(crypto.randomUUID());

  useEffect(() => {
    reportException(error, crashId);
  }, [crashId, error]);

  return (
    <ErrorCard
      error={error}
      title="Erreur lors du chargement de la page !"
      subTitle={`Erreur : ${getErrorMessage(error)}`}
      reset={reset}
      resetLabel="Recharger la page"
      showCrashIdDescription={true}
    />
  );
}
