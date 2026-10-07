import { LabellisationAudit } from '../labellisation-audit.schema';

type Audit = Pick<LabellisationAudit, 'valide'>;

export type CandidatureDocumentsUpdate =
  | { canUpdate: true }
  | { canUpdate: false; reason: 'not_auditee' | 'frozen' };

function areCandidatureDocumentsFrozen({
  audit,
}: {
  audit: Audit | null;
}): boolean {
  return audit !== null && audit.valide;
}

export function canUpdateCandidatureDocuments({
  isAuditee,
  canMutateLabellisationDocuments,
  audit,
}: {
  isAuditee: boolean;
  canMutateLabellisationDocuments: boolean;
  audit: Audit | null;
}): CandidatureDocumentsUpdate {
  if (canMutateLabellisationDocuments) {
    return { canUpdate: true };
  }
  if (!isAuditee) {
    return { canUpdate: false, reason: 'not_auditee' };
  }
  if (areCandidatureDocumentsFrozen({ audit })) {
    return { canUpdate: false, reason: 'frozen' };
  }
  return { canUpdate: true };
}
