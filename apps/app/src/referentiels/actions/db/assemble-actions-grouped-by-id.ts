import {
  ActionId,
  ActionsGroupedById,
  ActionStaticDefinition,
  HiddenActionSummary,
  ListActionsGroupedByIdResult,
} from '@tet/domain/referentiels';
import { ActionStateRow } from './action-states.collection';

/** Ligne de la jointure définitions ⋈ état, triée par position */
export type JoinedActionRow = {
  definition: ActionStaticDefinition;
  state: ActionStateRow;
};

/**
 * Retire les propriétés virtuelles (`$key`, `$synced`…) que TanStack DB ajoute
 * aux lignes des live queries, y compris aux objets joints.
 */
function withoutVirtualProps<T extends object>(row: T): T {
  const {
    $key: _key,
    $synced: _synced,
    $origin: _origin,
    $hasPendingWrites: _hasPendingWrites,
    $collectionId: _collectionId,
    ...rest
  } = row as T & Record<`$${string}`, unknown>;
  return rest as T;
}

/**
 * Reconstitue le résultat de `listActionsGroupedById` à partir de la jointure
 * (live query) des définitions et de l'état d'un référentiel.
 *
 * Même règle que `mergeActionDefinitionsAndState` : une action présente d'un
 * seul côté n'est pas dans la jointure, et elle est retirée des `childrenIds`
 * de son parent.
 */
export function assembleActionsGroupedById(
  joinedRows: JoinedActionRow[],
  hiddenActionIds: ActionId[],
  getDefinition: (actionId: ActionId) => ActionStaticDefinition | undefined
): ListActionsGroupedByIdResult {
  const definitionsById = new Map(
    joinedRows.map(({ definition }) => [definition.actionId, definition])
  );

  const actionsById: ActionsGroupedById = {};
  for (const row of joinedRows) {
    const definition = withoutVirtualProps(row.definition);
    // `position` ne sert qu'au tri de la jointure
    const { position: _position, ...actionState } = withoutVirtualProps(
      row.state
    );
    const childrenIds = actionState.childrenIds.filter((childId) =>
      definitionsById.has(childId)
    );

    actionsById[definition.actionId] = {
      ...definition,
      ...actionState,
      childrenIds,
      childrenIdsWithExprScore: childrenIds.filter((childId) =>
        Boolean(definitionsById.get(childId)?.exprScore?.trim())
      ),
    };
  }

  // dans l'ordre de `hiddenActionIds` ; un id sans définition est ignoré
  const hiddenActions: HiddenActionSummary[] = [];
  for (const actionId of hiddenActionIds) {
    const definition = getDefinition(actionId);
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
