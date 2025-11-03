'use client'; // Error boundaries must be Client Components

import { reportException } from '@/api/utils/error-reporting';
import { EmptyCard } from '@/ui';
import { PictoWarning } from '@/ui/design-system/Picto/PictoWarning';
import { TRPCClientErrorLike } from '@trpc/client';
import { useEffect, useState } from 'react';

type Props = {
  error?: Error | TRPCClientErrorLike<any>;
  title: string;
  subTitle?: string;
  showCrashIdDescription?: boolean;
  reset?: () => void;
  resetLabel?: string;
};

export function ErrorCard({
  error,
  title,
  subTitle,
  showCrashIdDescription,
  reset,
  resetLabel,
}: Props) {
  const [crashId] = useState(crypto.randomUUID());

  useEffect(() => {
    reportException(error, crashId);
  }, [crashId, error]);

  return (
    <EmptyCard
      picto={(props) => <PictoWarning {...props} />}
      title={title}
      subTitle={subTitle}
      description={
        showCrashIdDescription && error
          ? `Dans l'optique de pouvoir régler ce problème technique et améliorer l'expérience pour tous nos utilisateurs, nous vous invitons à nous partager le message d'erreur ainsi que l'identifiant ${crashId} via le chat en bas à droite, ou par mail à contact@territoiresentransitions.fr`
          : undefined
      }
      actions={
        reset
          ? [
              {
                children: resetLabel ? resetLabel : 'Recharger la page',
                onClick: () => reset(),
                variant: 'outlined',
              },
            ]
          : undefined
      }
    />
  );
}
