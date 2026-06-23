import { Icon } from '@tet/ui';
import { JSX } from 'react';
import {
  DREAL_NOTIFICATION_ICON,
  type DrealNotificationTone,
} from '../vue-dreal.mock';

/**
 * Featured-icon : icône DS dans une pastille ronde colorée.
 * @tet/ui n'expose pas de composant FeaturedIcon → composition maison alignée
 * sur les teintes des badges/alerts TET.
 * ⚠️ Charte TET : pour les couleurs sémantiques (info/success), l'échelle est
 * INVERSÉE — `*-1` = teinte forte, `*-2` = fond clair (cf. Badge/Alert DS).
 */
const TONE_CLASSES: Record<DrealNotificationTone, string> = {
  transmis: 'bg-info-2 text-info-1',
  adopte: 'bg-success-2 text-success-1',
  document: 'bg-primary-2 text-primary-7',
  archive: 'bg-grey-2 text-grey-7',
};

export const DrealFeaturedIcon = ({
  tone,
}: {
  tone: DrealNotificationTone;
}): JSX.Element => (
  <div
    className={`flex-none flex items-center justify-center w-9 h-9 rounded-full ${TONE_CLASSES[tone]}`}
  >
    <Icon icon={DREAL_NOTIFICATION_ICON[tone]} size="sm" />
  </div>
);
