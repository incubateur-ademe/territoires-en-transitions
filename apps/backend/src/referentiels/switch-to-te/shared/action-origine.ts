import { type CorrelatedActionWithScore } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine-with-score.dto';
import { type CorrelatedAction } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine.dto';
import {
  ReferentielIdEnum,
  rollUpActionIdToActionLevel,
  type ActionScore,
  type ActionScoreWithOnlyPointsAndStatuts,
  type ActionType,
  type ReferentielId,
} from '@tet/domain/referentiels';

export type ActionOrigineRef = {
  referentielId: ReferentielId;
  actionId: string;
};

/** déduplique par actionId — première occurrence conservée */
export const dedupeOrigines = (
  origines: CorrelatedAction[]
): CorrelatedAction[] => {
  const seen = new Set<string>();
  const result: CorrelatedAction[] = [];

  for (const origine of origines) {
    if (seen.has(origine.actionId)) {
      continue;
    }
    seen.add(origine.actionId);
    result.push(origine);
  }

  return result;
};

/** CAE puis ECI, ordre d'entrée préservé dans chaque groupe — autres origines ignorées */
export const sortByReferentielOrder = <T extends { referentielId: string }>(
  items: T[]
): T[] => {
  const cae: T[] = [];
  const eci: T[] = [];

  for (const item of items) {
    if (item.referentielId === ReferentielIdEnum.CAE) {
      cae.push(item);
    } else if (item.referentielId === ReferentielIdEnum.ECI) {
      eci.push(item);
    }
  }

  return [...cae, ...eci];
};

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

export const resolveMesureOrigineId = (
  origine: ActionOrigineRef,
  hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>
): string => {
  const hierarchie = hierarchiesByReferentielId.get(origine.referentielId);
  if (!hierarchie) {
    return origine.actionId;
  }

  return rollUpActionIdToActionLevel(origine.actionId, hierarchie);
};

export const collectMesureOrigineIds = (
  origines: ActionOrigineRef[],
  hierarchiesByReferentielId: ReadonlyMap<ReferentielId, ActionType[]>
): Set<string> =>
  new Set(
    origines.map((origine) =>
      resolveMesureOrigineId(origine, hierarchiesByReferentielId)
    )
  );
