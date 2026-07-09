import {
  type ActionScore,
  type ActionTreeNode,
} from '@tet/domain/referentiels';

/**
 * Indexe récursivement un arbre de scores en Map actionId → ActionScore.
 * Extrait de ScoresService.fillScoreMap pour réutilisation hors service.
 */
export const buildScoreMapByActionId = <
  T extends { actionId: string; score: ActionScore },
>(
  root: ActionTreeNode<T>
): Map<string, ActionScore> => {
  const scoreMap = new Map<string, ActionScore>();

  const visit = (action: ActionTreeNode<T>) => {
    scoreMap.set(action.actionId, action.score);
    for (const child of action.actionsEnfant) {
      visit(child as ActionTreeNode<T>);
    }
  };

  visit(root);
  return scoreMap;
};
