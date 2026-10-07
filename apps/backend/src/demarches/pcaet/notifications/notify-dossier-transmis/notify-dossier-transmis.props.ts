import { NotificationTemplate } from '@tet/backend/utils/notifications/models/notification-template.dto';

export interface NotifyDossierTransmisProps extends NotificationTemplate {
  /** La collectivité qui dépose son PCAET. */
  collectiviteNom: string;
  /** Le service destinataire, dont le lecteur est membre. */
  serviceNom: string;
  /**
   * Vrai quand ce service est saisi pour avis, faux quand le dossier ne lui est
   * communiqué que pour information.
   */
  saisiPourAvis: boolean;
  /**
   * Pourquoi ce service ne se prononce pas — deux raisons distinctes, qui ne se
   * disent pas de la même façon :
   *
   * - `territoire` : il n'est atteint que par un territoire secondaire de la
   *   déposante, et l'avis revient au service du siège ;
   * - `famille` : sa famille ne rend jamais d'avis sur un PCAET, quel que soit
   *   le territoire — une DDT, une DR ADEME.
   *
   * Nul quand le service est saisi pour avis.
   */
  motifLecture: 'territoire' | 'famille' | null;
  /** L'échéance de remise des avis, déjà formatée. Nulle si non figée. */
  echeanceAvis: string | null;
  dossierUrl: string;
}
