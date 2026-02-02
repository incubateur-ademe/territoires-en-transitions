import { ParcoursLabellisationStatus } from '../labellisations/parcours-labellisation-status.enum';
import { ActionScore } from './action-score.schema';
import { CanUpdateActionStatutRulesErrors } from './can-update-action-statut.rules-errors';

export function canUpdateActionStatutWithoutPermissionCheck({
  parcoursStatus,
  actions,
  isAuditeur,
}: {
  parcoursStatus?: ParcoursLabellisationStatus;
  actions: Pick<ActionScore, 'desactive' | 'actionId'>[];
  isAuditeur: boolean;
}):
  | {
      canUpdate: false;
      reason: CanUpdateActionStatutRulesErrors;
    }
  | {
      canUpdate: true;
      reason: null;
    } {
  if (actions.some((action) => action.desactive)) {
    return {
      canUpdate: false,
      reason: 'ACTION_DISABLED',
    };
  }

  if (parcoursStatus === 'audit_en_cours') {
    if (!isAuditeur) {
      return {
        canUpdate: false,
        reason: 'AUDIT_STARTED_BUT_NOT_AUDITEUR',
      };
    }
  }

  if (parcoursStatus === 'audit_valide') {
    return {
      canUpdate: false,
      reason: 'AUDIT_VALIDATED',
    };
  }

  return {
    canUpdate: true,
    reason: null,
  };
}
