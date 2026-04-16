import { appLabels } from '@/app/labels/catalog';
import { captureException } from '@/app/utils/sentry/sentry-client.lazy';
import { getErrorMessage } from '@tet/domain/utils';
import { TRPCClientErrorLike } from '@trpc/client';
import { useEffect, useState } from 'react';
import { ErrorCard } from './error.card';

export function ErrorPage({
  error,
  retry,
}: {
  error: (Error & { digest?: string }) | TRPCClientErrorLike<any>;
  retry: () => void;
}) {
  const [crashId] = useState(crypto.randomUUID());

  useEffect(() => {
    if (error) {
      captureException({ error, crashId });
    }
  }, [crashId, error]);

  return (
    <ErrorCard
      error={error}
      title={appLabels.erreurChargementPage}
      subTitle={`Erreur : ${getErrorMessage(error)}`}
      retry={retry}
      retryLabel={appLabels.rechargerPage}
      crashId={crashId}
    />
  );
}
