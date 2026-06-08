import {
  getIdentifiantFromActionId,
  isAuditLabellisationReferentiel,
  isRolePilotePresent,
  ParcoursLabellisation,
  peutModifierDocumentsCandidature,
  ROLE_IDENTIFIANTS,
  RoleKey,
  RolePilotesPresence,
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
  parcours: ParcoursLabellisation,
  rolePilotesPresence: RolePilotesPresence
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
      done: critere.atteint && rolePilotesPresence[roleKey],
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

export const parcoursToChecklist = (
  parcours: ParcoursLabellisation,
  rolePilotesPresence: RolePilotesPresence
): Parcours => {
  return {
    maximumRequestableStar: parcours.etoiles,
    completude: { done: parcours.completude_ok },
    scoreMinimum:
      parcours.etoiles > 1
        ? {
            done: parcours.critere_score.atteint,
            seuilPercent: Math.round(
              parcours.critere_score.score_a_realiser * 100
            ),
          }
        : null,
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
          isRolePilotePresent(
            critereAction,
            parcours.referentiel,
            rolePilotesPresence
          ),
        minRealisePercentage: critereAction.min_realise_percentage,
        minProgrammePercentage: critereAction.min_programme_percentage,
      })),
    roleMesures: extractRoleMesures(parcours, rolePilotesPresence),
    acteEngagement: {
      signed: parcours.conditionFichiers.atteint,
      demandeId: parcours.demande?.id ?? null,
    },
    peutModifierDocumentsCandidature: peutModifierDocumentsCandidature({
      audit: parcours.audit ? { valide: parcours.audit.valide } : null,
    }),
  };
};
