import { type CorrelatedAction } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine.dto';
import { type CorrelatedActionWithScore } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine-with-score.dto';
import { type ReferentielResponse } from '@tet/backend/referentiels/get-referentiel/get-referentiel.service';
import {
  ActionTypeEnum,
  flatMapActionsEnfants,
  type ActionScore,
  type ReferentielId,
} from '@tet/domain/referentiels';
import {
  buildCorrelatedActionsWithScore,
  filterOriginesConcernees,
  isCibleConcernee,
} from './origine.rules';

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

export const listActionCiblesSousActionsEtTaches = (input: {
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

  return teActionsWithOrigine.map((teAction) => {
    const actionsOrigine = teAction.actionsOrigine ?? [];
    const correlatedActions = buildCorrelatedActionsWithScore(
      actionsOrigine,
      input.scoreMapsByReferentiel
    );

    return {
      actionId: teAction.actionId,
      concernee: isCibleConcernee(input.teScoreMap, teAction.actionId),
      actionsOrigine,
      originesConcernees: filterOriginesConcernees(
        correlatedActions,
        input.scoreMapsByReferentiel
      ),
    };
  });
};
