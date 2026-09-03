import { AUDIT_REPORT_UPDATE_WINDOW_DAYS } from '../labellisation-audit.schema';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

type Audit = {
  clos: boolean;
  valide: boolean;
  dateFin: Date | string | null;
};

function isAuditeurUpdateWindowOpen(audit: Audit, now: Date): boolean {
  if (!audit.valide && !audit.clos) {
    return true;
  }
  if (audit.dateFin === null) {
    return false;
  }
  const editWindowStart =
    now.getTime() - AUDIT_REPORT_UPDATE_WINDOW_DAYS * DAY_IN_MS;
  return new Date(audit.dateFin).getTime() > editWindowStart;
}

export function canUpdateAuditReport({
  isAuditeur,
  canMutateLabellisationDocuments,
  audit,
  now,
}: {
  isAuditeur: boolean;
  canMutateLabellisationDocuments: boolean;
  audit: Audit | null;
  now: Date;
}): boolean {
  if (audit === null) {
    return false;
  }
  if (canMutateLabellisationDocuments) {
    return true;
  }
  return isAuditeur && isAuditeurUpdateWindowOpen(audit, now);
}
