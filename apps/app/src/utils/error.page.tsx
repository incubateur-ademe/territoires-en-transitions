'use client'; // Error boundaries must be Client Components

import { getErrorMessage } from '@/domain/utils';
import { EmptyCard } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import { PictoWarning } from '@/ui/design-system/Picto/PictoWarning';
import { datadogLogs } from '@datadog/browser-logs';
import * as Sentry from '@sentry/nextjs';
import { TRPCClientErrorLike } from '@trpc/client';
import { useEffect, useState } from 'react';

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
      datadogLogs.logger.error(
        `Reporting error to Sentry: ${getErrorMessage(error)}`
      );
      Sentry.captureException(error, scopeContext);
    }
  }, [crashId, error]);

  return (
    <PageContainer containerClassName="grow flex flex-col justify-center">
      <EmptyCard
        picto={(props) => <PictoWarning {...props} />}
        title="Erreur lors du chargement de la page !"
        subTitle={`Erreur : ${getErrorMessage(error)}`}
        description={`Dans l'optique de pouvoir régler ce problème technique et améliorer l'expérience pour tous nos utilisateurs, nous vous invitons à nous partager le message d'erreur ainsi que l'identifiant ${crashId} via le chat en bas à droite, ou par mail à contact@territoiresentransitions.fr`}
        actions={
          reset
            ? [
                {
                  children: 'Recharger la page',
                  onClick: () => reset(),
                  variant: 'outlined',
                },
              ]
            : undefined
        }
      />
    </PageContainer>
  );
}
