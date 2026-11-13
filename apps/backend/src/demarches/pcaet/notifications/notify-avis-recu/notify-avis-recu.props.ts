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
  /**
   * Renseigné quand le destinataire est un service en copie — la DREAL, la
   * DGEC — et non la collectivité : le message parle alors du projet *de* la
   * collectivité, et mène au dossier d'instruction du service.
   */
  copie: {
    collectiviteNom: string;
    /** Le service dont le destinataire est membre. */
    destinataireServiceNom: string;
  } | null;
  /**
   * Renseigné quand le destinataire administre un EPCI couvert par le dépôt
   * d'un Supra : le message nomme le porteur et mène au dépôt en lecture seule.
   */
  couverture: {
    porteurNom: string;
    collectiviteCouverteNom: string;
  } | null;
  /** Les documents de la démarche, ou le dossier d'instruction en copie. */
  url: string;
}
