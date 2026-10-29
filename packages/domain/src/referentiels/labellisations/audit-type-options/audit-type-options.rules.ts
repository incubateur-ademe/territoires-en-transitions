import {
  SujetDemande,
  SujetDemandeEnum,
} from '../labellisation-demande.schema';
import { EtoileEnum } from '../labellisation-etoile.enum.schema';
import {
  areAuditPrerequisitesMet,
  AuditPrerequisitesError,
  ParcoursForAuditPrerequisites,
} from '../request-labellisation/request-labellisation.rules';

export type AuditTypeUnavailableReason =
  | AuditPrerequisitesError
  | 'SCORE_BELOW_AUDITABLE_STAR';

export type AuditTypeOption =
  | { sujet: SujetDemande; isRequestable: true; reason: null }
  | {
      sujet: SujetDemande;
      isRequestable: false;
      reason: AuditTypeUnavailableReason;
    };

export const AUDIT_TYPES_BY_ASCENDING_REQUIREMENTS = [
  SujetDemandeEnum.COT,
  SujetDemandeEnum.LABELLISATION_COT,
  SujetDemandeEnum.LABELLISATION,
] as const;

const requiresCot = (sujet: SujetDemande): boolean =>
  sujet === SujetDemandeEnum.COT ||
  sujet === SujetDemandeEnum.LABELLISATION_COT;

const requiresAuditableStar = (sujet: SujetDemande): boolean =>
  sujet !== SujetDemandeEnum.COT;

const listAvailableSujets = (isCOT: boolean): readonly SujetDemande[] =>
  AUDIT_TYPES_BY_ASCENDING_REQUIREMENTS.filter(
    (sujet) => isCOT || !requiresCot(sujet)
  );

const toAuditTypeOption = (
  parcours: ParcoursForAuditPrerequisites,
  sujet: SujetDemande
): AuditTypeOption => {
  if (
    requiresAuditableStar(sujet) &&
    parcours.etoiles < EtoileEnum.DEUXIEME_ETOILE
  ) {
    return {
      sujet,
      isRequestable: false,
      reason: 'SCORE_BELOW_AUDITABLE_STAR',
    };
  }

  const prerequisites = areAuditPrerequisitesMet(
    parcours,
    sujet,
    requiresAuditableStar(sujet) ? parcours.etoiles : null
  );

  if (prerequisites.met) {
    return { sujet, isRequestable: true, reason: null };
  }
  return { sujet, isRequestable: false, reason: prerequisites.reason };
};

export const listAuditTypeOptions = (
  parcours: ParcoursForAuditPrerequisites,
  context: { isCOT: boolean }
): AuditTypeOption[] =>
  listAvailableSujets(context.isCOT).map((sujet) =>
    toAuditTypeOption(parcours, sujet)
  );
