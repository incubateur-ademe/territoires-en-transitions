import { appLabels } from '@/app/labels/catalog';
import { ModeBannerAlert } from './mode-banner-alert';

export const ReferentielModeReadonlyBanner = () => (
  <ModeBannerAlert
    mode="readonly"
    title={appLabels.referentielModeReadonlyTitle}
    description={appLabels.referentielModeReadonlydDescription}
    state="info"
  />
);
