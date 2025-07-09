'use client'; // Error boundaries must be Client Components

import { getErrorMessage } from '@/domain/utils';
import { PictoWarning } from '@/ui/design-system/Picto/PictoWarning';
import { datadogLogs } from '@datadog/browser-logs';
import * as Sentry from '@sentry/nextjs';
import { TRPCClientErrorLike } from '@trpc/client';
import classNames from 'classnames';
import { useEffect, useState } from 'react';

type Props = {
  error: Error | TRPCClientErrorLike<any>;
  title: string;
  subTitle?: string;
};

export function ErrorInfo({ error, title, subTitle }: Props) {
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
    <div className="grow flex flex-col justify-center text-center items-center">
      <div className="mb-4">
        <PictoWarning />
      </div>
      <h6 className="mb-2 text-primary-8">{title}</h6>
      <p className={classNames('mb-0', 'text-primary-9')}>
        {subTitle ||
          `Dans l'optique de pouvoir régler ce problème technique et améliorer l'expérience pour tous nos utilisateurs, nous vous invitons à nous partager le message d'erreur ainsi que l'identifiant ${crashId} via le chat en bas à droite, ou par mail à contact@territoiresentransitions.fr`}
      </p>
    </div>
  );
}
