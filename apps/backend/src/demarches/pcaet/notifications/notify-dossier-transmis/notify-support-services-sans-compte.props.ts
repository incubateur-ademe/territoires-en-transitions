import { NotificationTemplate } from '@tet/backend/utils/notifications/models/notification-template.dto';

export type ServiceSansCompte = {
  nom: string;
  saisiPourAvis: boolean;
};

export interface NotifySupportServicesSansCompteProps
  extends NotificationTemplate {
  collectiviteNom: string;
  demarcheTitre: string;
  services: ServiceSansCompte[];
}
