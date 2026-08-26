import { AuditTypeOption } from '../audit-type-options/audit-type-options.rules';
import { ParcoursLabellisation } from '../parcours-labellisation.schema';
import { ParcoursForAuditPrerequisites } from '../request-labellisation/request-labellisation.rules';
import { canStartNewAuditCycle } from '../start-new-audit-cycle/start-new-audit-cycle.rules';
import { StartNewAuditCycleRulesErrors } from '../start-new-audit-cycle/start-new-audit-cycle.rules-errors';

export type ParcoursForAuditRequest = Pick<
  ParcoursLabellisation,
  'status' | 'demande' | 'labellisation'
> &
  ParcoursForAuditPrerequisites;

export type AuditRequestUnavailableReason =
  | { kind: 'cycleUnavailable'; cause: StartNewAuditCycleRulesErrors }
  | { kind: 'noRequestableAuditType' }
  | { kind: 'prerequisitesIncomplete' };

export type AuditRequestAvailability =
  | { canRequest: true; reason: null }
  | { canRequest: false; reason: AuditRequestUnavailableReason };

export function getAuditRequestAvailability(
  parcours: ParcoursForAuditRequest,
  auditTypeOptions: readonly AuditTypeOption[]
): AuditRequestAvailability {
  const cycleAvailability = canStartNewAuditCycle(parcours);
  if (!cycleAvailability.canRequest) {
    return {
      canRequest: false,
      reason: { kind: 'cycleUnavailable', cause: cycleAvailability.reason },
    };
  }

  if (auditTypeOptions.length === 0) {
    return { canRequest: false, reason: { kind: 'noRequestableAuditType' } };
  }

  if (!auditTypeOptions.some((option) => option.isRequestable)) {
    return { canRequest: false, reason: { kind: 'prerequisitesIncomplete' } };
  }

  return { canRequest: true, reason: null };
}
