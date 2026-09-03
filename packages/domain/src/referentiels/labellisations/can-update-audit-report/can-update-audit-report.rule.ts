import { match } from 'ts-pattern';
import { AUDIT_REPORT_UPDATE_WINDOW_DAYS } from '../labellisation-audit.schema';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type AuditReportEditor = 'auditeur' | 'tiers';

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
  editor,
  audit,
  now,
}: {
  editor: AuditReportEditor;
  audit: Audit | null;
  now: Date;
}): boolean {
  if (audit === null) {
    return false;
  }
  return match(editor)
    .with('auditeur', () => isAuditeurUpdateWindowOpen(audit, now))
    .with('tiers', () => false)
    .exhaustive();
}
