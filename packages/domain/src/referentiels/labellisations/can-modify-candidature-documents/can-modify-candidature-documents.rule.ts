import { LabellisationAudit } from '../labellisation-audit.schema';

export function canModifyCandidatureDocuments({
  audit,
  canMutateLabellisationDocuments,
}: {
  audit: Pick<LabellisationAudit, 'valide'> | null;
  canMutateLabellisationDocuments: boolean;
}): boolean {
  if (canMutateLabellisationDocuments) {
    return true;
  }
  if (audit === null) {
    return true;
  }
  return audit.valide === false;
}
