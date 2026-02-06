'use client'; // Error boundaries must be Client Components

import * as Sentry from '@sentry/nextjs';
import { getErrorMessage } from '@tet/domain/utils';
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
    // Log the error to an error reporting service
    if (error) {
      const scopeContext = new Sentry.Scope();
      scopeContext.setTag('crash_id', crashId);
      Sentry.captureException(error, scopeContext);
    }
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
