import { NotificationTemplate } from '@tet/backend/utils/notifications/models/notification-template.dto';

export interface NotifyFichierInfecteProps extends NotificationTemplate {
  collectiviteNom: string;
  /** Un même contenu peut avoir été déposé sous plusieurs noms. */
  filenames: string[];
}
