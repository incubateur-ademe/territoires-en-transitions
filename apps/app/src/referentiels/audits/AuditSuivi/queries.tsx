import { MesureAuditStatutEnum } from '@tet/domain/referentiels';
import { ActionDetailed } from '../../use-snapshot';

// un sous-ensemble des champs pour alimenter notre table
export type TAuditSuiviRow = ActionDetailed & {
  statut: MesureAuditStatutEnum;
  ordreDuJour: boolean;
};
