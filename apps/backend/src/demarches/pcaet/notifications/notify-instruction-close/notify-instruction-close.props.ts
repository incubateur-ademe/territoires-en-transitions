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
  documentsUrl: string;
}
