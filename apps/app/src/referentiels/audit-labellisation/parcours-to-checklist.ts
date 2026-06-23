import {
  ETOILE_MIN_REALISE_SCORE,
  EtoileEnum,
  getIdentifiantFromActionId,
  isAuditLabellisationReferentiel,
  isReferentRoleDefined,
  ParcoursLabellisation,
  canModifyCandidatureDocuments,
  ReferentRolesDefined,
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

const extractRoleMesures = (
  parcours: ParcoursLabellisation,
  referentRolesDefined: ReferentRolesDefined
): RoleMesures => {
  if (!isAuditLabellisationReferentiel(parcours.referentiel)) {
    return EMPTY_ROLE_MESURES;
  }

  const mappingForReferentiel = ROLE_IDENTIFIANTS[parcours.referentiel];
  const critereByIdentifiant = new Map(
    parcours.criteres_action.map((critereAction) => [
      getIdentifiantFromActionId(critereAction.action_id) ??
        critereAction.action_id,
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
      actionId: critere.action_id,
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
  critereScore: ParcoursLabellisation['critere_score'],
  etoiles: ParcoursLabellisation['etoiles']
): MinimumScoreViewModel => {
  if (etoiles > 1) {
    return {
      done: critereScore.atteint,
      seuilPercent: Math.round(critereScore.score_a_realiser * 100),
    };
  }
  const seuilDeuxiemeEtoile =
    ETOILE_MIN_REALISE_SCORE[EtoileEnum.DEUXIEME_ETOILE];
  return {
    done: critereScore.score_fait >= seuilDeuxiemeEtoile,
    seuilPercent: Math.round(seuilDeuxiemeEtoile * 100),
  };
};

export const parcoursToChecklist = (
  parcours: ParcoursLabellisation,
  referentRolesDefined: ReferentRolesDefined
): Parcours => {
  return {
    etoileObjectif: parcours.etoiles,
    completude: { done: parcours.completude_ok },
    minimumScore: getMinimumScore(parcours.critere_score, parcours.etoiles),
    scoreFait: parcours.critere_score.score_fait,
    mesures: [...parcours.criteres_action]
      .sort((a, b) => a.priorite - b.priorite)
      .map((critereAction) => ({
        actionId: critereAction.action_id,
        identifiant:
          getIdentifiantFromActionId(critereAction.action_id) ??
          critereAction.action_id,
        formulation: critereAction.formulation,
        done:
          critereAction.atteint &&
          isReferentRoleDefined(
            critereAction,
            parcours.referentiel,
            referentRolesDefined
          ),
        minRealisePercentage: critereAction.min_realise_percentage,
        minProgrammePercentage: critereAction.min_programme_percentage,
      })),
    roleMesures: extractRoleMesures(parcours, referentRolesDefined),
    acteEngagement: {
      signed: parcours.conditionFichiers.atteint,
      demandeId: parcours.demande?.id ?? null,
    },
    canModifyCandidatureDocuments: canModifyCandidatureDocuments({
      audit: parcours.audit ? { valide: parcours.audit.valide } : null,
    }),
  };
};
