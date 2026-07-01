'use client';

import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useReferentielTeEnabled } from '@/app/referentiels/use-referentiel-te-enabled';
import { Alert } from '@tet/ui';
import { getReferentielModeBannerProps } from './get-referentiel-mode-banner-props';
import { useReferentielMode } from './use-referentiel-mode';

export const ReferentielModeBanner = () => {
  const isReferentielTeEnabled = useReferentielTeEnabled();
  const referentielId = useReferentielId();
  const mode = useReferentielMode();

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
        description={bannerProps.description}
        state={bannerProps.state}
      />
    </div>
  );
};
