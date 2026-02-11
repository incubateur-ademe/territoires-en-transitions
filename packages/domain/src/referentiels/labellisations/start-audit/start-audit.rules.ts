import { ParcoursLabellisation } from '../parcours-labellisation.schema';
import { StartAuditRulesErrors } from './start-audit.rules-errors';

export function canStartAudit(
  parcours: Pick<ParcoursLabellisation, 'status' | 'auditeurs'> | null,
  userId: string
):
  | {
      canRequest: false;
      reason: StartAuditRulesErrors;
    }
  | {
      canRequest: true;
      reason: null;
    } {
  if (!parcours) {
    return {
      canRequest: false,
      reason: 'AUDIT_NOT_FOUND',
    };
  }

  if (parcours.status !== 'demande_envoyee') {
    return {
      canRequest: false,
      reason: 'AUDIT_NOT_REQUESTED',
    };
  }

  if (!parcours.auditeurs.some((auditeur) => auditeur.userId === userId)) {
    return {
      canRequest: false,
      reason: 'USER_NOT_AUDITOR',
    };
  }

  return {
    canRequest: true,
    reason: null,
  };
}
