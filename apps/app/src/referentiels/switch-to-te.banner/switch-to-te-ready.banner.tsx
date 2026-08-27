'use client';

import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import { ModeBannerAlert } from '../referentiel-mode/mode-banner-alert';
import { SwitchToTeInfoButton } from './switch-to-te-info.button';

export const SwitchToTeReadyBanner = ({
  onSwitchClick,
}: {
  onSwitchClick: () => void;
}) => {
  return (
    <ModeBannerAlert
      mode="readonly"
      title={appLabels.referentielTeModeReadonlyTitle}
      description={appLabels.referentielTeModeReadonlyDescription}
      state="info"
    >
      <SwitchToTeInfoButton />
      <Button size="sm" onClick={onSwitchClick}>
        {appLabels.switchToTe}
      </Button>
    </ModeBannerAlert>
  );
};
