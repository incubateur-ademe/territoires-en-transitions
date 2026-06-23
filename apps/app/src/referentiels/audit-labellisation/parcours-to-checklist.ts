import {
  getIdentifiantFromActionId,
  isAuditLabellisationReferentiel,
  ParcoursLabellisation,
  ROLE_IDENTIFIANTS,
} from '@tet/domain/referentiels';
import {
  Parcours,
  RoleMesures,
  RoleMesureViewModel,
} from './checklist-view-model';

const EMPTY_ROLE_MESURES: RoleMesures = {
  eluReferent: null,
  referentTechnique: null,
};

const extractRoleMesures = (
  parcours: ParcoursLabellisation
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

  const toRoleMesure = (identifiant: string): RoleMesureViewModel | null => {
    const critere = critereByIdentifiant.get(identifiant);
    if (!critere) {
      return null;
    }
    return { actionId: critere.action_id, done: critere.atteint };
  };

  return {
    eluReferent: toRoleMesure(mappingForReferentiel.eluReferent),
    referentTechnique: toRoleMesure(mappingForReferentiel.referentTechnique),
  };
};

export const parcoursToChecklist = (
  parcours: ParcoursLabellisation
): Parcours => {
  return {
    etoileObjectif: parcours.etoiles,
    completude: { done: parcours.completude_ok },
    minimumScore:
      parcours.etoiles > 1
        ? {
            done: parcours.critere_score.atteint,
            seuilPercent: Math.round(
              parcours.critere_score.score_a_realiser * 100
            ),
          }
        : null,
    mesures: [...parcours.criteres_action]
      .sort((a, b) => a.priorite - b.priorite)
      .map((critereAction) => ({
        actionId: critereAction.action_id,
        identifiant:
          getIdentifiantFromActionId(critereAction.action_id) ??
          critereAction.action_id,
        formulation: critereAction.formulation,
        done: critereAction.atteint,
        minRealisePercentage: critereAction.min_realise_percentage,
        minProgrammePercentage: critereAction.min_programme_percentage,
      })),
    roleMesures: extractRoleMesures(parcours),
    acteEngagement: {
      signed: parcours.conditionFichiers.atteint,
      demandeId: parcours.demande?.id ?? null,
    },
  };
};
