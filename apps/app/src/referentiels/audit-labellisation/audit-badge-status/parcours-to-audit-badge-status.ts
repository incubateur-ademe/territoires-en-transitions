import {
  canStartNewAuditCycle,
  ParcoursLabellisation,
  StartNewAuditCycleRulesErrors,
} from '@tet/domain/referentiels';
import { isPremiereEtoileDemandeEnCours } from '../premiere-etoile-demande-en-cours';
import { AuditBadgeStatus } from './types';

type Input = {
  parcours: ParcoursLabellisation | null;
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

export function parcoursToAuditBadgeStatus({
  parcours,
  isAuditor,
}: Input): AuditBadgeStatus | null {
  if (!parcours) return null;

  const { status } = parcours;

  if (status === 'non_demandee') return null;
  if (status === 'audit_en_cours') return 'auditInProgress';
  if (isPremiereEtoileDemandeEnCours(parcours)) return null;
  if (status === 'demande_envoyee' && !isAuditor) return 'auditRequested';
  if (status === 'demande_envoyee')
    return parcours.auditeurs.length >= 1 ? 'auditAssigned' : null;

  if (isAuditor) return 'auditCompleted';

  const availability = canStartNewAuditCycle(parcours);
  if (availability.canRequest) return null;
  return badgeStatusByUnavailabilityReason[availability.reason];
}
