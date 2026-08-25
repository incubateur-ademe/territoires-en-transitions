'use client';

import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { ModeBannerAlert } from './mode-banner-alert';
import { SwitchToTeInfoButton } from './switch-to-te-info.button';
import { useSwitchToTe } from './use-switch-to-te';

export const SwitchToTeReadyBanner = () => {
  const collectiviteId = useCollectiviteId();
  const {
    mutateAsync: switchToTe,
    error,
    isSuccess,
    isPending,
    isError,
  } = useSwitchToTe();

  return (
    <ModeBannerAlert
      mode="readonly"
      title={appLabels.referentielTeModeReadonlyTitle}
      description={appLabels.referentielTeModeReadonlyDescription}
      state="info"
    >
      <SwitchToTeInfoButton />
      <Button
        size="sm"
        onClick={() => switchToTe({ collectiviteId })}
        disabled={isPending}
      >
        {appLabels.switchToTe}
      </Button>
      {isPending && <span>{'Bascule en cours'}</span>}
      {isSuccess && <span>{'Bascule terminée !'}</span>}
      {isError && <span>{error.message}</span>}
    </ModeBannerAlert>
  );
};
