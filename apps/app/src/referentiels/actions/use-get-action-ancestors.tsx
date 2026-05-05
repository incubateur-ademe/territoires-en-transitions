import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { ActionListItem } from './use-list-actions';
import { useListActionsGroupedById } from './use-list-actions-grouped-by-id';

export function useGetActionAncestors({ actionId }: { actionId: string }) {
  const referentielId = getReferentielIdFromActionId(actionId);

  const [{ data: actions }] = useListActionsGroupedById({
    referentielIds: [referentielId],
  });

  if (!actions) {
    return undefined;
  }

  // recursively get parents until root action;
  const ancestors: ActionListItem[] = [];
  let currentAction: ActionListItem | null = actions[actionId];

  while (currentAction) {
    ancestors.push(currentAction);
    currentAction = currentAction.parentId
      ? actions[currentAction.parentId]
      : null;
  }

  return ancestors;
}
