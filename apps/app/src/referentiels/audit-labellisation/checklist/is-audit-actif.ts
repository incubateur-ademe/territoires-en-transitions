import { TCycleLabellisation } from '@/app/referentiels/labellisations/useCycleLabellisation';

export function isAuditActif(cycle: TCycleLabellisation): boolean {
  const { parcours } = cycle;
  if (!parcours) return false;
  return parcours.status === 'audit_en_cours' && parcours.audit !== null;
}
