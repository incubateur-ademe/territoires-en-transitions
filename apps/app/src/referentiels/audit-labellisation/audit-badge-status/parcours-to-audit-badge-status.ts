import {
  canStartNewAuditCycle,
  ParcoursLabellisation,
  StartNewAuditCycleRulesErrors,
} from '@tet/domain/referentiels';
import { match } from 'ts-pattern';
import { isPremiereEtoileDemandePending } from '../premiere-etoile-demande-pending';
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

const submittedRequestBadge = (
  parcours: ParcoursForAuditBadge,
  isAuditor: boolean
): AuditBadgeStatus | null => {
  if (isPremiereEtoileDemandePending(parcours)) return null;
  if (!isAuditor) return 'auditRequested';
  return parcours.auditeurs.length >= 1 ? 'auditAssigned' : null;
};

const validatedAuditBadge = (
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

  return match(parcours.status)
    .returnType<AuditBadgeStatus | null>()
    .with('non_demandee', () => null)
    .with('demande_envoyee', () => submittedRequestBadge(parcours, isAuditor))
    .with('audit_en_cours', () => 'auditInProgress')
    .with('audit_valide', () => validatedAuditBadge(parcours, isAuditor))
    .exhaustive();
}
