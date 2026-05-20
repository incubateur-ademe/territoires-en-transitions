import {
  canStartNewAuditCycle,
  ParcoursLabellisation,
} from '@tet/domain/referentiels';
import { AuditBadgeStatus, AuditViewerRole } from './types';

type Input = {
  parcours: ParcoursLabellisation | null;
  viewerRole: AuditViewerRole;
};

export function parcoursToAuditBadgeStatus({
  parcours,
  viewerRole,
}: Input): AuditBadgeStatus | null {
  if (!parcours) return null;
  if (viewerRole === 'other') return null;

  const { status } = parcours;

  if (status === 'non_demandee') return null;
  if (status === 'audit_en_cours') return 'auditInProgress';
  if (status === 'demande_envoyee' && viewerRole === 'auditee') return 'auditRequested';
  if (status === 'demande_envoyee') {
    return parcours.auditeurs.length >= 1 ? 'auditAssigned' : null;
  }

  // status === 'audit_valide' (les autres ont été traités plus haut)
  if (viewerRole === 'auditor') return 'auditCompleted';

  const availability = canStartNewAuditCycle(parcours);
  if (
    !availability.canRequest &&
    availability.reason === 'LABELLISATION_IN_PROGRESS'
  ) {
    return 'auditCompletedLabellisationInProgress';
  }
  return null;
}
