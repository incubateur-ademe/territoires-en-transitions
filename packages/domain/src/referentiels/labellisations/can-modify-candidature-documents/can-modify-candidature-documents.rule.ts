import { LabellisationAudit } from '../labellisation-audit.schema';

export function canModifyCandidatureDocuments({
  audit,
}: {
  audit: Pick<LabellisationAudit, 'valide'> | null;
}): boolean {
  if (audit === null) {
    return true;
  }
  return audit.valide === false;
}
