import { LabellisationAudit } from './labellisation-audit.schema';

export function isAuditOpen(
  audit: Pick<LabellisationAudit, 'clos' | 'valide'>
): boolean {
  return !audit.clos && !audit.valide;
}
