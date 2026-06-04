import { appLabels } from '@/app/labels/catalog';
import { StartNewAuditCycleRulesErrors } from '@tet/domain/referentiels';

const tooltipByReason: Record<StartNewAuditCycleRulesErrors, string> = {
  AUDIT_REQUEST_PENDING: appLabels.demandeAuditEnvoyeeTooltip,
  AUDIT_IN_PROGRESS: appLabels.demandeAuditEnCoursTooltip,
  LABELLISATION_IN_PROGRESS: appLabels.labellisationEnCoursTooltip,
};

export function getRequestAuditTooltip(
  reason: StartNewAuditCycleRulesErrors
): string {
  return tooltipByReason[reason];
}
