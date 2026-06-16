import { LabellisationAudit } from '../labellisation-audit.schema';

export function canModifyLabellisationPreuves({
  audit,
}: {
  audit: Pick<LabellisationAudit, 'valide'> | null;
}): boolean {
  if (audit === null) {
    return true;
  }
  return audit.valide === false;
}
