import {
  canStartNewAuditCycle,
  ParcoursLabellisation,
  StartNewAuditCycleRulesErrors,
} from '@tet/domain/referentiels';
import { isPremiereEtoileDemandeEnCours } from '../premiere-etoile-demande-en-cours';
import { AuditBadgeStatus } from './types';

export type ParcoursForAuditBadge = Pick<
  ParcoursLabellisation,
  'status' | 'demande' | 'auditeurs' | 'labellisation'
>;

type Input = {
  parcours: ParcoursForAuditBadge | null;
  isAuditor: boolean;
};

const badgeStatusByUnavailabilityReason: Record<
  StartNewAuditCycleRulesErrors,
  AuditBadgeStatus | null
> = {
  AUDIT_REQUEST_PENDING: null,
  AUDIT_IN_PROGRESS: null,
  LABELLISATION_IN_PROGRESS: 'auditCompletedLabellisationInProgress',
};

const demandeEnvoyeeBadge = (
  parcours: ParcoursForAuditBadge,
  isAuditor: boolean
): AuditBadgeStatus | null => {
  if (isPremiereEtoileDemandeEnCours(parcours)) return null;
  if (!isAuditor) return 'auditRequested';
  return parcours.auditeurs.length >= 1 ? 'auditAssigned' : null;
};

const auditValideBadge = (
  parcours: ParcoursForAuditBadge,
  isAuditor: boolean
): AuditBadgeStatus | null => {
  if (isAuditor) return 'auditCompleted';

  const availability = canStartNewAuditCycle(parcours);
  if (availability.canRequest) return null;
  return badgeStatusByUnavailabilityReason[availability.reason];
};

export function parcoursToAuditBadgeStatus({
  parcours,
  isAuditor,
}: Input): AuditBadgeStatus | null {
  if (!parcours) return null;

  switch (parcours.status) {
    case 'non_demandee':
      return null;
    case 'demande_envoyee':
      return demandeEnvoyeeBadge(parcours, isAuditor);
    case 'audit_en_cours':
      return 'auditInProgress';
    case 'audit_valide':
      return auditValideBadge(parcours, isAuditor);
  }
}
