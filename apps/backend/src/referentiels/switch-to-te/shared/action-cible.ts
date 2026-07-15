import { type CorrelatedAction } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine.dto';
import { type ReferentielResponse } from '@tet/backend/referentiels/get-referentiel/get-referentiel.service';
import {
  ActionTypeEnum,
  flatMapActionsEnfants,
  type ActionScore,
  type ReferentielId,
} from '@tet/domain/referentiels';
import { CorrelatedActionWithScore } from '../../correlated-actions/referentiel-action-origine-with-score.dto';
import {
  buildCorrelatedActionsWithScore,
  dedupeOrigines,
  filterOriginesConcernees,
} from './action-origine';

/**
 * Action destination de la bascule + origines résolues depuis les snapshots pre-switch-te.
 * Artefact runtime backend — ne pas confondre avec ActionOrigine (entité BDD @tet/domain).
 */
export type ActionCible = {
  actionId: string;
  /** false si désactivée / non concernée par personnalisation TE */
  concernee: boolean;
  /** origines brutes (ordre arbre) — pour tri CAE puis ECI côté rules */
  actionsOrigine: CorrelatedAction[];
  /** origines avec score snapshot + filtre concerne !== false */
  originesConcernees: CorrelatedActionWithScore[];
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

export const getPointPotentiel = (
  scoreMap: Map<string, ActionScore>,
  actionId: string
): number => {
  const score = scoreMap.get(actionId);
  return score?.pointPotentiel ?? score?.pointReferentiel ?? 0;
};

const buildActionCible = (
  actionId: string,
  actionsOrigine: CorrelatedAction[],
  scoreMapsByReferentiel: Map<ReferentielId, Map<string, ActionScore>>,
  teScoreMap: Map<string, ActionScore>
): ActionCible => {
  const correlatedActions = buildCorrelatedActionsWithScore(
    actionsOrigine,
    scoreMapsByReferentiel
  );

  return {
    actionId,
    concernee: isCibleConcernee(teScoreMap, actionId),
    actionsOrigine,
    originesConcernees: filterOriginesConcernees(
      correlatedActions,
      scoreMapsByReferentiel
    ),
  };
};

export const listSousActionsEtTachesCibles = (input: {
  referentielTe: ReferentielResponse;
  scoreMapsByReferentiel: Map<ReferentielId, Map<string, ActionScore>>;
  teScoreMap: Map<string, ActionScore>;
}): ActionCible[] => {
  const teActionsWithOrigine = flatMapActionsEnfants(
    input.referentielTe.itemsTree
  ).filter(
    (action) =>
      (action.actionType === ActionTypeEnum.SOUS_ACTION ||
        action.actionType === ActionTypeEnum.TACHE) &&
      (action.actionsOrigine?.length ?? 0) > 0
  );

  return teActionsWithOrigine.map((teAction) =>
    buildActionCible(
      teAction.actionId,
      teAction.actionsOrigine ?? [],
      input.scoreMapsByReferentiel,
      input.teScoreMap
    )
  );
};

export const listMesuresCibles = (input: {
  referentielTe: ReferentielResponse;
  scoreMapsByReferentiel: Map<ReferentielId, Map<string, ActionScore>>;
  teScoreMap: Map<string, ActionScore>;
}): ActionCible[] => {
  const mesures = flatMapActionsEnfants(input.referentielTe.itemsTree).filter(
    (action) => action.actionType === ActionTypeEnum.ACTION
  );

  return mesures.flatMap((mesure) => {
    const subtree = flatMapActionsEnfants(mesure);
    const actionsOrigine = dedupeOrigines(
      subtree.flatMap((node) => node.actionsOrigine ?? [])
    );

    if (actionsOrigine.length === 0) {
      return [];
    }

    return [
      buildActionCible(
        mesure.actionId,
        actionsOrigine,
        input.scoreMapsByReferentiel,
        input.teScoreMap
      ),
    ];
  });
};
