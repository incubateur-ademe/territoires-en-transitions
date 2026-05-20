import { ParcoursLabellisation } from '../parcours-labellisation.schema';
import { StartNewAuditCycleRulesErrors } from './start-new-audit-cycle.rules-errors';

type ParcoursForCycleAvailability = Pick<
  ParcoursLabellisation,
  'status' | 'demande' | 'labellisation'
> | null;

export function canStartNewAuditCycle(
  parcours: ParcoursForCycleAvailability
):
  | { canRequest: true; reason: null }
  | { canRequest: false; reason: StartNewAuditCycleRulesErrors } {
  if (!parcours) return { canRequest: true, reason: null };

  if (parcours.status === 'demande_envoyee') {
    return { canRequest: false, reason: 'AUDIT_REQUEST_PENDING' };
  }

  if (parcours.status === 'audit_en_cours') {
    return { canRequest: false, reason: 'AUDIT_IN_PROGRESS' };
  }

  if (parcours.status !== 'audit_valide')
    return { canRequest: true, reason: null };

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
  return (
    parcours.labellisation?.obtenue_le != null &&
    parcours.demande?.envoyee_le != null
  );
}
