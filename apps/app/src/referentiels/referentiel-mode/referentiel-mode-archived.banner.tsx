import { appLabels } from '@/app/labels/catalog';
import { ModeBannerAlert } from './mode-banner-alert';

export const ReferentielModeArchivedBanner = () => (
  <ModeBannerAlert
    mode="archived"
    title={appLabels.referentielModeArchivedTitle}
    description={appLabels.referentielModeArchivedDescription}
    state="warning"
  />
);
