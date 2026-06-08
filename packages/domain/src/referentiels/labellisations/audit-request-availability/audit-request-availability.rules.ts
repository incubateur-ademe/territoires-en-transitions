import { availableAuditTypes } from '../available-audit-types/available-audit-types';
import { SujetDemandeEnum } from '../labellisation-demande.schema';
import { Etoile } from '../labellisation-etoile.enum.schema';
import { ParcoursLabellisation } from '../parcours-labellisation.schema';
import {
  areAuditPrerequisitesMet,
  ParcoursForAuditPrerequisites,
} from '../request-labellisation/request-labellisation.rules';
import {
  isRolePilotePresent,
  RolePilotesPresence,
} from '../role-mesures/role-mesures';
import { canStartNewAuditCycle } from '../start-new-audit-cycle/start-new-audit-cycle.rules';
import { StartNewAuditCycleRulesErrors } from '../start-new-audit-cycle/start-new-audit-cycle.rules-errors';

export type ParcoursForAuditRequest = Pick<
  ParcoursLabellisation,
  'status' | 'demande' | 'labellisation' | 'referentiel'
> &
  Omit<ParcoursForAuditPrerequisites, 'criteres_action'> & {
    criteres_action: Pick<
      ParcoursLabellisation['criteres_action'][number],
      'atteint' | 'action_id'
    >[];
  };

export type AuditRequestUnavailableReason =
  | { kind: 'cycleUnavailable'; cause: StartNewAuditCycleRulesErrors }
  | { kind: 'noRequestableAuditType' }
  | { kind: 'prerequisitesIncomplete' }
  | { kind: 'rolePilotesIncomplete' };

export type AuditRequestAvailability =
  | { canRequest: true; reason: null }
  | { canRequest: false; reason: AuditRequestUnavailableReason };

export function getAuditRequestAvailability(
  parcours: ParcoursForAuditRequest,
  {
    isCOT,
    maximumRequestableStar,
    rolePilotesPresence,
  }: {
    isCOT: boolean;
    maximumRequestableStar: Etoile;
    rolePilotesPresence: RolePilotesPresence;
  }
): AuditRequestAvailability {
  const cycleAvailability = canStartNewAuditCycle(parcours);
  if (!cycleAvailability.canRequest) {
    return {
      canRequest: false,
      reason: { kind: 'cycleUnavailable', cause: cycleAvailability.reason },
    };
  }

  const requestableAuditTypes = availableAuditTypes({
    isCOT,
    canRequestLabellisation: maximumRequestableStar >= 2,
  });
  if (requestableAuditTypes.length === 0) {
    return { canRequest: false, reason: { kind: 'noRequestableAuditType' } };
  }

  const hasSatisfiedPrerequisites = requestableAuditTypes.some(
    (sujet) =>
      areAuditPrerequisitesMet(
        parcours,
        sujet,
        sujet === SujetDemandeEnum.COT ? null : maximumRequestableStar
      ).met
  );
  if (!hasSatisfiedPrerequisites) {
    return { canRequest: false, reason: { kind: 'prerequisitesIncomplete' } };
  }

  const rolePilotesComplete = parcours.criteres_action.every((critere) =>
    isRolePilotePresent(critere, parcours.referentiel, rolePilotesPresence)
  );
  if (!rolePilotesComplete) {
    return { canRequest: false, reason: { kind: 'rolePilotesIncomplete' } };
  }

  return { canRequest: true, reason: null };
}
