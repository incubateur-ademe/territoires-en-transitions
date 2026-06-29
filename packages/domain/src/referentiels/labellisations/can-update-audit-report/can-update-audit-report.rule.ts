import { AUDIT_REPORT_UPDATE_WINDOW_DAYS } from '../labellisation-audit.schema';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function canUpdateAuditReport({
  isAuditeur,
  audit,
  now,
}: {
  isAuditeur: boolean;
  audit: { clos: boolean; valide: boolean; dateFin: Date | string | null } | null;
  now: Date;
}): boolean {
  if (audit === null || !isAuditeur) {
    return false;
  }
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
