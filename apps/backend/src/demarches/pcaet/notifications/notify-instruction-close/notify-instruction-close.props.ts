import { NotificationTemplate } from '@tet/backend/utils/notifications/models/notification-template.dto';
import { DemarchePcaetTransitionEnum } from '@tet/domain/demarches';

export type MotifCloture =
  | typeof DemarchePcaetTransitionEnum.AVIS_TOUS_RENDUS
  | typeof DemarchePcaetTransitionEnum.DELAI_AVIS_ECHU;

export interface NotifyInstructionCloseProps extends NotificationTemplate {
  demarcheTitre: string;
  /**
   * Pourquoi l'instruction est close. Les deux cas ne demandent pas la même
   * chose à la collectivité : des avis à traiter, ou des services qui n'ont
   * pas répondu.
   */
  motif: MotifCloture;
  /**
   * Renseigné quand le destinataire est la DREAL en copie, et non la
   * collectivité : le message lui dit que la collectivité a été prévenue, et
   * mène à son dossier d'instruction.
   */
  copie: {
    collectiviteNom: string;
    /** Le service dont le destinataire est membre. */
    destinataireServiceNom: string;
  } | null;
  /** Les documents de la démarche, ou le dossier d'instruction en copie. */
  url: string;
}
