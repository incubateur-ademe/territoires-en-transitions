import {
  AuditTypeOption,
  AuditTypeUnavailableReason,
} from '../audit-type-options/audit-type-options.rules';
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
  | { kind: 'auditTypeUnavailable'; cause: AuditTypeUnavailableReason };

type UnavailableAuditTypeOption = Extract<
  AuditTypeOption,
  { isRequestable: false }
>;

const isUnavailableAuditType = (
  option: AuditTypeOption
): option is UnavailableAuditTypeOption => !option.isRequestable;

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

  const hasRequestableAuditType = auditTypeOptions.some(
    (option) => option.isRequestable
  );
  const leastDemandingUnavailableType = auditTypeOptions.find(
    isUnavailableAuditType
  );

  if (hasRequestableAuditType || !leastDemandingUnavailableType) {
    return { canRequest: true, reason: null };
  }

  return {
    canRequest: false,
    reason: {
      kind: 'auditTypeUnavailable',
      cause: leastDemandingUnavailableType.reason,
    },
  };
}
