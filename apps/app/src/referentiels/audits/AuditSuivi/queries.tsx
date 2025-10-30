import { MesureAuditStatutEnum } from '@/domain/referentiels';
import { ActionReferentiel } from '../../DEPRECATED_scores.types';

// un sous-ensemble des champs pour alimenter notre table
export type TAuditSuiviRow = ActionReferentiel & {
  action_id: string;
  statut: MesureAuditStatutEnum;
  ordreDuJour: boolean;
};
