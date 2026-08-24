'use client';

import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useReferentielTeEnabled } from '@/app/referentiels/use-referentiel-te-enabled';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Alert, Button } from '@tet/ui';
import { getReferentielModeBannerProps } from './get-referentiel-mode-banner-props';
import { useReferentielMode } from './use-referentiel-mode';
import { useSwitchToTe } from './use-switch-to-te';

export const ReferentielModeBanner = () => {
  const isReferentielTeEnabled = useReferentielTeEnabled();
  const referentielId = useReferentielId();
  const mode = useReferentielMode();

  const collectiviteId = useCollectiviteId();
  const {
    mutateAsync: switchToTe,
    error,
    isSuccess,
    isPending,
    isError,
  } = useSwitchToTe();

  if (!isReferentielTeEnabled || !mode) {
    return null;
  }

  const bannerProps = getReferentielModeBannerProps({
    referentielId,
    mode,
  });

  if (!bannerProps) {
    return null;
  }

  return (
    <div
      role="status"
      data-test="referentiels.mode-banner"
      data-referentiel-mode={mode}
    >
      <Alert
        className="mb-8"
        title={bannerProps.title}
        description={
          <div className="flex gap-2 text-sm">
            <p className="mb-0">{bannerProps.description}</p>
            <Button
              external
              variant="underlined"
              size="sm"
              href={bannerProps.link}
            >
              {bannerProps.linkLabel}
            </Button>
          </div>
        }
        state={bannerProps.state}
        footer={
          referentielId === 'te' &&
          mode === 'readonly' && (
            <>
              <Button
                size="sm"
                onClick={() => switchToTe({ collectiviteId })}
                disabled={isPending}
              >
                {'Basculer'}
              </Button>
              {isPending && <span>{'Bascule en cours'}</span>}
              {isSuccess && <span>{'Bascule terminée !'}</span>}
              {isError && <span>{error.message}</span>}
            </>
          )
        }
      />
    </div>
  );
};
