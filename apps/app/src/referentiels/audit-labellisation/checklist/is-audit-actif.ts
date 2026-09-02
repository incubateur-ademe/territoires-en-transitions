import { ParcoursLabellisation } from '@tet/domain/referentiels';

export type CycleForAuditActif = {
  parcours: Pick<ParcoursLabellisation, 'status' | 'audit'> | null;
};

export function isAuditActif(cycle: CycleForAuditActif): boolean {
  const { parcours } = cycle;
  if (!parcours) return false;
  return parcours.status === 'audit_en_cours' && parcours.audit !== null;
}
