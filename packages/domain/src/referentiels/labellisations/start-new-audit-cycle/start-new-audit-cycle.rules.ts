import { match } from 'ts-pattern';
import { ParcoursLabellisation } from '../parcours-labellisation.schema';
import { StartNewAuditCycleRulesErrors } from './start-new-audit-cycle.rules-errors';

type ParcoursForCycleAvailability = Pick<
  ParcoursLabellisation,
  'status' | 'demande' | 'labellisation'
> | null;

type CycleAvailability =
  | { canRequest: true; reason: null }
  | { canRequest: false; reason: StartNewAuditCycleRulesErrors };

export function canStartNewAuditCycle(
  parcours: ParcoursForCycleAvailability
): CycleAvailability {
  if (!parcours) return { canRequest: true, reason: null };

  return match(parcours.status)
    .returnType<CycleAvailability>()
    .with('non_demandee', () => ({ canRequest: true, reason: null }))
    .with('demande_envoyee', () => ({
      canRequest: false,
      reason: 'AUDIT_REQUEST_PENDING',
    }))
    .with('audit_en_cours', () => ({
      canRequest: false,
      reason: 'AUDIT_IN_PROGRESS',
    }))
    .with('audit_valide', () => availabilityAfterValidatedAudit(parcours))
    .exhaustive();
}

function availabilityAfterValidatedAudit(
  parcours: Pick<ParcoursLabellisation, 'demande' | 'labellisation'>
): CycleAvailability {
  if (parcours.demande?.sujet === 'cot')
    return { canRequest: true, reason: null };

  if (isLabellisationDone(parcours)) {
    return { canRequest: true, reason: null };
  }

  return { canRequest: false, reason: 'LABELLISATION_IN_PROGRESS' };
}

function isLabellisationDone(
  parcours: Pick<ParcoursLabellisation, 'labellisation' | 'demande'>
): boolean {
  const obtenueLe = parcours.labellisation?.obtenue_le;
  const envoyeeLe = parcours.demande?.envoyee_le;
  if (obtenueLe == null || envoyeeLe == null) {
    return false;
  }
  return new Date(obtenueLe) > new Date(envoyeeLe);
}
