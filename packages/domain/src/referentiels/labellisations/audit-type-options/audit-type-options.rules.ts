import { SujetDemande, SujetDemandeEnum } from '../labellisation-demande.schema';
import { Etoile, EtoileEnum } from '../labellisation-etoile.enum.schema';
import {
  areAuditPrerequisitesMet,
  AuditPrerequisitesError,
  ParcoursForAuditPrerequisites,
} from '../request-labellisation/request-labellisation.rules';

export type AuditTypeOption =
  | { sujet: SujetDemande; isRequestable: true; reason: null }
  | {
      sujet: SujetDemande;
      isRequestable: false;
      reason: AuditPrerequisitesError;
    };

export const AUDIT_TYPES_BY_ASCENDING_REQUIREMENTS = [
  SujetDemandeEnum.COT,
  SujetDemandeEnum.LABELLISATION_COT,
  SujetDemandeEnum.LABELLISATION,
] as const;

const requiresCot = (sujet: SujetDemande): boolean =>
  sujet === SujetDemandeEnum.COT ||
  sujet === SujetDemandeEnum.LABELLISATION_COT;

const listAvailableSujets = ({
  isCOT,
  maximumRequestableStar,
}: {
  isCOT: boolean;
  maximumRequestableStar: Etoile;
}): readonly SujetDemande[] =>
  maximumRequestableStar < EtoileEnum.DEUXIEME_ETOILE
    ? []
    : AUDIT_TYPES_BY_ASCENDING_REQUIREMENTS.filter(
        (sujet) => isCOT || !requiresCot(sujet)
      );

const toAuditTypeOption = (
  parcours: ParcoursForAuditPrerequisites,
  sujet: SujetDemande,
  maximumRequestableStar: Etoile
): AuditTypeOption => {
  const prerequisites = areAuditPrerequisitesMet(
    parcours,
    sujet,
    sujet === SujetDemandeEnum.COT ? null : maximumRequestableStar
  );

  if (prerequisites.met) {
    return { sujet, isRequestable: true, reason: null };
  }
  return { sujet, isRequestable: false, reason: prerequisites.reason };
};

export const listAuditTypeOptions = (
  parcours: ParcoursForAuditPrerequisites,
  context: { isCOT: boolean; maximumRequestableStar: Etoile }
): AuditTypeOption[] =>
  listAvailableSujets(context).map((sujet) =>
    toAuditTypeOption(parcours, sujet, context.maximumRequestableStar)
  );
