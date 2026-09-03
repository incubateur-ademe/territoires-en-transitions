import {
  ETOILE_MIN_REALISE_SCORE,
  EtoileEnum,
  getIdentifiantFromActionId,
  isAuditLabellisationReferentiel,
  isReferentRoleDefined,
  ParcoursLabellisation,
  canModifyCandidatureDocuments,
  ROLE_IDENTIFIANTS,
  RoleKey,
} from '@tet/domain/referentiels';
import {
  MinimumScoreViewModel,
  Parcours,
  RoleMesures,
  RoleMesureViewModel,
} from './checklist-view-model';

const EMPTY_ROLE_MESURES: RoleMesures = {
  eluReferent: null,
  referentTechnique: null,
};

const extractRoleMesures = (parcours: ParcoursLabellisation): RoleMesures => {
  const referentRolesDefined = parcours.referentRolesDefined;
  if (!isAuditLabellisationReferentiel(parcours.referentiel)) {
    return EMPTY_ROLE_MESURES;
  }

  const mappingForReferentiel = ROLE_IDENTIFIANTS[parcours.referentiel];
  const critereByIdentifiant = new Map(
    parcours.criteresAction.map((critereAction) => [
      getIdentifiantFromActionId(critereAction.actionId) ??
        critereAction.actionId,
      critereAction,
    ])
  );

  const toRoleMesure = (
    identifiant: string,
    roleKey: RoleKey
  ): RoleMesureViewModel | null => {
    const critere = critereByIdentifiant.get(identifiant);
    if (!critere) {
      return null;
    }
    return {
      actionId: critere.actionId,
      done: critere.atteint && referentRolesDefined[roleKey],
    };
  };

  return {
    eluReferent: toRoleMesure(mappingForReferentiel.eluReferent, 'eluReferent'),
    referentTechnique: toRoleMesure(
      mappingForReferentiel.referentTechnique,
      'referentTechnique'
    ),
  };
};

const getMinimumScore = (
  critereScore: ParcoursLabellisation['critereScore'],
  etoiles: ParcoursLabellisation['etoiles']
): MinimumScoreViewModel => {
  if (etoiles > 1) {
    return {
      done: critereScore.atteint,
      seuilPercent: Math.round(critereScore.scoreARealiser * 100),
    };
  }
  const seuilDeuxiemeEtoile =
    ETOILE_MIN_REALISE_SCORE[EtoileEnum.DEUXIEME_ETOILE];
  return {
    done: critereScore.scoreFait >= seuilDeuxiemeEtoile,
    seuilPercent: Math.round(seuilDeuxiemeEtoile * 100),
  };
};

export const parcoursToChecklist = (
  parcours: ParcoursLabellisation,
  canMutateLabellisationDocuments: boolean
): Parcours => {
  return {
    etoileObjectif: parcours.etoiles,
    completude: { done: parcours.completudeOk },
    minimumScore: getMinimumScore(parcours.critereScore, parcours.etoiles),
    scoreFait: parcours.critereScore.scoreFait,
    mesures: [...parcours.criteresAction]
      .sort((a, b) => a.priorite - b.priorite)
      .map((critereAction) => ({
        actionId: critereAction.actionId,
        identifiant:
          getIdentifiantFromActionId(critereAction.actionId) ??
          critereAction.actionId,
        formulation: critereAction.formulation,
        done:
          critereAction.atteint &&
          isReferentRoleDefined(
            critereAction,
            parcours.referentiel,
            parcours.referentRolesDefined
          ),
        minRealisePercentage: critereAction.minRealisePercentage,
        minProgrammePercentage: critereAction.minProgrammePercentage,
      })),
    roleMesures: extractRoleMesures(parcours),
    acteEngagement: {
      demandeId: parcours.demande?.id ?? null,
    },
    canModifyCandidatureDocuments: canModifyCandidatureDocuments({
      audit: parcours.audit ? { valide: parcours.audit.valide } : null,
      canMutateLabellisationDocuments,
    }),
  };
};
