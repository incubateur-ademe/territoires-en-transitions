import {
  ActionsGroupedById,
  HiddenActionSummary,
  ListActionsDynamicStateResult,
  ListActionsGroupedByIdResult,
} from './action-with-score.schema';
import { ListActionDefinitionsOutput } from './actions/list-action-definitions.output';

/**
 * Fusionne les définitions d'un référentiel (partie statique) et l'état d'une
 * collectivité (partie dynamique) pour reconstituer la liste complète des
 * actions.
 *
 * Une action présente d'un seul côté (snapshot calculé sur une version
 * antérieure du référentiel, par exemple) est ignorée, et retirée des
 * `childrenIds` de son parent.
 */
export function mergeActionDefinitionsAndState(
  definitions: ListActionDefinitionsOutput,
  state: ListActionsDynamicStateResult
): ListActionsGroupedByIdResult {
  const { definitionsById } = definitions;
  const isMergeable = (actionId: string) =>
    Object.prototype.hasOwnProperty.call(definitionsById, actionId) &&
    Object.prototype.hasOwnProperty.call(state.actionsById, actionId);

  const actionsById: ActionsGroupedById = {};

  for (const actionId in state.actionsById) {
    if (!isMergeable(actionId)) {
      continue;
    }

    const actionState = state.actionsById[actionId];
    const childrenIds = actionState.childrenIds.filter(isMergeable);

    actionsById[actionId] = {
      ...definitionsById[actionId],
      ...actionState,
      childrenIds,
      childrenIdsWithExprScore: childrenIds.filter((childId) =>
        Boolean(definitionsById[childId].exprScore?.trim())
      ),
    };
  }

  const hiddenActions: HiddenActionSummary[] = [];
  for (const actionId of state.hiddenActionIds) {
    const definition = definitionsById[actionId];
    if (definition) {
      hiddenActions.push({
        actionId,
        identifiant: definition.identifiant,
        nom: definition.nom,
      });
    }
  }

  return { actionsById, hiddenActions };
}
