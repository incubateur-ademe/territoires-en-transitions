import { appLabels } from '@/app/labels/catalog';
import { ModeBannerAlert } from '../referentiel-mode/mode-banner-alert';
import { SwitchToTeInfoButton } from './switch-to-te-info.button';

export const SwitchToTeUnauthorizedBanner = () => (
  <ModeBannerAlert
    mode="readonly"
    title={appLabels.referentielTeModeReadonlyTitle}
    description={appLabels.referentielTeModeUnauthorizedDescription}
    state="info"
  >
    <SwitchToTeInfoButton />
    <p className="mb-2">
      <strong>{appLabels.referentielTeModeUnauthorizedLabel}</strong>{' '}
      {appLabels.referentielTeModeUnauthorizedContact}
    </p>
  </ModeBannerAlert>
);
