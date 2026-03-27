import {
  ActionId,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';
import { ActionListItem } from './use-list-actions';
import { useListActionsGroupedById } from './use-list-actions-grouped-by-id';

export type ActionWithDescendants = ActionListItem & {
  children: ActionWithDescendants[];
};

function actionWithDescendantsFromMap(
  actions: Record<ActionId, ActionListItem>,
  id: ActionId
): ActionWithDescendants | undefined {
  const action = actions[id];
  if (!action) {
    return;
  }

  const children = action.childrenIds
    .map((childId) =>
      actionWithDescendantsFromMap(actions, childId as ActionId)
    )
    .filter((node): node is ActionWithDescendants => node !== undefined);

  return { ...action, children };
}

export function useGetActionWithDescendants({
  actionId,
}: {
  actionId: ActionId;
}): ActionWithDescendants | undefined {
  const referentielId = getReferentielIdFromActionId(actionId);

  const [{ data: actions }] = useListActionsGroupedById({
    referentielIds: [referentielId],
  });

  if (!actions) {
    return;
  }

  return actionWithDescendantsFromMap(actions, actionId);
}
