import { ActionReferentiel } from '../../DEPRECATED_scores.types';
import { TAuditStatut } from '../types';

// un sous-ensemble des champs pour alimenter notre table
export type TAuditSuiviRow = ActionReferentiel & {
  action_id: string;
  statut: TAuditStatut;
  ordreDuJour: boolean;
};
