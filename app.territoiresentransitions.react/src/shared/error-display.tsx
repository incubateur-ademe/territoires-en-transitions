'use client';

import { getErrorMessage } from '@/domain/utils';
import { EmptyCard } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import { PictoWarning } from '@/ui/design-system/Picto/PictoWarning';
import * as Sentry from '@sentry/nextjs';
import { FallbackProps } from 'react-error-boundary';

export const getErrorDisplayComponent = ({
  error,
  resetErrorBoundary,
}: FallbackProps) => {
  const crashId = crypto.randomUUID();
  if (error) {
    const scopeContext = new Sentry.Scope();
    scopeContext.setTag('crash_id', crashId);
    console.error(`Reporting error to Sentry: ${getErrorMessage(error)}`);
    Sentry.captureException(error, scopeContext);
  }

  return (
    <PageContainer>
      <EmptyCard
        picto={(props) => <PictoWarning {...props} />}
        title="Erreur lors du chargement de la page !"
        subTitle={`Erreur : ${getErrorMessage(error)}`}
        description={`Dans l'optique de pouvoir régler ce problème technique et améliorer l'expérience pour tous nos utilisateurs, nous vous invitons à nous partager le message d'erreur ainsi que l'identifiant ${crashId} via le chat en bas à droite, ou par mail à contact@territoiresentransitions.fr`}
        actions={[
          {
            children: 'Recharger la page',
            onClick: () => resetErrorBoundary(),
            variant: 'outlined',
          },
        ]}
      ></EmptyCard>
    </PageContainer>
  );
};
