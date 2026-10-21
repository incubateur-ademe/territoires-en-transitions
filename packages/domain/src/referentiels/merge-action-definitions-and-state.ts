import {
  ActionsGroupedById,
  HiddenActionSummary,
  ListActionsDynamicStateResult,
  ListActionsGroupedByIdResult,
} from './action-with-score.schema';
import { applyActionTextOverrides } from './actions/action-text-overrides.schema';
import { ListActionDefinitionsOutput } from './actions/list-action-definitions.output';
import { ListActionTextOverridesOutput } from './actions/list-action-text-overrides.output';

/**
 * Fusionne les définitions d'un référentiel (partie statique) et l'état d'une
 * collectivité (partie dynamique) pour reconstituer la liste complète des
 * actions.
 *
 * Une action présente d'un seul côté (snapshot calculé sur une version
 * antérieure du référentiel, par exemple) est ignorée, et retirée des
 * `childrenIds` de son parent.
 *
 * `textOverrides` (textes rendus pour le profil de la collectivité)
 * remplace les textes balisés ; il est ignoré s'il ne correspond pas à la
 * version des définitions.
 */
export function mergeActionDefinitionsAndState(
  definitions: ListActionDefinitionsOutput,
  state: ListActionsDynamicStateResult,
  textOverrides?: ListActionTextOverridesOutput
): ListActionsGroupedByIdResult {
  const { definitionsById } = definitions;
  const overridesById =
    textOverrides?.referentielVersion === definitions.referentielVersion
      ? textOverrides.overridesById
      : {};
  const getDefinition = (actionId: string) =>
    applyActionTextOverrides(
      definitionsById[actionId],
      Object.hasOwn(overridesById, actionId)
        ? overridesById[actionId]
        : undefined
    );
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
      ...getDefinition(actionId),
      ...actionState,
      childrenIds,
      childrenIdsWithExprScore: childrenIds.filter((childId) =>
        Boolean(definitionsById[childId].exprScore?.trim())
      ),
    };
  }

  const hiddenActions: HiddenActionSummary[] = [];
  for (const actionId of state.hiddenActionIds) {
    if (Object.hasOwn(definitionsById, actionId)) {
      const definition = getDefinition(actionId);
      hiddenActions.push({
        actionId,
        identifiant: definition.identifiant,
        nom: definition.nom,
      });
    }
  }

  return { actionsById, hiddenActions };
}
