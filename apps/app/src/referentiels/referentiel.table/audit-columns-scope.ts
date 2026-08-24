import { ParcoursLabellisationStatus } from '@tet/domain/referentiels';

export type AuditColumnsScope = 'none' | 'statut' | 'all';

export function getAuditColumnsScope({
  parcoursStatus,
  isConductingAudit,
}: {
  parcoursStatus: ParcoursLabellisationStatus;
  isConductingAudit: boolean;
}): AuditColumnsScope {
  if (parcoursStatus !== 'audit_en_cours') {
    return 'none';
  }

  return isConductingAudit ? 'all' : 'statut';
}
