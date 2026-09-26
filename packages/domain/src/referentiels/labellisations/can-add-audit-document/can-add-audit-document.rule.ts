import { isAuditOpen } from '../is-audit-open.rule';
import { LabellisationAudit } from '../labellisation-audit.schema';

type Audit = Pick<LabellisationAudit, 'clos' | 'valide'>;

export function canAddAuditDocument({
  canMutateLabellisationDocuments,
  audit,
}: {
  canMutateLabellisationDocuments: boolean;
  audit: Audit;
}): boolean {
  if (canMutateLabellisationDocuments) {
    return true;
  }
  return isAuditOpen(audit);
}
