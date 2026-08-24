import { ParcoursLabellisationStatus } from '@tet/domain/referentiels';

export type AuditColumnsVisibility = 'none' | 'statut' | 'all';

export function getAuditColumnsVisibility({
  parcoursStatus,
  isConductingAudit,
}: {
  parcoursStatus: ParcoursLabellisationStatus;
  isConductingAudit: boolean;
}): AuditColumnsVisibility {
  if (parcoursStatus !== 'audit_en_cours') {
    return 'none';
  }

  return isConductingAudit ? 'all' : 'none';
}
