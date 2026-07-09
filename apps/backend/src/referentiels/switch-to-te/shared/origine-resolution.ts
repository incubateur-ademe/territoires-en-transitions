import { type CorrelatedActionWithScore } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine-with-score.dto';
import { type CorrelatedAction } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine.dto';
import {
  type ActionScore,
  type ActionScoreWithOnlyPointsAndStatuts,
  type ReferentielId,
} from '@tet/domain/referentiels';

export const isOrigineConcernee = (actionScore: ActionScore): boolean =>
  actionScore.concerne !== false;

export const actionScoreToCorrelatedActionScore = (
  actionScore: ActionScore
): ActionScoreWithOnlyPointsAndStatuts => ({
  pointFait: actionScore.pointFait || 0,
  pointProgramme: actionScore.pointProgramme || 0,
  pointPasFait: actionScore.pointPasFait || 0,
  pointNonRenseigne: actionScore.pointNonRenseigne || 0,
  pointPotentiel: actionScore.pointPotentiel || 0,
  pointReferentiel: actionScore.pointReferentiel || 0,
  totalTachesCount: actionScore.totalTachesCount || 0,
  faitTachesAvancement: actionScore.faitTachesAvancement || 0,
  programmeTachesAvancement: actionScore.programmeTachesAvancement || 0,
  pasFaitTachesAvancement: actionScore.pasFaitTachesAvancement || 0,
  pasConcerneTachesAvancement: actionScore.pasConcerneTachesAvancement || 0,
  ...(actionScore.etoiles !== undefined
    ? { etoiles: actionScore.etoiles }
    : {}),
});

export const buildCorrelatedActionsWithScore = (
  actionsOrigine: CorrelatedAction[],
  scoreMapsByReferentiel: Map<ReferentielId, Map<string, ActionScore>>
): CorrelatedActionWithScore[] =>
  actionsOrigine.map((origine) => {
    const scoreMap = scoreMapsByReferentiel.get(
      origine.referentielId as ReferentielId
    );
    const actionScore = scoreMap?.get(origine.actionId);

    return {
      ...origine,
      score: actionScore
        ? actionScoreToCorrelatedActionScore(actionScore)
        : null,
    };
  });

export const filterOriginesConcernees = (
  correlatedActions: CorrelatedActionWithScore[],
  scoreMapsByReferentiel: Map<ReferentielId, Map<string, ActionScore>>
): CorrelatedActionWithScore[] =>
  correlatedActions.filter((origine) => {
    const scoreMap = scoreMapsByReferentiel.get(
      origine.referentielId as ReferentielId
    );
    if (!scoreMap) {
      return false;
    }

    const actionScore = scoreMap.get(origine.actionId);
    if (!actionScore) {
      return false;
    }

    return isOrigineConcernee(actionScore);
  });

export const getPointPotentiel = (
  scoreMap: Map<string, ActionScore>,
  actionId: string
): number => {
  const score = scoreMap.get(actionId);
  return score?.pointPotentiel ?? score?.pointReferentiel ?? 0;
};

export const isCibleConcernee = (
  teScoreMap: Map<string, ActionScore>,
  actionId: string
): boolean => {
  const score = teScoreMap.get(actionId);
  if (!score) {
    return true;
  }

  return score.concerne !== false;
};
