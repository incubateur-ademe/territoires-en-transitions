import { NotificationTemplate } from '@tet/backend/utils/notifications/models/notification-template.dto';

export interface NotifyAvisRecuProps extends NotificationTemplate {
  demarcheTitre: string;
  /** Le service qui s'est prononcé. */
  serviceNom: string;
  /**
   * Le titre au nom duquel l'avis est rendu — « Préfet de région ». Nul pour un
   * avis dont le titre n'est pas renseigné.
   */
  auTitreDe: string | null;
  documentsUrl: string;
}
